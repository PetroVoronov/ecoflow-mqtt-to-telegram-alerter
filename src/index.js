const {Api, TelegramClient} = require('telegram');
const {Api: GrammyApi} = require('grammy');
const {StoreSession} = require('telegram/sessions');
const readline = require('node:readline/promises');
const {stdin: input, stdout: output, exit} = require('node:process');
const stringify = require('json-stringify-safe');
const {LocalStorage} = require('node-localstorage');
const yargs = require('yargs');
const {Cache} = require('./modules/cache/Cache');
const {securedLogger: log} = require('./modules/logging/logging');
const {name: scriptName, version: scriptVersion} = require('./version');
const i18n = require('./modules/i18n/i18n.config');
const axios = require('axios');
const {v4: uuidv4} = require('uuid');
const mqtt = require('mqtt');
const fs = require('node:fs');

const options = yargs
  .usage('Usage: $0 [options]')
  .option('l', {
    alias: 'language',
    describe: 'Language code for i18n',
    type: 'string',
    default: 'en',
    demandOption: false,
  })
  .option('as-user', {
    describe: 'Start as user instance (bot instance by default)',
    type: 'boolean',
    default: false,
    demandOption: false,
  })
  .option('k', {
    alias: 'keep-alive',
    describe: 'Check if is mqtt client is alive every X seconds',
    type: 'number',
    default: 60,
    demandOption: false,
  })
  .option('log-alive-status-interval', {
    describe: 'Log the mqtt client alive status every Y minutes',
    type: 'number',
    default: 0,
    demandOption: false,
  })
  .option('p', {
    alias: 'pin-message',
    describe: 'Unpin message from chat',
    type: 'boolean',
    default: false,
    demandOption: false,
  })
  .option('u', {
    alias: 'unpin-previous',
    describe: 'Pin message to chat',
    type: 'boolean',
    default: false,
    demandOption: false,
  })
  .option('t', {
    alias: 'add-timestamp',
    describe: 'Add timestamp to message',
    type: 'boolean',
    default: false,
    demandOption: false,
  })
  .option('tz', {
    alias: 'time-zone',
    describe: 'Time zone for timestamp',
    type: 'string',
    default: process.env.TZ || '',
    demandOption: false,
  })
  .option('d', {
    alias: 'debug',
    describe: 'Debug level of logging',
    type: 'boolean',
    default: false,
    demandOption: false,
  })
  .version(scriptVersion)
  .help('h')
  .alias('h', 'help')
  .epilog(`${scriptName} v${scriptVersion}`).argv;

if (options.debug) {
  log.setLevel('debug');
}
log.appendMaskWord('apiId', 'apiHash', 'DeviceSN', 'ClientId', 'phone');

log.info(`Starting ${scriptName} v${scriptVersion} ...`);

i18n.setLocale(options.language);

const storage = new LocalStorage('data/storage'),
  cache = new Cache({
    getItem: (key) => storage.getItem(key),
    setItem: (key, value) => storage.setItem(key, value),
    removeItem: (key) => storage.removeItem(key),
  });

if (typeof process.env.TELEGRAM_CHAT_ID === 'string' && process.env.TELEGRAM_CHAT_ID.length > 0) {
  cache.setItem('telegramChatId', parseInt(process.env.TELEGRAM_CHAT_ID));
}
if (typeof process.env.TELEGRAM_TOPIC_ID === 'string' && process.env.TELEGRAM_TOPIC_ID.length > 0) {
  cache.setItem('telegramTopicId', parseInt(process.env.TELEGRAM_TOPIC_ID));
}
let telegramChatId = cache.getItem('telegramChatId', 'number');
let telegramTopicId = cache.getItem('telegramTopicId', 'number');

const botAuthTokenMinimumLength = 43;

let targetEntity = null;
let targetTitle = '';
let parseMode = 'html';

const ecoflowAPIURL = 'https://api.ecoflow.com';
const ecoflowAPIAuthenticationPath = '/auth/login';
const ecoflowAPICertificationPath = '/iot-auth/app/certification';
const headers = {lang: 'en_US', 'content-type': 'application/json'};
const ecoflowAPI = axios.create({
  baseURL: ecoflowAPIURL,
  timeout: 10000,
});
const ecoflowMQTTKeepAliveInterval = options.keepAlive * 1000;
const ecoflowMQTTLogAliveInterval = options.logAliveStatusInterval * 60 * 1000;

