const {Api, TelegramClient} = require('telegram');
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
const { log } = require('node:console');

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
  chatId = parseInt(process.env.TELEGRAM_CHAT_ID) || cache.getItem('telegramChatId', 'number'),
  topicId = (process.env.TELEGRAM_TOPIC_ID ? parseInt(process.env.TELEGRAM_TOPIC_ID) : cache.getItem('telegramTopicId')) || 0,
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
                  // eslint-disable-next-line sonarjs/no-nested-functions
                  .then((deviceSN) => {
                    ecoflowDeviceSN = deviceSN;
                    cache.setItem('ecoflowDeviceSN', deviceSN);
                    rl.close();
                    resolve();
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
      resolve();
    }
  });
}

function getAPIAttributes() {
  return new Promise((resolve, reject) => {
    if (
      (options.asBot === false && (apiId === null || apiHash === null)) ||
      (options.asBot === true && (botAuthToken === null || botAuthToken.length < 43))
    ) {
      const rl = readline.createInterface({
        input,
        output,
      });
      if (options.asBot === false) {
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
            botAuthToken = token;
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
    if (chatId > 0 && topicId === 0) {
      telegramClient.invoke(new Api.users.GetUsers({ id: [chatId] })).then((result) => {
        if (result.length > 0) {
          const entity = result[0];
          logDebug(`Telegram user ${entity.firstName} ${entity.lastName} '${entity.username}' (${chatId}) found!`);
          resolve(entity);
        } else {
          throw(new Error(`Telegram user with ID ${chatId} not found!`));
        }
      }).catch((error) => {
        logWarning(`Telegram chat with ID ${chatId} not found! Error: ${error}`);
        reject(error);
      });
    } else if (chatId < 0 && chatId > -1000000000000 && topicId === 0) {
      telegramClient.invoke(new Api.messages.GetChats({ id: [-chatId] })).then((result) => {
        if (result.chats.length > 0) {
          const entity = result.chats[0];
          logDebug(`Telegram chat/group ${entity.title} (${chatId}) found!`);
          resolve(entity);
        } else {
          throw(new Error(`Telegram chat/group with ID ${chatId} not found!`));
        }
      }).catch((error) => {
        logWarning(`Telegram chat/group with ID ${chatId} not found! Error: ${error}`);
        reject(error);
      });
    } else if (chatId < -1000000000000) {
      telegramClient.invoke(new Api.channels.GetChannels({ id: [chatId] })).then((result) => {
        if (result.chats.length > 0) {
          const entity = result.chats[0];
          if (topicId === 0) {
            logDebug(`Telegram forum/channel ${entity.title} (${chatId}) found!`);
            resolve(entity);
          } else if (topicId > 0 && (entity.megagroup === true || entity.forum === true)) {
            if (options.asBot === true) {
              logWarning(`Telegram bot can't check if forum/channel topics is exists!`);
              resolve(entity);
            } else {
              telegramClient
                .invoke(
                  new Api.channels.GetForumTopics({
                    channel: entity,
                    limit: 100,
                    offsetId: 0,
                    offsetDate: 0,
                    addOffset: 0,
                  }),
                )
                .then((response) => {
                  if (Array.isArray(response.topics) && response.topics.length > 0) {
                    // eslint-disable-next-line sonarjs/no-nested-functions
                    const topic = response.topics.find((topic) => topic.id === topicId);
                    if (topic === undefined) {
                      throw(new Error(`Topic with id ${topicId} not found in ${entity.title} (${chatId})!`));
                    } else {
                      logDebug(`Telegram forum/channel ${entity.title} (${chatId})  with topic ${topic.title} (${topicId}) found!`);
                      resolve(entity);
                    }
                  } else {
                    throw(new Error(`No topics found in ${entity.title} (${chatId})!`));
                  }
                })
                .catch((error) => {
                  reject(error);
                });
            }
          } else {
            throw(new Error(`Telegram forum/channel with ID ${chatId} is not a forum/channel!`));
          }
        } else {
          throw(new Error(`Telegram forum/channel with ID ${chatId} not found!`));
        }
      }).catch((error) => {
        logWarning(`Telegram forum/channel with ID ${chatId} not found! Error: ${error}`);
        reject(error);
      });
    } else {
      const errorMessage = `Telegram chat with ID ${chatId} not found!`;
      logWarning(errorMessage);
      reject(new Error(errorMessage));
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
  // eslint-disable-next-line sonarjs/pseudo-random
  return BigInt(`${Date.now()}${Math.floor(Math.random() * 1000)}`);
}
function mqttSubscribe() {
  mqttClient.subscribe(ecoflowTopic, (error) => {
    if (error) {
      logError(`Ecoflow MQTT subscription error: ${error}`);
      gracefulExit();
    } else {
      logInfo(`Ecoflow MQTT subscription is successful. Listening to messages ...`);
      mqttKeepAliveInit();
    }
  });
}

function mqttMessageHandler(topic, message) {
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
      telegramClient
        .sendMessage(targetEntity, telegramMessage)
        .then((message) => {
          logDebug(`Telegram message sent to ${chatId} with topic ${topicId}`);
          if (options.pinMessage) {
            telegramClient
              .pinMessage(targetEntity, message.id)
              .then(() => {
                logDebug(`Telegram message pinned to ${chatId} with topic ${topicId}`);
                if (options.unpinPrevious) {
                  const previousMessageId = cache.getItem('lastMessageId');
                  if (previousMessageId !== undefined) {
                    telegramClient.unpinMessage(targetEntity, previousMessageId).then(() => {
                      logDebug(`Telegram message unpinned from ${chatId} with topic ${topicId}`);
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
    }
  }
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
                  // eslint-disable-next-line sonarjs/no-nested-functions
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
                    logDebug(`Ecoflow MQTT password: ${mqttPassword}`);
                    logDebug(`Ecoflow MQTT client ID: ${mqttClientId}`);
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

                    mqtt
                      .connectAsync(connectMQTTUrl, mqttOptions)
                      .then((client) => {
                        mqttClient = client;
                        logInfo('Ecoflow MQTT broker is connected. Getting Telegram client ...');
                        mqttClient.on('error', (error) => {
                          logError(`Ecoflow MQTT broker error: ${error}`);
                          gracefulExit();
                        });
                        mqttClient.on('connect', () => {
                          logInfo('Ecoflow MQTT broker is connected ...');
                        });
                        mqttClient.on('reconnect', () => {
                          logInfo('Ecoflow MQTT broker is reconnecting ...');
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
                        getTelegramClient()
                          .then((client) => {
                            logInfo('Telegram client is connected. Getting target entity ...');
                            telegramClient = client;
                            telegramClient.setParseMode('html');
                            getTelegramTargetEntity()
                              .then((entity) => {
                                logInfo('Telegram target entity is found. Subscribing to MQTT topic ...');
                                targetEntity = entity;
                                mqttClient.on('message', mqttMessageHandler);
                                mqttSubscribe();
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
                  // eslint-disable-next-line sonarjs/no-nested-functions
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
