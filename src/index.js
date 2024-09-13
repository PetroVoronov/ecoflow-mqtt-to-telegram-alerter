const {Api, TelegramClient} = require('telegram');
const {Telegraf} = require('telegraf');
const {StoreSession} = require('telegram/sessions');
const readline = require('node:readline/promises');
const {stdin: input, stdout: output, exit} = require('node:process');
const stringify = require('json-stringify-safe');
const {LocalStorage} = require('node-localstorage');
const yargs = require('yargs');
const {Cache} = require('./modules/cache/Cache');
const {logLevelInfo, logLevelDebug, setLogLevel, logDebug, logInfo, logWarning, logError} = require('./modules/logging/logging');
const {name: scriptName, version: scriptVersion} = require('./version');
const i18n = require('./modules/i18n/i18n.config');
const axios = require('axios');
const {v4: uuidv4} = require('uuid');
const mqtt = require('mqtt');
const fs = require('node:fs');
const { log } = require('node:console');

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

setLogLevel(options.debug ? logLevelDebug : logLevelInfo);

logInfo(`Starting ${scriptName} v${scriptVersion} ...`);

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

const ecoflowAPIURL = 'https://api.ecoflow.com',
  ecoflowAPIAuthenticationPath = '/auth/login',
  ecoflowAPICertificationPath = '/iot-auth/app/certification',
  headers = {lang: 'en_US', 'content-type': 'application/json'},
  ecoflowAPI = axios.create({
    baseURL: ecoflowAPIURL,
    timeout: 10000,
  }),
  ecoflowMQTTKeepAliveInterval = options.keepAlive * 1000,
  ecoflowMQTTLogAliveInterval = options.logAliveStatusInterval * 60 * 1000;

const ecoFlowACInput = 'inv.acIn',
  ecoFlowACInputVoltage = `${ecoFlowACInput}Vol`,
  ecoFlowACInputFrequency = `${ecoFlowACInput}Freq`,
  ecoFlowACInputCurrent = `${ecoFlowACInput}Amp`;

let mqttClient = null,
  mqttOptions = null,
  ecoflowTopic = '/app/device/property/',
  telegramClient = null,
  lastMQTTMessageTimeStamp = new Date().getTime(),
  lastAliveInfoMessageTimeStamp = new Date().getTime();

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
                    logError(`Error: ${error}`);
                    rl.close();
                    reject(error);
                  });
              })
              .catch((error) => {
                logError(`Error: ${error}`);
                rl.close();
                reject(error);
              });
          })
          .catch((error) => {
            logError(`Error: ${error}`);
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
              logError(`Error: ${error}`);
              rl.close();
              reject(error);
            });
        })
        .catch((error) => {
          logError(`Error: ${error}`);
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
          logError(`Error: ${error}`);
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
              logError(`Error: ${error}`);
              rl.close();
              reject(error);
            });
        })
        .catch((error) => {
          logError(`Error: ${error}`);
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
                logError(`Telegram client error: ${error}`);
              },
            })
            .then(() => {
              rl.close();
              logDebug('Telegram client is connected');
              client.setParseMode(parseMode);
              resolve(client);
            })
            .catch((error) => {
              rl.close();
              logError(`Telegram client connection error: ${error}`);
              reject(error);
            });
        })
        .catch((error) => {
          logError(`API attributes error: ${error}!`);
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
          const client = new Telegraf(token);
          resolve(client);
        })
        .catch((error) => {
          logError(`Bot Auth Token error: ${error}`);
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
        logDebug(`Migrating user session file: user/${file} to ${newFile}`);
        fs.renameSync(`data/session/user/${file}`, `data/session/${newFile}`);
      });
      logDebug('User session migrated successfully.');
      fs.rmdirSync('data/session/user');
    } else {
      logDebug('User session not found. Nothing to migrate.');
    }
  } catch (error) {
    if (error.syscall === 'stat' && error.code === 'ENOENT' && error.path === 'data/session/user') {
      logDebug('User session not found. Nothing to migrate.');
    } else {
      logError(`Error migrating user session: ${error}`);
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
        logDebug(`Error removing bot session: ${error}`);
      }
    }
  }
}

