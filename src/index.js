const {Api, TelegramClient} = require('telegram');
const {StringSession, StoreSession} = require('telegram/sessions');
const readline = require('node:readline/promises');
const {stdin: input, stdout: output, exit} = require('node:process');
const stringify = require('json-stringify-safe');
const {LocalStorage} = require('node-localstorage');
const yargs = require('yargs');
const {Cache} = require('./modules/cache/Cache');
const {logLevelInfo, logLevelDebug, setLogLevel, logDebug, logInfo, logWarning, logError} = require('./modules/logging/logging');
const {NewMessage, NewMessageEvent} = require('telegram/events');
const {CallbackQuery, CallbackQueryEvent} = require('telegram/events/CallbackQuery');
const {name: scriptName, version: scriptVersion} = require('./version');
const i18n = require('./modules/i18n/i18n.config');
const axios = require('axios');
const {v4: uuidv4} = require('uuid');
const mqtt = require('mqtt');

const storage = new LocalStorage('data/storage'),
  cache = new Cache({
    getItem: (key) => storage.getItem(key),
    setItem: (key, value) => storage.setItem(key, value),
    removeItem: (key) => storage.removeItem(key),
  });

let ecoflowUserName = process.env.ECOFLOW_USERNAME || cache.getItem('ecoflowUserName'),
  ecoflowPassword = process.env.ECOFLOW_PASSWORD || cache.getItem('ecoflowPassword'),
  ecoflowDeviceSN = process.env.ECOFLOW_DEVICE_SN || cache.getItem('ecoflowDeviceSN'),
  apiId = parseInt(process.env.TELEGRAM_API_ID) || cache.getItem('telegramApiId', 'number'),
  apiHash = process.env.TELEGRAM_API_HASH || cache.getItem('telegramApiHash'),
  botAuthToken = process.env.TELEGRAM_BOT_AUTH_TOKEN || cache.getItem('telegramBotAuthToken'),
  chatId = process.env.TELEGRAM_CHAT_ID || cache.getItem('telegramChatId'),
  topicId = parseInt(process.env.TELEGRAM_TOPIC_ID) || cache.getItem('telegramTopicId', 'number'),
  targetEntity;

if (ecoflowUserName) cache.setItem('ecoflowUserName', ecoflowUserName);
if (ecoflowPassword) cache.setItem('ecoflowPassword', ecoflowPassword);
if (ecoflowDeviceSN) cache.setItem('ecoflowDeviceSN', ecoflowDeviceSN);
if (apiId) cache.setItem('telegramApiId', apiId);
if (apiHash) cache.setItem('telegramApiHash', apiHash);
if (botAuthToken) cache.setItem('telegramBotAuthToken', botAuthToken);
if (chatId) cache.setItem('telegramChatId', chatId);
if (typeof topicId === 'number') cache.setItem('telegramTopicId', topicId);

const options = yargs
  .usage('Usage: $0 [options]')
  .option('l', {
    alias: 'language',
    describe: 'Language code for i18n',
    type: 'string',
    default: 'en',
    demandOption: false,
  })
  .option('b', {
    alias: 'as-bot',
    describe: 'Start as bot instance',
    type: 'boolean',
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
    demandOption: false,
  })
  .version(scriptVersion)
  .help('h')
  .alias('h', 'help')
  .epilog(`${scriptName} v${scriptVersion}`).argv;

setLogLevel(options.debug ? logLevelDebug : logLevelInfo);

i18n.setLocale(options.language);

const storeSession = new StoreSession(`data/session/${options.asBot ? 'bot' : 'user'}`);

const ecoflowAPIURL = 'https://api.ecoflow.com',
  ecoflowAPIAuthenticationPath = '/auth/login',
  ecoflowAPICertificationPath = '/iot-auth/app/certification',
  headers = {lang: 'en_US', 'content-type': 'application/json'},
  ecoflowAPI = axios.create({
    baseURL: ecoflowAPIURL,
    timeout: 10000,
  });

const ecoFlowACInput = 'inv.acIn',
  ecoFlowACInputVoltage = `${ecoFlowACInput}Vol`,
  ecoFlowACInputFrequency = `${ecoFlowACInput}Freq`,
  ecoFlowACInputCurrent = `${ecoFlowACInput}Amp`;

let mqttClient = null,
  telegramClient = null;