const ecoFlowACInput = 'inv.acIn';
const ecoFlowACInputVoltage = `${ecoFlowACInput}Vol`;
const ecoFlowACInputFrequency = `${ecoFlowACInput}Freq`;
const ecoFlowACInputCurrent = `${ecoFlowACInput}Amp`;

let mqttClient = null;
let mqttOptions = null;
let ecoflowTopic = '/app/device/property/';
let telegramClient = null;
let lastMQTTMessageTimeStamp = new Date().getTime();
let lastAliveInfoMessageTimeStamp = new Date().getTime();

function getEcoFlowCredentials() {
  return new Promise((resolve, reject) => {
    if (typeof process.env.ECOFLOW_USERNAME === 'string' && process.env.ECOFLOW_USERNAME.length > 0) {
      cache.setItem('ecoflowUserName', process.env.ECOFLOW_USERNAME);
    }
    if (typeof process.env.ECOFLOW_PASSWORD === 'string' && process.env.ECOFLOW_PASSWORD.length > 0) {
      cache.setItem('ecoflowPassword', process.env.ECOFLOW_PASSWORD);
    }
    if (typeof process.env.ECOFLOW_DEVICE_SN === 'string' && process.env.ECOFLOW_DEVICE_SN.length > 0) {
      cache.setItem('ecoflowDeviceSN', process.env.ECOFLOW_DEVICE_SN);
    }
    const ecoflowUserName = cache.getItem('ecoflowUserName');
    const ecoflowPassword = cache.getItem('ecoflowPassword');
    const ecoflowDeviceSN = cache.getItem('ecoflowDeviceSN');
    if (
      typeof ecoflowUserName !== 'string' ||
      ecoflowUserName.length === 0 ||
      typeof ecoflowPassword !== 'string' ||
      ecoflowPassword.length === 0 ||
      typeof ecoflowDeviceSN !== 'string' ||
      ecoflowDeviceSN.length === 0
    ) {
      const rl = readline.createInterface({
        input,
        output,
      });
      if (ecoflowUserName === null) {
        rl.question('Enter your EcoFlow username: ')
          .then((username) => {
            cache.setItem('ecoflowUserName', username);
            rl.question('Enter your EcoFlow password: ')
              .then((password) => {
                cache.setItem('ecoflowPassword', password);
                rl.question('Enter your EcoFlow device SN: ')
                  // eslint-disable-next-line sonarjs/no-nested-functions
                  .then((deviceSN) => {
                    cache.setItem('ecoflowDeviceSN', deviceSN);
                    rl.close();
                    resolve({ecoflowUserName: username, ecoflowPassword: password, ecoflowDeviceSN: deviceSN});
                  })
                  // eslint-disable-next-line sonarjs/no-nested-functions
                  .catch((error) => {
                    log.error(`Error: ${error}`);
                    rl.close();
                    reject(error);
                  });
              })
              .catch((error) => {
                log.error(`Error: ${error}`);
                rl.close();
                reject(error);
              });
          })
          .catch((error) => {
            log.error(`Error: ${error}`);
            rl.close();
            reject(error);
          });
      }
    } else {
      resolve({ecoflowUserName, ecoflowPassword, ecoflowDeviceSN});
    }
  });
}

function getAPIAttributes() {
  return new Promise((resolve, reject) => {
    const apiId = cache.getItem('telegramApiId', 'number');
    const apiHash = cache.getItem('telegramApiHash', 'string');
    if (typeof apiId !== 'number' || apiId <= 0 || typeof apiHash !== 'string' || apiHash.length < 1) {
      const rl = readline.createInterface({
        input,
        output,
      });
      rl.question('Enter your API ID: ')
        .then((id) => {
          const newApiId = parseInt(id);
          cache.setItem('telegramApiId', newApiId);
          rl.question('Enter your API Hash: ')
            .then((hash) => {
              cache.setItem('telegramApiHash', hash);
              rl.close();
              resolve({apiID: newApiId, hash});
            })
            .catch((error) => {
              log.error(`Error: ${error}`);
              rl.close();
              reject(error);
            });
        })
        .catch((error) => {
          log.error(`Error: ${error}`);
          rl.close();
          reject(error);
        });
    } else {
      resolve({apiId, apiHash});
    }
  });
}