function getTelegramTargetEntity() {
  return new Promise((resolve, reject) => {
    if (options.asUser === false) {
      telegramClient.telegram
        .getChat(telegramChatId)
        .then((entity) => {
          targetTitle = entity.title || `${entity.first_name || ''} ${entity.last_name || ''} (${entity.username || ''})`;
          logDebug(`Telegram chat "${targetTitle}" with ID ${telegramChatId} found!`);
          resolve(entity);
        })
        .catch((error) => {
          logWarning(`Telegram chat with ID ${telegramChatId} not found! Error: ${error}`);
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
                      logDebug(`Telegram topic "${targetTopic.title}" in chat "${targetTitle}" with ID ${telegramChatId} found!`);
                      resolve(targetDialog.entity);
                    } else {
                      logWarning(`Topic with id ${telegramTopicId} not found in "${targetTitle}" (${telegramChatId})!`);
                      reject(new Error(`Topic with id ${telegramTopicId} not found in "${targetTitle}" (${telegramChatId})!`));
                    }
                  } else {
                    logWarning(`No topics found in "${targetTitle}" (${telegramChatId})!`);
                    reject(new Error(`No topics found in "${targetTitle}" (${telegramChatId})!`));
                  }
                })
                .catch((error) => {
                  reject(error);
                });
            } else {
              logDebug(`Telegram chat "${targetTitle}" with ID ${telegramChatId} found!`);
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
                logError(`Telegram target entity error: ${error}`);
                reject(error);
              });
          })
          .catch((error) => {
            logError(`Message target IDs error: ${error}`);
            reject(error);
          });
      })
      .catch((error) => {
        logError(`Telegram client error: ${error}`);
        reject(error);
      });
  });
}