function getEcoFlowCredentials() {
  return new Promise((resolve, reject) => {
    if (ecoflowUserName === null || ecoflowPassword === null || ecoflowDeviceSN === null) {
      const rl = readline.createInterface({
        input,
        output,
      });
      if (ecoflowUserName === null) {
        rl.question('Enter your EcoFlow username: ')
          .then((username) => {
            ecoflowUserName = username;
            cache.setItem('ecoflowUserName', username);
            rl.question('Enter your EcoFlow password: ')
              .then((password) => {
                ecoflowPassword = password;
                cache.setItem('ecoflowPassword', password);
                rl.question('Enter your EcoFlow device SN: ')
                  .then((deviceSN) => {
                    ecoflowDeviceSN = deviceSN;
                    cache.setItem('ecoflowDeviceSN', deviceSN);
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
          })
          .catch((error) => {
            logError(`Error: ${error}`);
            rl.close();
            reject(error);
          });
      }
    } else {
      resolve();
    }
  });
}

function getAPIAttributes() {
  return new Promise((resolve, reject) => {
    if ((options.asBot === false && (apiId === null || apiHash === null)) || (botAuthToken === null && options.asBot === true)) {
      const rl = readline.createInterface({
        input,
        output,
      });
      if (options.asBot === false && (apiId === null || apiHash === null)) {
        rl.question('Enter your API ID: ')
          .then((id) => {
            apiId = parseInt(id);
            cache.setItem('telegramApiId', id);
            rl.question('Enter your API Hash: ')
              .then((hash) => {
                cache.setItem('telegramApiHash', apiHash);
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
        rl.question('Enter your Bot Auth Token: ')
          .then((token) => {
            cache.setItem('telegramBotAuthToken', botAuthToken);
            rl.close();
            resolve();
          })
          .catch((error) => {
            logError(`Error: ${error}`);
            rl.close();
            reject(error);
          });
      }
    } else {
      resolve();
    }
  });
}

function getMessageTargetIds() {
  return new Promise((resolve, reject) => {
    if (chatId === null || topicId === null) {
      const rl = readline.createInterface({
        input,
        output,
      });
      rl.question('Enter your chat ID: ')
        .then((id) => {
          chatId = id;
          cache.setItem('telegramChatId', id);
          rl.question('Enter your topic ID(0 - if no topics): ')
            .then((id) => {
              topicId = parseInt(id);
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
    if (options.asBot === true) {
      const client = new TelegramClient(storeSession, apiId, apiHash, {
        connectionRetries: 5,
        useWSS: true,
        connectionTimeout: 10000,
      });
      client
        .start({
          botAuthToken: botAuthToken,
        })
        .then(() => {
          logDebug('Telegram bot is connected');
          resolve(client);
        })
        .catch((error) => {
          logError(`Telegram bot connection error: ${error}`);
          reject(error);
        });
    } else {
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
          resolve(client);
        })
        .catch((error) => {
          rl.close();
          logError(`Telegram client connection error: ${error}`);
          reject(error);
        });
    }
  });
}

function getTelegramTargetEntity() {
  return new Promise((resolve, reject) => {
    telegramClient
      .getDialogs()
      .then((dialogs) => {
        const availableDialogs = dialogs.filter((dialog) => dialog.entity?.migratedTo === undefined || dialog.entity?.migratedTo === null),
          targetDialog = availableDialogs.find((item) => `${chatId}` === `${item.entity.id}`);
        if (targetDialog !== undefined) {
          if (topicId > 0) {
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
                  if (response.topics.find((topic) => topic.id === topicId) === undefined) {
                    logWarning(`Topic with id ${topicId} not found in ${targetDialog.title} (${chatId})!`);
                    reject(new Error(`Topic with id ${topicId} not found in ${targetDialog.title} (${chatId})!`));
                  } else {
                    resolve(targetDialog.entity);
                  }
                } else {
                  logWarning(`No topics found in ${targetDialog.title} (${chatId})!`);
                  reject(new Error(`No topics found in ${targetDialog.title} (${chatId})!`));
                }
              })
              .catch((error) => {
                reject(error);
              });
          } else {
            resolve(targetDialog.entity);
          }
        } else {
          reject(new Error(`Telegram chat with ID ${chatId} not found`));
        }
      })
      .catch((error) => {
        reject(error);
      });
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
  if (telegramClient !== null && telegramClient.connected === true) {
    telegramClient.disconnect().then(() => {
      logInfo(`Telegram client is disconnected!`);
      telegramClient.destroy().then(() => {
        logInfo(`Telegram client is destroyed!`);
        telegramClient = null;
        exitMqtt();
      });
    });
  } else if (mqttClient !== null && mqttClient.connected === true) {
    exitMqtt();
  } else {
    logInfo('All clients are disconnected!');
    exit(0);
  }
}

function getRandomId() {
  return BigInt(`${Date.now()}${Math.floor(Math.random() * 1000)}`);
}

process.on('SIGINT', gracefulExit);
process.on('SIGTERM', gracefulExit);

getEcoFlowCredentials()
  .then(() => {
    getAPIAttributes()
      .then(() => {
        getMessageTargetIds()
          .then(() => {
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
                logDebug(`Ecoflow token: ${token}`);
                logDebug(`Ecoflow userId: ${userId}`);
                logDebug(`Ecoflow userName: ${userName}`);
                const headers = {
                  lang: 'en_US',
                  authorization: `Bearer ${token}`,
                };
                ecoflowAPI
                  .get(`${ecoflowAPICertificationPath}?userId=${userId}`, {headers: headers})
                  .then((response) => {
                    logInfo('Ecoflow certification is successful. Getting MQTT client ...');
                    let mqttUrl, mqttPort, mqttUsername, mqttPassword, mqttClientId;
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
                    logDebug(`Ecoflow MQTT password: ${mqttPassword}`);
                    logDebug(`Ecoflow MQTT client ID: ${mqttClientId}`);
                    const connectMQTTUrl = `${mqttProtocol}://${mqttUrl}:${mqttPort}`;

                    mqtt
                      .connectAsync(connectMQTTUrl, {
                        clientId: mqttClientId,
                        clean: true,
                        connectTimeout: 4000,
                        username: mqttUsername,
                        password: mqttPassword,
                        reconnectPeriod: 1000,
                        protocol: mqttProtocol,
                      })
                      .then((client) => {
                        mqttClient = client;
                        logInfo('Ecoflow MQTT broker is connected. Getting Telegram client ...');
                        getTelegramClient()
                          .then((client) => {
                            logInfo('Telegram client is connected. Getting target entity ...');
                            telegramClient = client;
                            telegramClient.setParseMode('html');
                            getTelegramTargetEntity()
                              .then((entity) => {
                                logInfo('Telegram target entity is found. Subscribing to topic ...');
                                targetEntity = entity;
                                mqttClient.on('message', (topic, message) => {
                                  data = JSON.parse(message.toString());
                                  if (
                                    typeof data.params?.[ecoFlowACInputVoltage] === 'number' &&
                                    typeof data.params?.[ecoFlowACInputFrequency] === 'number' &&
                                    typeof data.params?.[ecoFlowACInputCurrent] === 'number'
                                  ) {
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
                                      const message = i18n.__(currentInputState ? 'Electricity is returned' : 'Electricity is cut off'),
                                        timeStampOptions = {timeStyle: 'short', dateStyle: 'short'};
                                      if (options.timeZone) {
                                        timeStampOptions.timeZone = options.timeZone;
                                      }
                                      logInfo(message);
                                      const timeStamp = new Date().toLocaleString(options.language, timeStampOptions),
                                        telegramMessage = {
                                          message: `${options.addTimestamp ? timeStamp + ': ' : ''}${message}`,
                                        };
                                      if (topicId > 0) {
                                        telegramMessage.replyTo = topicId;
                                      }
                                      telegramClient.sendMessage(targetEntity, telegramMessage).then((message) => {
                                        logDebug(`Telegram message sent to ${chatId} with topic ${topicId}`);
                                        if (options.pinMessage) {
                                          telegramClient.pinMessage(targetEntity, message.id).then(() => {
                                            logDebug(`Telegram message pinned to ${chatId} with topic ${topicId}`);
                                            if (options.unpinPrevious) {
                                              const previousMessageId = cache.getItem('lastMessageId');
                                              if (previousMessageId !== undefined) {
                                                telegramClient.unpinMessage(targetEntity, previousMessageId).then(() => {
                                                  logDebug(`Telegram message unpinned from ${chatId} with topic ${topicId}`);
                                                });
                                              }
                                            }
                                          }).catch((error) => {
                                            logError(`Telegram message pin error: ${error}`);
                                          });
                                        }
                                        cache.setItem('lastMessageId', message.id);
                                      }).catch((error) => {
                                        logError(`Telegram message error: ${error}`);
                                      });
                                    }
                                  }
                                });
                                mqttClient.subscribe(`/app/device/property/${ecoflowDeviceSN}`, (error) => {
                                  if (error) {
                                    logError(`Ecoflow MQTT subscription error: ${error}`);
                                  } else {
                                    logInfo(`Ecoflow MQTT subscription is successful. Listening to messages ...`);
                                  }
                                });
                              })
                              .catch((error) => {
                                logError(`Telegram target peer error: ${error}`);
                                gracefulExit();
                              });
                          })
                          .catch((error) => {
                            logError(`Telegram client error: ${error}`);
                            gracefulExit();
                          });
                      })
                      .catch((error) => {
                        logError(`Ecoflow MQTT broker connection error: ${error}`);
                        gracefulExit();
                      });
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