function getBotAuthToken() {
  return new Promise((resolve, reject) => {
    const botAuthToken = cache.getItem('telegramBotAuthToken');
    if (typeof botAuthToken !== 'string' || botAuthToken.length < botAuthTokenMinimumLength) {
      const rl = readline.createInterface({
        input,
        output,
      });
      rl.question('Enter your Bot Auth Token: ')
        .then((token) => {
          cache.setItem('telegramBotAuthToken', token);
          rl.close();
          resolve(token);
        })
        .catch((error) => {
          log.error(`Error: ${error}`);
          rl.close();
          reject(error);
        });
    } else {
      resolve(botAuthToken);
    }
  });
}

function getMessageTargetIds() {
  return new Promise((resolve, reject) => {
    if (typeof telegramChatId !== 'number' || telegramChatId === 0 || typeof telegramTopicId !== 'number') {
      const rl = readline.createInterface({
        input,
        output,
      });
      rl.question('Enter your chat ID: ')
        .then((id) => {
          telegramChatId = parseInt(id);
          cache.setItem('telegramChatId', telegramChatId);
          rl.question('Enter your topic ID(0 - if no topics): ')
            .then((id) => {
              telegramTopicId = parseInt(id);
              cache.setItem('telegramTopicId', id);
              rl.close();
              resolve();
            })
            .catch((error) => {
              log.error(`Error: ${error}`);
              rl.close();
              reject(error);
            });
        })
        .catch((error) => {
          log.error(`Error: ${error}`);
          rl.close();
          reject(error);
        });
    } else {
      resolve();
    }
  });
}

function getTelegramClient() {
  return new Promise((resolve, reject) => {
    if (options.asUser === true) {
      telegramUserSessionMigrate();
      const storeSession = new StoreSession(`data/session`);
      if (typeof process.env.TELEGRAM_API_ID === 'string' && process.env.TELEGRAM_API_ID.length > 0) {
        cache.setItem('telegramApiId', parseInt(process.env.TELEGRAM_API_ID));
      }
      if (typeof process.env.TELEGRAM_API_HASH === 'string' && process.env.TELEGRAM_API_HASH.length > 0) {
        cache.setItem('telegramApiHash', process.env.TELEGRAM_API_HASH);
      }
      getAPIAttributes()
        .then(({apiId, apiHash}) => {
          const client = new TelegramClient(storeSession, apiId, apiHash, {
            connectionRetries: 5,
            useWSS: true,
            connectionTimeout: 10000,
            appVersion: `${scriptName} v${scriptVersion}`,
          });
          const rl = readline.createInterface({
            input,
            output,
          });
          client
            .start({
              phoneNumber: async () => {
                return rl.question('Enter your phone number: ');
              },
              phoneCode: async () => {
                return rl.question('Enter the code sent to your phone: ');
              },
              password: async () => {
                return rl.question('Enter your password: ');
              },
              onError: (error) => {
                log.error(`Telegram client error: ${error}`);
              },
            })
            .then(() => {
              rl.close();
              log.debug('Telegram client is connected');
              client.setParseMode(parseMode);
              resolve(client);
            })
            .catch((error) => {
              rl.close();
              log.error(`Telegram client connection error: ${error}`);
              reject(error);
            });
        })
        .catch((error) => {
          log.error(`API attributes error: ${error}!`);
          reject(error);
        });
    } else {
      if (
        typeof process.env.TELEGRAM_BOT_AUTH_TOKEN === 'string' &&
        process.env.TELEGRAM_BOT_AUTH_TOKEN.length >= botAuthTokenMinimumLength
      ) {
        cache.setItem('telegramBotAuthToken', process.env.TELEGRAM_BOT_AUTH_TOKEN);
      }
      getBotAuthToken()
        .then((token) => {
          const client = new GrammyApi(token);
          resolve(client);
        })
        .catch((error) => {
          log.error(`Bot Auth Token error: ${error}`);
          reject(error);
        });
    }
  });
}