function telegramMessageOnChange(currentInputState) {
  const timeStampOptions = {timeStyle: 'short', dateStyle: 'short'};
  if (options.timeZone) {
    timeStampOptions.timeZone = options.timeZone;
  }
  const timeStamp = new Date().toLocaleString(options.language, timeStampOptions),
    messageText =
      (options.addTimestamp ? timeStamp + ': ' : '') + i18n.__(currentInputState ? 'Electricity is returned' : 'Electricity is cut off');

  logInfo(`${messageText}`);
  if (telegramClient !== null) {
    if (options.asUser === true) {
      const telegramMessage = {
        message: messageText,
      };
      if (telegramTopicId > 0) {
        telegramMessage.replyTo = telegramTopicId;
      }
      telegramClient
        .sendMessage(targetEntity, telegramMessage)
        .then((message) => {
          logDebug(`Telegram message sent to "${targetTitle}" with topic ${telegramTopicId}`);
          const previousMessageId = cache.getItem('lastMessageId');
          cache.setItem('lastMessageId', message.message_id);
          if (options.pinMessage) {
            telegramClient
              .pinMessage(targetEntity, message.id)
              .then(() => {
                logDebug(`Telegram message pinned to "${targetTitle}" with topic ${telegramTopicId}`);
                if (options.unpinPrevious) {
                  if (previousMessageId !== undefined) {
                    telegramClient.unpinMessage(targetEntity, previousMessageId).then(() => {
                      logDebug(`Telegram message unpinned from "${targetTitle}" with topic ${telegramTopicId}`);
                    });
                  }
                }
              })
              .catch((error) => {
                logError(`Telegram message pin error: ${error}`);
              });
          }
          cache.setItem('lastMessageId', message.id);
        })
        .catch((error) => {
          logError(`Telegram message error: ${error}`);
        });
    } else {
      const messageOptions = {
        parse_mode: parseMode,
      };
      if (telegramTopicId > 0) {
        messageOptions.message_thread_id = telegramTopicId;
      }
      telegramClient.telegram
        .sendMessage(telegramChatId, messageText, messageOptions)
        .then((message) => {
          logDebug(`Telegram message sent to "${targetTitle}" with topic ${telegramTopicId}`);
          const previousMessageId = cache.getItem('lastMessageId');
          cache.setItem('lastMessageId', message.message_id);
          if (options.pinMessage) {
            telegramClient.telegram
              .pinChatMessage(telegramChatId, message.message_id)
              .then(() => {
                logDebug(`Telegram message pinned to "${targetTitle}" with topic ${telegramTopicId}`);
                if (options.unpinPrevious) {
                  if (previousMessageId !== undefined) {
                    telegramClient.telegram.unpinChatMessage(targetTitle, previousMessageId).then(() => {
                      logDebug(`Telegram message unpinned from "${targetTitle}" with topic ${telegramTopicId}`);
                    });
                  }
                }
              })
              .catch((error) => {
                logError(`Telegram message pin error: ${error}`);
              });
          }
        })
        .catch((error) => {
          logError(`Telegram message error: ${error}`);
        });
    }
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
    const inputVoltage = data.params[ecoFlowACInputVoltage] / 1000,
      inputCurrent = data.params[ecoFlowACInputCurrent] / 1000,
      inputFrequency = data.params[ecoFlowACInputFrequency],
      currentInputState = inputVoltage > 0 && inputCurrent > 0 && inputFrequency > 0;
    let inputACConnectionState = cache.getItem('inputACConnectionState');
    logDebug(`Ecoflow AC input voltage: ${inputVoltage} V`);
    logDebug(`Ecoflow AC input current: ${inputCurrent} A`);
    logDebug(`Ecoflow AC input frequency: ${inputFrequency} Hz`);
    if (currentInputState !== inputACConnectionState) {
      cache.setItem('inputACConnectionState', currentInputState);
      telegramMessageOnChange(currentInputState);
    }
  }
}

function mqttSetMainHandlers() {
  mqttClient.on('connect', () => {
    logInfo('Ecoflow MQTT broker is connected ...');
    mqttSubscribe();
  });
  mqttClient.on('reconnect', () => {
    logInfo('Ecoflow MQTT broker is reconnecting ...');
  });
  mqttClient.on('error', (error) => {
    logError(`Ecoflow MQTT broker error: ${error}`);
    gracefulExit();
  });
  mqttClient.on('close', () => {
    logInfo('Ecoflow MQTT broker is closed ...');
  });
  mqttClient.on('offline', () => {
    logInfo('Ecoflow MQTT broker is offline ...');
  });
  mqttClient.on('end', () => {
    logInfo('Ecoflow MQTT broker is ended ...');
  });
}

function mqttKeepAliveCheck() {
  const currentTimeStamp = new Date().getTime();
  if (currentTimeStamp - lastMQTTMessageTimeStamp > ecoflowMQTTKeepAliveInterval) {
    logWarning(`Ecoflow MQTT client is not alive for ${options.keepAlive} seconds!`);
    mqttClient.reconnect();
  } else if (ecoflowMQTTLogAliveInterval > 0 && currentTimeStamp - lastAliveInfoMessageTimeStamp > ecoflowMQTTLogAliveInterval) {
    lastAliveInfoMessageTimeStamp = currentTimeStamp;
    logInfo(`Ecoflow MQTT client is alive!`);
  } else {
    logDebug(`Ecoflow MQTT client is alive!`);
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
        logInfo(`Ecoflow MQTT client is alive!`);
      }, ecoflowMQTTLogAliveInterval);
    }
  }
}