function telegramUserSessionMigrate() {
  let oldSessionsExists = false;
  try {
    if (fs.statSync('data/session/user').isDirectory() === true) {
      oldSessionsExists = true;
      fs.readdirSync('data/session/user').forEach((file) => {
        const newFile = file.replace('%2F' + 'user', '');
        log.debug(`Migrating user session file: user/${file} to ${newFile}`);
        fs.renameSync(`data/session/user/${file}`, `data/session/${newFile}`);
      });
      log.debug('User session migrated successfully.');
      fs.rmdirSync('data/session/user');
    } else {
      log.debug('Old user session not found. Nothing to migrate.');
    }
  } catch (error) {
    if (error.syscall === 'stat' && error.code === 'ENOENT' && error.path === 'data/session/user') {
      log.debug('Old user session not found. Nothing to migrate.');
    } else {
      log.error(`Error migrating user session: ${error}`);
      gracefulExit();
    }
  }
  if (oldSessionsExists) {
    try {
      if (fs.statSync('data/session/bot').isDirectory() === true) {
        fs.rmSync('data/session/bot', {recursive: true, force: true});
      }
    } catch (error) {
      if (!(error.syscall === 'stat' && error.code === 'ENOENT' && error.path === 'data/session/bot')) {
        log.debug(`Error removing bot session: ${error}`);
      }
    }
  }
}

function getTelegramTargetEntity() {
  return new Promise((resolve, reject) => {
    if (options.asUser === false) {
      telegramClient
        .getChat(telegramChatId)
        .then((entity) => {
          targetTitle = entity.title || `${entity.first_name || ''} ${entity.last_name || ''} (${entity.username || ''})`;
          log.debug(`Telegram chat "${targetTitle}" with ID ${telegramChatId} found!`);
          resolve(entity);
        })
        .catch((error) => {
          log.warn(`Telegram chat with ID ${telegramChatId} not found! Error: ${error}`);
          reject(error);
        });
    } else {
      telegramClient
        .getDialogs()
        .then((dialogs) => {
          let chatId = telegramChatId > 0 ? telegramChatId : -telegramChatId;
          if (chatId > 1000000000000) {
            chatId = chatId - 1000000000000;
          }
          const availableDialogs = dialogs.filter(
              (dialog) => dialog.entity?.migratedTo === undefined || dialog.entity?.migratedTo === null,
            ),
            targetDialog = availableDialogs.find((item) => `${chatId}` === `${item.entity.id}`);
          if (targetDialog !== undefined) {
            targetTitle =
              targetDialog.entity.title ||
              `${targetDialog.entity.firstName || ''} ${targetDialog.entity.lastName || ''} (${targetDialog.entity.username || ''})`;
            if (telegramTopicId > 0) {
              telegramClient
                .invoke(
                  new Api.channels.GetForumTopics({
                    channel: targetDialog.entity,
                    limit: 100,
                    offsetId: 0,
                    offsetDate: 0,
                    addOffset: 0,
                  }),
                )
                .then((response) => {
                  if (Array.isArray(response.topics) && response.topics.length > 0) {
                    // eslint-disable-next-line sonarjs/no-nested-functions
                    const targetTopic = response.topics.find((topic) => topic.id === telegramTopicId);
                    if (targetTopic) {
                      log.debug(`Telegram topic "${targetTopic.title}" in chat "${targetTitle}" with ID ${telegramChatId} found!`);
                      resolve(targetDialog.entity);
                    } else {
                      log.warn(`Topic with id ${telegramTopicId} not found in "${targetTitle}" (${telegramChatId})!`);
                      reject(new Error(`Topic with id ${telegramTopicId} not found in "${targetTitle}" (${telegramChatId})!`));
                    }
                  } else {
                    log.warn(`No topics found in "${targetTitle}" (${telegramChatId})!`);
                    reject(new Error(`No topics found in "${targetTitle}" (${telegramChatId})!`));
                  }
                })
                .catch((error) => {
                  reject(error);
                });
            } else {
              log.debug(`Telegram chat "${targetTitle}" with ID ${telegramChatId} found!`);
              resolve(targetDialog.entity);
            }
          } else {
            reject(new Error(`Telegram chat with ID ${telegramChatId} not found`));
          }
        })
        .catch((error) => {
          reject(error);
        });
    }
  });
}

function getTelegramPrepared() {
  return new Promise((resolve, reject) => {
    getTelegramClient()
      .then((client) => {
        telegramClient = client;
        getMessageTargetIds()
          .then(() => {
            getTelegramTargetEntity()
              // eslint-disable-next-line sonarjs/no-nested-functions
              .then((entity) => {
                targetEntity = entity;
                resolve();
              })
              // eslint-disable-next-line sonarjs/no-nested-functions
              .catch((error) => {
                log.error(`Telegram target entity error: ${error}`);
                reject(error);
              });
          })
          .catch((error) => {
            log.error(`Message target IDs error: ${error}`);
            reject(error);
          });
      })
      .catch((error) => {
        log.error(`Telegram client error: ${error}`);
        reject(error);
      });
  });
}

function telegramSendMessage(target, messages, messageOptions) {
  return new Promise((resolve, reject) => {
    if (telegramClient !== null) {
      telegramClient
        .sendMessage(target, messages, messageOptions)
        .then((message) => {
          resolve(options.asUser === true ? message.id : message.message_id);
        })
        .catch((error) => {
          reject(error);
        });
    } else {
      reject(new Error('Telegram client is not ready!'));
    }
  });
}

function telegramPinMessage(target, messageId) {
  return new Promise((resolve, reject) => {
    if (telegramClient !== null) {
      if (options.asUser === true) {
        telegramClient
          .pinMessage(target, messageId)
          .then(() => {
            resolve();
          })
          .catch((error) => {
            reject(error);
          });
      } else {
        telegramClient
          .pinChatMessage(target, messageId)
          .then(() => {
            resolve();
          })
          .catch((error) => {
            reject(error);
          });
      }
    } else {
      reject(new Error('Telegram client is not ready!'));
    }
  });
}

function telegramUnpinMessage(target, messageId) {
  return new Promise((resolve, reject) => {
    if (telegramClient !== null) {
      if (options.asUser === true) {
        telegramClient
          .unpinMessage(target, messageId)
          .then(() => {
            resolve();
          })
          .catch((error) => {
            reject(error);
          });
      } else {
        telegramClient
          .unpinChatMessage(target, messageId)
          .then(() => {
            resolve();
          })
          .catch((error) => {
            reject(error);
          });
      }
    } else {
      reject(new Error('Telegram client is not ready!'));
    }
  });
}

function telegramMessageOnChange(currentInputState) {
  const inputACConnectionState = cache.getItem('inputACConnectionState');
  if (currentInputState !== inputACConnectionState && telegramClient !== null) {
    const timeStampOptions = {timeStyle: 'short', dateStyle: 'short'};
    if (options.timeZone) {
      timeStampOptions.timeZone = options.timeZone;
    }
    const timeStamp = new Date().toLocaleString(options.language, timeStampOptions),
      messageText =
        (options.addTimestamp ? timeStamp + ': ' : '') + i18n.__(currentInputState ? 'Electricity is returned' : 'Electricity is cut off');

    log.info(`${messageText}`);
    let telegramMessage;
    let telegramTarget;
    let messageOptions;
    if (options.asUser === true) {
      telegramMessage = {
        message: messageText,
      };
      if (telegramTopicId > 0) {
        telegramMessage.replyTo = telegramTopicId;
      }
      telegramTarget = targetEntity;
    } else {
      telegramMessage = messageText;
      telegramTarget = telegramChatId;
      messageOptions = {
        parse_mode: parseMode,
      };
      if (telegramTopicId > 0) {
        messageOptions.message_thread_id = telegramTopicId;
      }
    }
    telegramSendMessage(telegramTarget, telegramMessage, messageOptions)
      .then((messageId) => {
        log.debug(`Telegram message sent to "${targetTitle}" with topic ${telegramTopicId}`);
        const previousMessageId = cache.getItem('lastMessageId');
        cache.setItem('lastMessageId', messageId);
        if (options.pinMessage) {
          telegramPinMessage(telegramTarget, messageId)
            .then(() => {
              log.debug(`Telegram message with id: ${messageId} pinned to "${targetTitle}" with topic ${telegramTopicId}`);
              if (options.unpinPrevious) {
                if (previousMessageId !== undefined && previousMessageId !== null) {
                  telegramUnpinMessage(telegramTarget, previousMessageId).then(() => {
                    log.debug(`Telegram message with id: ${previousMessageId} unpinned from "${targetTitle}" with topic ${telegramTopicId}`);
                  })
                  .catch((error) => {
                    log.error(`Telegram message unpin error: ${error}`);
                  });
                }
              }
            })
            .catch((error) => {
              log.error(`Telegram message pin error: ${error}`);
            });
        }
      })
      .catch((error) => {
        log.error(`Telegram message error: ${error}`);
      });
    cache.setItem('inputACConnectionState', currentInputState);
  }
}