function mqttSubscribe() {
  mqttClient.subscribe(ecoflowTopic, (error) => {
    if (error) {
      logError(`Ecoflow MQTT subscription error: ${error}`);
      gracefulExit();
    } else {
      logInfo(`Ecoflow MQTT subscription is successful. Connecting to Telegram ...`);
      getTelegramPrepared()
        .then(() => {
          logInfo('Telegram is prepared.');
          mqttClient.on('message', mqttSetMessageHandler);
          logInfo('Ecoflow MQTT message handler is set.');
        })
        .catch((error) => {
          logError(`Telegram is not ready: ${error}`);
          gracefulExit();
        });
      mqttKeepAliveInit();
    }
  });
}

function gracefulExit() {
  const exitMqtt = () => {
    if (mqttClient !== null && mqttClient.connected === true) {
      mqttClient.end();
      mqttClient = null;
      logInfo(`Ecoflow MQTT broker is disconnected!`);
    }
    exit(0);
  };
  if (telegramClient !== null && options.asUser === true && telegramClient.connected === true) {
    telegramClient
      .disconnect()
      .then(() => {
        logInfo(`Telegram client is disconnected!`);
        telegramClient
          .destroy()
          .then(() => {
            logInfo(`Telegram client is destroyed!`);
            telegramClient = null;
            exitMqtt();
          })
          .catch((error) => {
            logError(`Telegram client - nothing to destroy!`);
            exitMqtt();
          });
      })
      .catch((error) => {
        logError(`Telegram client is not connected!`);
        exitMqtt();
      });
  } else if (telegramClient !== null && options.user === false) {
    try {
      telegramClient.stop();
      logInfo(`Telegram bot is stopped!`);
      // eslint-disable-next-line sonarjs/no-ignored-exceptions
    } catch (error) {
      logInfo(`Telegram bot is stopped!`);
    }
    exitMqtt();
  } else if (mqttClient !== null && mqttClient.connected === true) {
    exitMqtt();
  } else {
    logInfo('All clients are disconnected!');
    exit(0);
  }
}

function maskString(value) {
  return typeof value === 'string' ? value.substring(0, 3) + '*'.repeat(value.length - 3) : value;
}

process.on('SIGINT', gracefulExit);
process.on('SIGTERM', gracefulExit);

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
        logInfo('Ecoflow authentication is successful. Getting certification ...');
        let token, userId, userName;
        try {
          token = response.data.data.token;
          userId = response.data.data.user.userId;
          userName = response.data.data.user.name;
        } catch (error) {
          throw new Error(`Failed to extract key ${error.message} from response: ${stringify(response)}`);
        }
        logDebug(`Ecoflow token: ${maskString(token)}`);
        logDebug(`Ecoflow userId: ${maskString(userId)}`);
        logDebug(`Ecoflow userName: ${userName}`);
        const headers = {
          lang: 'en_US',
          authorization: `Bearer ${token}`,
        };
        ecoflowAPI
          .get(`${ecoflowAPICertificationPath}?userId=${userId}`, {headers: headers})
          .then((response) => {
            logInfo('Ecoflow certification is successful. Getting MQTT client ...');
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
            logDebug(`Ecoflow MQTT URL: ${mqttUrl}`);
            logDebug(`Ecoflow MQTT port: ${mqttPort}`);
            logDebug(`Ecoflow MQTT protocol: ${mqttProtocol}`);
            logDebug(`Ecoflow MQTT username: ${mqttUsername}`);
            logDebug(`Ecoflow MQTT password: ${maskString(mqttPassword)}`);
            logDebug(`Ecoflow MQTT client ID: ${maskString(mqttClientId)}`);
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
              logInfo('Ecoflow MQTT broker is connected.');
              mqttSetMainHandlers();
            } catch (error) {
              logError(`Ecoflow MQTT broker connection error: ${error}`);
              gracefulExit();
            }
          })
          .catch((error) => {
            logError(`Ecoflow certification error: ${error}`);
            gracefulExit();
          });
      })
      .catch((error) => {
        logError(`Error: ${error}`);
        gracefulExit();
      });
  })
  .catch((error) => {
    logError(`Error: ${error}`);
    gracefulExit();
  });