function mqttSetMessageHandler(topic, message) {
  const data = JSON.parse(message.toString());
  if (
    typeof data.params?.[ecoFlowACInputVoltage] === 'number' &&
    typeof data.params?.[ecoFlowACInputFrequency] === 'number' &&
    typeof data.params?.[ecoFlowACInputCurrent] === 'number'
  ) {
    lastMQTTMessageTimeStamp = new Date().getTime();
    const inputVoltage = data.params[ecoFlowACInputVoltage] / 1000;
    const inputCurrent = data.params[ecoFlowACInputCurrent] / 1000;
    const inputFrequency = data.params[ecoFlowACInputFrequency];
    const currentInputState = inputVoltage > 0 && inputCurrent > 0 && inputFrequency > 0;
    log.debug(`Ecoflow AC input voltage: ${inputVoltage} V`);
    log.debug(`Ecoflow AC input current: ${inputCurrent} A`);
    log.debug(`Ecoflow AC input frequency: ${inputFrequency} Hz`);
    telegramMessageOnChange(currentInputState);
  }
}

function mqttSetMainHandlers() {
  mqttClient.on('connect', () => {
    log.info('Ecoflow MQTT broker is connected ...');
    mqttSubscribe();
  });
  mqttClient.on('message', mqttSetMessageHandler);
  mqttClient.on('reconnect', () => {
    log.info('Ecoflow MQTT broker is reconnecting ...');
  });
  mqttClient.on('error', (error) => {
    log.error(`Ecoflow MQTT broker error: ${error}`);
    gracefulExit();
  });
  mqttClient.on('close', () => {
    log.info('Ecoflow MQTT broker is closed ...');
  });
  mqttClient.on('offline', () => {
    log.info('Ecoflow MQTT broker is offline ...');
  });
  mqttClient.on('end', () => {
    log.info('Ecoflow MQTT broker is ended ...');
  });
}

function mqttKeepAliveCheck() {
  const currentTimeStamp = new Date().getTime();
  if (currentTimeStamp - lastMQTTMessageTimeStamp > ecoflowMQTTKeepAliveInterval) {
    log.warn(`Ecoflow MQTT client is not alive for ${options.keepAlive} seconds!`);
    mqttClient.reconnect();
  } else if (ecoflowMQTTLogAliveInterval > 0 && currentTimeStamp - lastAliveInfoMessageTimeStamp > ecoflowMQTTLogAliveInterval) {
    lastAliveInfoMessageTimeStamp = currentTimeStamp;
    log.info(`Ecoflow MQTT client is alive!`);
  } else {
    log.debug(`Ecoflow MQTT client is alive!`);
  }
}

function mqttKeepAliveInit() {
  if (mqttClient !== null) {
    if (options.keepAlive > 0) {
      lastMQTTMessageTimeStamp = new Date().getTime();
      setInterval(mqttKeepAliveCheck, ecoflowMQTTKeepAliveInterval);
    }
    if (ecoflowMQTTLogAliveInterval > 0) {
      setInterval(() => {
        log.info(`Ecoflow MQTT client is alive!`);
      }, ecoflowMQTTLogAliveInterval);
    }
  }
}

function mqttSubscribe() {
  mqttClient.subscribe(ecoflowTopic, (error) => {
    if (error) {
      log.error(`Ecoflow MQTT subscription error: ${error}`);
      gracefulExit();
    } else {
      log.info(`Ecoflow MQTT subscription is successful. Connecting to Telegram ...`);
      mqttKeepAliveInit();
    }
  });
}

function gracefulExit() {
  const exitMqtt = () => {
    if (mqttClient !== null && mqttClient.connected === true) {
      mqttClient.end();
      mqttClient = null;
      log.info(`Ecoflow MQTT broker is disconnected!`);
    }
    exit(0);
  };
  if (telegramClient !== null && options.asUser === true && telegramClient.connected === true) {
    telegramClient
      .disconnect()
      .then(() => {
        log.info(`Telegram client is disconnected!`);
        telegramClient
          .destroy()
          .then(() => {
            log.info(`Telegram client is destroyed!`);
            telegramClient = null;
            exitMqtt();
          })
          .catch((error) => {
            log.error(`Telegram client - nothing to destroy!`);
            exitMqtt();
          });
      })
      .catch((error) => {
        log.error(`Telegram client is not connected!`);
        exitMqtt();
      });
  } else if (telegramClient !== null && options.user === false) {
    try {
      telegramClient.stop();
      log.info(`Telegram bot is stopped!`);
      // eslint-disable-next-line sonarjs/no-ignored-exceptions
    } catch (error) {
      log.info(`Telegram bot is stopped!`);
    }
    exitMqtt();
  } else if (mqttClient !== null && mqttClient.connected === true) {
    exitMqtt();
  } else {
    log.info('All clients are disconnected!');
    exit(0);
  }
}

process.on('SIGINT', gracefulExit);
process.on('SIGTERM', gracefulExit);

getTelegramPrepared()
  .then(() => {
    log.info('Telegram is prepared. Ready to receive MQTT messages!');
    getEcoFlowCredentials()
      .then(({ecoflowUserName, ecoflowPassword, ecoflowDeviceSN}) => {
        ecoflowAPI
          .post(
            ecoflowAPIAuthenticationPath,
            {
              email: ecoflowUserName,
              password: Buffer.from(ecoflowPassword).toString('base64'),
              scene: 'IOT_APP',
              userType: 'ECOFLOW',
            },
            {headers: headers},
          )
          .then((response) => {
            log.info('Ecoflow authentication is successful. Getting certification ...');
            let token, userId, userName;
            try {
              token = response.data.data.token;
              userId = response.data.data.user.userId;
              userName = response.data.data.user.name;
            } catch (error) {
              throw new Error(`Failed to extract key ${error.message} from response: ${stringify(response)}`);
            }
            log.debug(`Ecoflow `, {token});
            log.debug(`Ecoflow `, {userId});
            log.debug(`Ecoflow `, {userName});
            const headers = {
              lang: 'en_US',
              authorization: `Bearer ${token}`,
            };
            ecoflowAPI
              .get(`${ecoflowAPICertificationPath}?userId=${userId}`, {headers: headers})
              .then((response) => {
                log.info('Ecoflow certification is successful. Getting MQTT client ...');
                let mqttUrl, mqttPort, mqttProtocol, mqttUsername, mqttPassword, mqttClientId;
                try {
                  mqttUrl = response.data.data.url;
                  mqttPort = parseInt(response.data.data.port, 10); // Ensure port is an integer
                  mqttProtocol = response.data.data.protocol;
                  mqttUsername = response.data.data.certificateAccount;
                  mqttPassword = response.data.data.certificatePassword;
                  // Generate a unique MQTT client ID
                  mqttClientId = `ANDROID_${uuidv4().toUpperCase()}_${userId}`;
                } catch (error) {
                  throw new Error(`Failed to extract key ${error.message} from response: ${stringify(response)}`);
                }
                log.debug(`Ecoflow MQTT URL: ${mqttUrl}`);
                log.debug(`Ecoflow MQTT port: ${mqttPort}`);
                log.debug(`Ecoflow MQTT protocol: ${mqttProtocol}`);
                log.debug(`Ecoflow `, {mqttUsername});
                log.debug(`Ecoflow `, {mqttUsername});
                log.debug(`Ecoflow `, {mqttClientId});

                const connectMQTTUrl = `${mqttProtocol}://${mqttUrl}:${mqttPort}`;
                mqttOptions = {
                  clientId: mqttClientId,
                  clean: true,
                  connectTimeout: 4000,
                  username: mqttUsername,
                  password: mqttPassword,
                  reconnectPeriod: 1000,
                  protocol: mqttProtocol,
                };
                ecoflowTopic += ecoflowDeviceSN;
                try {
                  mqttClient = mqtt.connect(connectMQTTUrl, mqttOptions);
                  log.info('Ecoflow MQTT broker is connected.');
                  mqttSetMainHandlers();
                } catch (error) {
                  log.error(`Ecoflow MQTT broker connection error: ${error}`);
                  gracefulExit();
                }
              })
              .catch((error) => {
                log.error(`Ecoflow certification error: ${error}`);
                gracefulExit();
              });
          })
          .catch((error) => {
            log.error(`Error: ${error}`);
            gracefulExit();
          });
      })
      .catch((error) => {
        log.error(`Error: ${error}`);
        gracefulExit();
      });
  })
  .catch((error) => {
    log.error(`Telegram is not ready: ${error}`);
    gracefulExit();
  });
