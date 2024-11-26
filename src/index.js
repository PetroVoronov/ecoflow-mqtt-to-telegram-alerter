const {Api, TelegramClient} = require('telegram');
const {Api: GrammyApi} = require('grammy');
const {StoreSession} = require('telegram/sessions');
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
const crypto = require('crypto');
const {Input, Select, Form, prompt} = require('enquirer');

const ecoflowAPIURLDefault = 'https://api.ecoflow.com';

const options = yargs
  .usage('Usage: $0 [options]')
  .option('a', {
    alias: 'api-url',
    describe: 'Ecoflow API URL',
    type: 'string',
    default: ecoflowAPIURLDefault,
    demandOption: false,
  })
  .option('auth-via-access-key', {
    describe: 'Authenticate to the EcoFlow API via access key',
    type: 'boolean',
    default: false,
    demandOption: false,
  })
  .option('auth-via-username', {
    describe: 'Authenticate to the EcoFlow API via username',
    type: 'boolean',
    default: false,
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
  .option('r', {
    alias: 'full-reconnect-failed-count',
    describe: 'Number of failed alive checks for full reconnect',
    type: 'number',
    default: 5,
    demandOption: false,
  })
  .option('l', {
    alias: 'language',
    describe: 'Language code for i18n',
    type: 'string',
    default: 'en',
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
  .option('n', {
    alias: 'night-time',
    describe: 'Interval in hours, when the script is sending messages in silent mode. Format is "start:stop" in 24h format',
    type: 'string',
    default: '',
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


const ecoflowAPIURL = options.apiUrl || ecoflowAPIURLDefault;

// eslint-disable-next-line sonarjs/concise-regex
const nightTimeRegexp = /^([01]?[0-9]|2[0-3]):([01]?[0-9]|2[0-3])$/;
const nightTimeInterval = [];

if (typeof options.nightTime === 'string' && options.nightTime.length > 0) {
  const intervalMatch = options.nightTime.match(nightTimeRegexp);
  if (intervalMatch !== null) {
    nightTimeInterval.push(parseInt(intervalMatch[1]), parseInt(intervalMatch[2]));
  }
}

if (options.fullReconnectFailedCount > 0 && options.keepAlive < 1) {
  log.warn('Keep alive interval is less than 1 second!');
  options.keepAlive = 60;
}

log.info(`Starting ${scriptName} v${scriptVersion} ...`);
log.info(`Ecoflow API URL: ${ecoflowAPIURL}`);
log.info(`Authenticate via access key: ${options.authViaAccessKey}`);
log.info(`Authenticate via username: ${options.authViaUsername}`);
log.info(`Start as user: ${options.asUser}`);
log.info(`Keep alive interval: ${options.keepAlive} seconds`);
log.info(`Log alive status interval: ${options.logAliveStatusInterval} minutes`);
log.info(`Alive check failed count for full reconnect: ${options.fullReconnectFailedCount}`);
log.info(`Language: ${options.language}`);
log.info(`Pin message: ${options.pinMessage}`);
log.info(`Unpin previous: ${options.unpinPrevious}`);
log.info(`Add timestamp: ${options.addTimestamp}`);
log.info(`Time zone: ${options.timeZone}`);
log.info(`Night time interval: ${nightTimeInterval.length === 2 ? options.nightTime : 'not set'}`);
log.info(`Debug: ${options.debug}`);

i18n.setLocale(options.language);

const storage = new LocalStorage('data/storage'),
  cache = new Cache({
    getItem: (key) => storage.getItem(key),
    setItem: (key, value) => storage.setItem(key, value),
    removeItem: (key) => storage.removeItem(key),
  });

const paramsMinLength = 3;

if (typeof process.env.TELEGRAM_CHAT_ID === 'string' && process.env.TELEGRAM_CHAT_ID.length > paramsMinLength) {
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

const ecoflowAPIAuthenticationPath = '/auth/login';
const ecoflowAPIAccessCertificationPath = '/iot-open/sign/certification';
const ecoflowAPIUserCertificationPath = '/iot-auth/app/certification';

let ecoflowTopic = '/app/device/property/';

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
let telegramClient = null;
let lastMQTTMessageTimeStamp = new Date().getTime();
let lastAliveInfoMessageTimeStamp = new Date().getTime();
let keepAliveFailedCount = 0;

function ecoflowAPIAccessIsValid(ecoflowAccessKey, ecoflowSecretKey) {
  return (
    typeof ecoflowAccessKey === 'string' &&
    ecoflowAccessKey.length > paramsMinLength &&
    typeof ecoflowSecretKey === 'string' &&
    ecoflowSecretKey.length > paramsMinLength &&
    options.authViaUsername === false
  );
}

function ecoflowAPIUserIsValid(ecoflowUserName, ecoflowPassword) {
  return (
    typeof ecoflowUserName === 'string' &&
    ecoflowUserName.length > paramsMinLength &&
    typeof ecoflowPassword === 'string' &&
    ecoflowPassword.length > paramsMinLength &&
    options.authViaAccessKey === false
  );
}

function ecoflowDeviceSNIsValid(ecoflowDeviceSN) {
  return typeof ecoflowDeviceSN === 'string' && ecoflowDeviceSN.length > paramsMinLength;
}

function ecoflowCredentialsIsValid(ecoflowAccessKey, ecoflowSecretKey, ecoflowUserName, ecoflowPassword, ecoflowDeviceSN) {
  return (
    (ecoflowAPIAccessIsValid(ecoflowAccessKey, ecoflowSecretKey) || ecoflowAPIUserIsValid(ecoflowUserName, ecoflowPassword)) &&
    ecoflowDeviceSNIsValid(ecoflowDeviceSN)
  );
}

async function getEcoFlowCredentials() {
  if (typeof process.env.ECOFLOW_ACCESS_KEY === 'string' && process.env.ECOFLOW_ACCESS_KEY.length > paramsMinLength) {
    cache.setItem('ecoflowAccessKey', process.env.ECOFLOW_ACCESS_KEY);
  }
  if (typeof process.env.ECOFLOW_SECRET_KEY === 'string' && process.env.ECOFLOW_SECRET_KEY.length > paramsMinLength) {
    cache.setItem('ecoflowSecretKey', process.env.ECOFLOW_SECRET_KEY);
  }
  if (typeof process.env.ECOFLOW_USERNAME === 'string' && process.env.ECOFLOW_USERNAME.length > 0) {
    cache.setItem('ecoflowUserName', process.env.ECOFLOW_USERNAME);
  }
  if (typeof process.env.ECOFLOW_PASSWORD === 'string' && process.env.ECOFLOW_PASSWORD.length > 0) {
    cache.setItem('ecoflowPassword', process.env.ECOFLOW_PASSWORD);
  }
  if (typeof process.env.ECOFLOW_DEVICE_SN === 'string' && process.env.ECOFLOW_DEVICE_SN.length > 0) {
    cache.setItem('ecoflowDeviceSN', process.env.ECOFLOW_DEVICE_SN);
  }
  const ecoflowAccessKey = cache.getItem('ecoflowAccessKey');
  const ecoflowSecretKey = cache.getItem('ecoflowSecretKey');
  const ecoflowUserName = cache.getItem('ecoflowUserName');
  const ecoflowPassword = cache.getItem('ecoflowPassword');
  const ecoflowDeviceSN = cache.getItem('ecoflowDeviceSN');

  let result = {ecoflowAccessKey, ecoflowSecretKey, ecoflowUserName, ecoflowPassword, ecoflowDeviceSN};
  if (! ecoflowCredentialsIsValid(ecoflowAccessKey, ecoflowSecretKey, ecoflowUserName, ecoflowPassword, ecoflowDeviceSN)) {
    if (ecoflowAPIAccessIsValid(ecoflowAccessKey, ecoflowSecretKey) && ecoflowDeviceSNIsValid(ecoflowDeviceSN)) {
      result = {ecoflowAccessKey, ecoflowSecretKey, ecoflowDeviceSN};
    } else if (ecoflowAPIUserIsValid(ecoflowUserName, ecoflowPassword) && ecoflowDeviceSNIsValid(ecoflowDeviceSN)) {
      result = {ecoflowUserName, ecoflowPassword, ecoflowDeviceSN};
    } else {
      if (!(ecoflowAPIAccessIsValid(ecoflowAccessKey, ecoflowSecretKey) || ecoflowAPIUserIsValid(ecoflowUserName, ecoflowPassword))) {
        let method = '';
        if (options.authViaAccessKey) {
          method = 'Access key';
        } else if (options.authViaUsername) {
          method = 'Username';
        }
        if (method === '') {
          const prompt = new Select({
            message: 'Please select the EcoFlow authentication method:',
            choices: ['Access key', 'Username'],
          });
          method = await prompt.run();
        }
        if (method === 'Access key') {
          const prompt = new Form({
            name: 'ecoflowAccessData',
            message: 'Please enter your EcoFlow access & secret keys (press Enter only on last line):',
            choices: [
              {name: 'accessKey', message: 'Access key:', initial: ecoflowAccessKey || ''},
              {name: 'secretKey', message: 'Secret key:', initial: ecoflowSecretKey || ''},
            ],
          });
          const {accessKey, secretKey} = await prompt.run();
          cache.setItem('ecoflowAccessKey', accessKey);
          cache.setItem('ecoflowSecretKey', secretKey);
          if (ecoflowAPIAccessIsValid(accessKey, secretKey)) {
            result = {ecoflowAccessKey: accessKey, ecoflowSecretKey: secretKey};
          } else {
            result = {};
          }
        } else {
          const prompt = new Form({
            name: 'ecoflowUserData',
            message: 'Please enter your EcoFlow username & password (press Enter only on last line):',
            choices: [
              {name: 'userName', message: 'Username:', initial: ecoflowUserName || ''},
              {name: 'password', message: 'Password:', initial: ecoflowPassword || ''},
            ],
          });
          const {userName, password} = await prompt.run();
          cache.setItem('ecoflowUserName', userName);
          cache.setItem('ecoflowPassword', password);
          if (ecoflowAPIUserIsValid(userName, password)) {
            result = {ecoflowUserName: userName, ecoflowPassword: password};
          } else {
            result = {};
          }
        }
      }
      if (Object.keys(result).length === 2 && !ecoflowDeviceSNIsValid(ecoflowDeviceSN)) {
        const prompt = new Input({
          message: 'Please enter your EcoFlow device SN:',
          initial: ecoflowDeviceSN || '',
        });
        const deviceSN = await prompt.run();
        cache.setItem('ecoflowDeviceSN', deviceSN);
        if (ecoflowDeviceSNIsValid(deviceSN)) {
          result.ecoflowDeviceSN = deviceSN;
        } else {
          result = {};
        }
      }
    }
  }
  return result;
}

function createEcoFlowSignature(params, secretKey) {
  const queryString = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&');
  return crypto.createHmac('sha256', secretKey).update(queryString).digest('hex');
}

async function getAPIAttributes() {
  if (typeof process.env.TELEGRAM_API_ID === 'string' && process.env.TELEGRAM_API_ID.length > paramsMinLength) {
    cache.setItem('telegramApiId', parseInt(process.env.TELEGRAM_API_ID));
  }
  if (typeof process.env.TELEGRAM_API_HASH === 'string' && process.env.TELEGRAM_API_HASH.length > paramsMinLength) {
    cache.setItem('telegramApiHash', process.env.TELEGRAM_API_HASH);
  }
  const apiId = cache.getItem('telegramApiId', 'number');
  const apiHash = cache.getItem('telegramApiHash', 'string');
  if (typeof apiId !== 'number' || apiId <= 0 || typeof apiHash !== 'string' || apiHash.length < 1) {
    const prompt = new Form({
      name: 'telegramApiData',
      message: 'Please enter your Telegram API ID & Hash (press Enter only on last line):',
      choices: [
        {name: 'apiId', message: 'API ID:', initial: apiId || ''},
        {name: 'apiHash', message: 'API Hash:', initial: apiHash || ''},
      ],
    });
    const apiData = await prompt.run()
    if (typeof apiData.apiId === 'string' && apiData.apiId.length > paramsMinLength && typeof apiData.apiHash === 'string' && apiData.apiHash.length > paramsMinLength) {
      cache.setItem('telegramApiId', parseInt(apiData.apiId));
      cache.setItem('telegramApiHash', apiData.apiHash);
      return {apiId: parseInt(apiData.apiId), apiHash: apiData.apiHash};
    } else {
      throw new Error('API attributes are not valid!');
    }
  } else {
    return {apiId, apiHash};
  }
}

async function getBotAuthToken() {
  if (
    typeof process.env.TELEGRAM_BOT_AUTH_TOKEN === 'string' &&
    process.env.TELEGRAM_BOT_AUTH_TOKEN.length >= botAuthTokenMinimumLength
  ) {
    cache.setItem('telegramBotAuthToken', process.env.TELEGRAM_BOT_AUTH_TOKEN);
  }
  const botAuthToken = cache.getItem('telegramBotAuthToken');
  if (typeof botAuthToken !== 'string' || botAuthToken.length < botAuthTokenMinimumLength) {
    const prompt = new Input({
      message: 'Enter your Bot Auth Token:',
      initial: botAuthToken || '',
    });
    const token = await prompt.run();
    if (typeof token === 'string' && token.length >= botAuthTokenMinimumLength) {
      cache.setItem('telegramBotAuthToken', token);
      return token;
    } else {
      throw new Error('Bot Auth Token is not valid!');
    }
  } else {
    return botAuthToken;
  }
}

async function getMessageTargetIds() {
  if (typeof telegramChatId !== 'number' || telegramChatId === 0 || typeof telegramTopicId !== 'number') {
    const prompt = new Form({
      name: 'telegramTargetData',
      message: 'Please enter your Telegram chat ID & topic ID (press Enter only on last line):',
      choices: [
        {name: 'chatId', message: 'Chat ID:', initial: telegramChatId || '', type: number},
        {name: 'topicId', message: 'Topic ID (0 - if no topics):', initial: telegramTopicId || '', type: number},
      ],
    });
    const targetData = await prompt.run();
    if (typeof targetData.chatId === 'string' && targetData.chatId.length > paramsMinLength && typeof targetData.topicId === 'string' && targetData.topicId.length > 0) {
      telegramChatId = parseInt(targetData.chatId);
      telegramTopicId = parseInt(targetData.topicId);
      cache.setItem('telegramChatId', telegramChatId);
      cache.setItem('telegramTopicId', telegramTopicId);
    } else {
      throw new Error('Telegram target IDs are not valid!');
    }
  }
}

async function getTelegramClient() {
  let client = null;
  if (options.asUser === true) {
    telegramUserSessionMigrate();
    const storeSession = new StoreSession(`data/session`);
    const {apiId, apiHash} = await getAPIAttributes()
    if (typeof apiId === 'number' && apiId > 0 && typeof apiHash === 'string' && apiHash.length > paramsMinLength) {
      try {
        client = new TelegramClient(storeSession, apiId, apiHash, {
          connectionRetries: 5,
          useWSS: true,
          connectionTimeout: 10000,
          appVersion: `${scriptName} v${scriptVersion}`,
        });
        try {
          await client.start({
            phoneNumber: async () => {
              const result = await prompt({
                type: 'input',
                name: 'phone',
                message: 'Enter your phone number:',
              });
              return result ? result.phone : '';
            },
            phoneCode: async () => {
              const result = await prompt({
                type: 'input',
                name: 'code',
                message: 'Enter the code:',
              });
              return result ? result.code : '';
            },
            password: async () => {
              const result = await prompt({
                type: 'password',
                name: 'password',
                message: 'Enter the password:',
              });
              return result ? result.password : '';
            },
            onError: (error) => {
              log.error(`Telegram client error: ${error}`);
            },
          })
          client.setParseMode(parseMode);
          const user = await client.getMe();
          log.debug(`Telegram client is connected as user: ${user.firstName} ${user.lastName} (${user.username})`);
        } catch (error) {
          log.error(`Telegram client connection error: ${error}`);
        };
      } catch (error) {
        log.error(`API attributes error: ${error}`);
      }
    } else {
      log.error(`API attributes error!`);
    }
  } else {
    const token = await getBotAuthToken();
    if (typeof token === 'string' && token.length >= botAuthTokenMinimumLength) {
      try {
        client = new GrammyApi(token);
        const bot = await client.getMe();
        log.debug(`Telegram client is connected as bot: ${bot.first_name} (${bot.username})`);
      } catch (error) {
        log.error(`Bot Auth Token error: ${error}`);
      }
    } else {
      log.error(`Bot Auth Token error!`);
    }
  }
  return client;
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

async function getTelegramTargetEntity() {
  let entity = null;
  if (options.asUser === false) {
    try {
      entity = await telegramClient.getChat(telegramChatId);
    } catch (error) {
      log.error(`Error to get chat with ID ${telegramChatId}: ${error}`);
    }
    if (typeof entity === 'object' && entity !== null) {
      targetTitle = entity.title || `${entity.first_name || ''} ${entity.last_name || ''} (${entity.username || ''})`;
      log.debug(`Telegram chat "${targetTitle}" with ID ${telegramChatId} found!`);
    } else {
      log.warn(`Telegram chat with ID ${telegramChatId} not found! Error: ${error}`);
    }
  } else {
    let dialogs = [];
    try {
      dialogs = await telegramClient.getDialogs()
    } catch (error) {
      log.error(`Error to get dialogs: ${error}`);
    }

    if (Array.isArray(dialogs) && dialogs.length > 0) {
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
        if (telegramTopicId === 0) {
          log.debug(`Telegram chat "${targetTitle}" with ID ${telegramChatId} found!`);
          entity = targetDialog.entity;
        } else if (telegramTopicId > 0) {
          let response = null;
          try {
            response = await telegramClient.invoke(
              new Api.channels.GetForumTopics({
                channel: targetDialog.entity,
                limit: 100,
                offsetId: 0,
                offsetDate: 0,
                addOffset: 0,
              }),
            )
          } catch (error) {
            log.error(`Error to get topics in chat "${targetTitle}" with ID ${telegramChatId}: ${error}`);
          }
          if (typeof response === 'object' && response !== null && Array.isArray(response.topics) && response.topics.length > 0) {
            // eslint-disable-next-line sonarjs/no-nested-functions
            const targetTopic = response.topics.find((topic) => topic.id === telegramTopicId);
            if (targetTopic) {
              log.debug(`Telegram topic "${targetTopic.title}" in chat "${targetTitle}" with ID ${telegramChatId} found!`);
              entity = targetDialog.entity;
            } else {
              log.warn(`Topic with id ${telegramTopicId} not found in "${targetTitle}" (${telegramChatId})!`);
            }
          } else {
            log.warn(`No topics found in "${targetTitle}" (${telegramChatId})!`);
          }
        }
      } else {
        log.error(`Telegram chat with ID ${telegramChatId} not found!`);
      }
    } else {
      log.error(`No dialogs found!`);
    }
  }
  return entity;
}

async function getTelegramPrepared() {
  let result = false;
  try {
    telegramClient = await getTelegramClient();
  } catch (error) {
    log.error(`Telegram client error: ${error}`);
    gracefulExit();
  }
  if (telegramClient !== null) {
    try {
      await getMessageTargetIds();
    } catch (error) {
      log.error(`Message target IDs error: ${error}`);
      gracefulExit();
    }
    try {
      targetEntity = await getTelegramTargetEntity();
    } catch (error) {
      log.error(`Telegram target entity error: ${error}`);
      gracefulExit();
    }
    if (targetEntity !== null) {
      log.debug(`Telegram target entity: ${stringify(targetEntity)}`);
      result = true;
    } else {
      log.error(`Telegram target entity not found!`);
      gracefulExit();
    }
  } else {
    log.error(`Telegram client is not ready!`);
    gracefulExit();
  }
  return result;
}

async function telegramSendMessage(target, messages, messageOptions) {
  let messageId = 0;
  if (telegramClient !== null) {
    let message = null;
    try {
      message = await telegramClient.sendMessage(target, messages, messageOptions);
    } catch (error) {
      log.error(`Telegram message error: ${error}`);
    }
    if (typeof message === 'object' && message !== null) {
      messageId = options.asUser === true ? message.id : message.message_id
    } else {
      throw new Error('Telegram message is not sent!');
    }
  } else {
    log.error(`Telegram client is not ready!`);
  }
  return messageId;
}

async function telegramPinMessage(target, messageId) {
  let result = false;
  if (telegramClient !== null) {
    if (options.asUser === true) {
      try {
        await telegramClient.pinMessage(target, messageId);
        result = true;
      } catch (error) {
        log.error(`Telegram message pin error: ${error}`);
      }
    } else {
      try {
        await telegramClient.pinChatMessage(target, messageId);
        result = true;
      } catch (error) {
        log.error(`Telegram message pin error: ${error}`);
      }
    }
  } else {
    log.error(`Telegram client is not ready!`);
  }
  return result;
}

async function telegramUnpinMessage(target, messageId) {
  let result = false;
  if (telegramClient !== null) {
    if (options.asUser === true) {
      try {
        await telegramClient.unpinMessage(target, messageId);
        result = true;
      } catch (error) {
        log.error(`Telegram message unpin error: ${error}`);
      }
    } else {
      try {
        await telegramClient.unpinChatMessage(target, messageId);
        result = true;
      } catch (error) {
        log.error(`Telegram message unpin error: ${error}`);
      }
    }
  } else {
    log.error(`Telegram client is not ready!`);
  }
  return result;
}

async function telegramMessageOnChange(currentInputState) {
  const inputACConnectionState = cache.getItem('inputACConnectionState');
  if (currentInputState !== inputACConnectionState && telegramClient !== null) {
    const timeStampOptions = {timeStyle: 'short', dateStyle: 'short'};
    if (options.timeZone) {
      timeStampOptions.timeZone = options.timeZone;
    }
    const timeStamp = new Date().toLocaleString(options.language, timeStampOptions);
    const messageText =
      (options.addTimestamp ? timeStamp + ': ' : '') + i18n.__(currentInputState ? 'Electricity is returned' : 'Electricity is cut off');

    const currentHour = options.timeZone
      ? new Date().toLocaleString(options.language, {timeZone: options.timeZone, hour: 'numeric', hour12: false})
      : new Date().getHours();

    const silentMode =
      nightTimeInterval.length === 2 &&
      ((nightTimeInterval[1] > nightTimeInterval[0] && currentHour >= nightTimeInterval[0] && currentHour < nightTimeInterval[1]) ||
        (nightTimeInterval[1] < nightTimeInterval[0] && (currentHour >= nightTimeInterval[0] || currentHour < nightTimeInterval[1])));

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
      if (silentMode === true) {
        telegramMessage.silent = true;
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
      if (silentMode === true) {
        messageOptions.disable_notification = true;
      }
    }
    let messageId = 0;
    try {
      messageId = await telegramSendMessage(telegramTarget, telegramMessage, messageOptions);
    } catch (error) {
      log.error(`Telegram message error: ${error}`);
    }
    if (messageId > 0) {
      log.debug(`Telegram message sent to "${targetTitle}" with topic ${telegramTopicId}`);
      const previousMessageId = cache.getItem('lastMessageId');
      cache.setItem('lastMessageId', messageId);
      if (options.pinMessage) {
        if (await telegramPinMessage(telegramTarget, messageId)) {
          log.debug(`Telegram message with id: ${messageId} pinned to "${targetTitle}" with topic ${telegramTopicId}`);
          if (options.unpinPrevious) {
            if (previousMessageId !== undefined && previousMessageId !== null) {
              if (await telegramUnpinMessage(telegramTarget, previousMessageId)) {
                log.debug(
                  `Telegram message with id: ${previousMessageId} unpinned from "${targetTitle}" with topic ${telegramTopicId}`,
                );
              } else {
                log.warn(`Telegram message with id: ${previousMessageId} not unpinned from "${targetTitle}" with topic ${telegramTopicId}`);
              }
            } else {
              log.warn(`No previous message to unpin from "${targetTitle}" with topic ${telegramTopicId}`);
            }
          }
        } else {
          log.warn(`Telegram message with id: ${messageId} not pinned to "${targetTitle}" with topic ${telegramTopicId}`);
        }
      }
    } else {
      log.warn(`Telegram message not sent to "${targetTitle}" with topic ${telegramTopicId}`);
    }
    cache.setItem('inputACConnectionState', currentInputState);
  }
}

function processEcoflowResponse(response, stage) {
  if (response?.status === 200 && response?.data?.code == 0 && typeof response?.data?.data === 'object') {
    log.info(`Ecoflow ${stage} is successful. Getting MQTT client ...`);
    return response.data.data;
  } else {
    log.error(
      `Error: Ecoflow ${stage} failed! Response: status=${response?.status}, code=${response?.data?.code}, message=${response?.data?.message}`,
    );
    gracefulExit();
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
    keepAliveFailedCount++;
    if (keepAliveFailedCount >= options.fullReconnectFailedCount) {
      log.warn(`Ecoflow MQTT client is not alive for ${options.keepAlive * options.fullReconnectFailedCount} seconds! Process full reconnect ...`);
      mqttConnectAndSubscribe(true);
    } else {
      log.warn(`Ecoflow MQTT client is not alive for ${options.keepAlive} seconds! Going to reconnect ...`);
      mqttClient.reconnect();
    }
  } else if (ecoflowMQTTLogAliveInterval > 0 && currentTimeStamp - lastAliveInfoMessageTimeStamp > ecoflowMQTTLogAliveInterval) {
    lastAliveInfoMessageTimeStamp = currentTimeStamp;
    log.info(`Ecoflow MQTT client is alive!`);
    keepAliveFailedCount = 0;
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
      log.info(`Ecoflow MQTT subscription is successful. Ready to process ...`);
      mqttKeepAliveInit();
    }
  });
}

async function mqttConnectAndSubscribe(mqttDisconnect = false) {
  if (mqttDisconnect) {
    await gracefulExit(true);
  }
  let certResponse = {};
  let mqttClientId = cache.getItem('mqttClientIdPrefix');
  if (typeof mqttClientId !== 'string' || mqttClientId.length < paramsMinLength) {
    mqttClientId = `ANDROID_${uuidv4().toUpperCase()}`;
    cache.setItem('mqttClientIdPrefix', mqttClientId);
  }
  const {ecoflowAccessKey, ecoflowSecretKey, ecoflowUserName, ecoflowPassword, ecoflowDeviceSN} = await getEcoFlowCredentials();
  if (ecoflowAPIAccessIsValid(ecoflowAccessKey, ecoflowSecretKey) ) {
    const params = {
      accessKey: ecoflowAccessKey,
      // eslint-disable-next-line sonarjs/pseudo-random
      nonce: Math.floor(Math.random() * 1000000),
      timestamp: Date.now(),
    };
    const signature = createEcoFlowSignature(params, ecoflowSecretKey);
    try {
      const response = await ecoflowAPI.get(ecoflowAPIAccessCertificationPath, {
        headers: {
          ...params,
          sign: signature,
        },
      });
      certResponse = processEcoflowResponse(response, 'access keys certification');
      if (certResponse?.protocol === 'mqtts') {
        ecoflowTopic = `/open/${certResponse.certificateAccount}/${ecoflowDeviceSN}/quota`;
      }
    } catch (error) {
      log.error(`Error: ${error}`);
      mqttExit();
    }
  } else if (ecoflowAPIUserIsValid(ecoflowUserName, ecoflowPassword)) {
    try {
      const response = await ecoflowAPI.post(
        ecoflowAPIAuthenticationPath,
        {
          email: ecoflowUserName,
          password: Buffer.from(ecoflowPassword).toString('base64'),
          scene: 'IOT_APP',
          userType: 'ECOFLOW',
        },
        {headers},
      );
      const apiResponse = processEcoflowResponse(response, 'authentication');
      if (typeof apiResponse.token === 'string' && apiResponse.token.length > paramsMinLength) {
        const token = apiResponse.token;
        const {userId, name: userName} = apiResponse.user;
        log.debug(`Ecoflow token:`, {token});
        log.debug(`Ecoflow userId:`, {userId});
        log.debug(`Ecoflow userName:`, {userName});
        const response = await ecoflowAPI.get(`${ecoflowAPIUserCertificationPath}?userId=${userId}`, {
          headers: {lang: 'en_US', authorization: `Bearer ${token}`},
        });
        certResponse = processEcoflowResponse(response, 'authenticated certification');
        mqttClientId += `_${userId}`;
          ecoflowTopic += ecoflowDeviceSN;
      } else {
        log.error(`Error: Ecoflow authentication failed!`);
        mqttExit();
      }
    } catch (error) {
      log.error(`Error: ${error}`);
      mqttExit();
    }
  }
  if (typeof certResponse === 'object' && certResponse?.protocol === 'mqtts') {
    const {
      url: mqttUrl,
      port: mqttPort,
      protocol: mqttProtocol,
      certificateAccount: mqttUsername,
      certificatePassword: mqttPassword,
    } = certResponse;
    log.debug(`Ecoflow MQTT URL: ${mqttUrl}`);
    log.debug(`Ecoflow MQTT port: ${mqttPort}`);
    log.debug(`Ecoflow MQTT protocol: ${mqttProtocol}`);
    log.debug(`Ecoflow MQTT username:`, {mqttUsername});
    log.debug(`Ecoflow MQTT password:`, {mqttPassword});
    log.debug(`Ecoflow MQTT client ID:`, {mqttClientId});
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
    try {
      mqttClient = mqtt.connect(connectMQTTUrl, mqttOptions);
      log.info('Ecoflow MQTT broker is connected.');
      mqttSetMainHandlers();
    } catch (error) {
      log.error(`Ecoflow MQTT broker connection error: ${error}`);
      gracefulExit();
    }
  } else {
    log.error(`Ecoflow MQTT broker is not available!`);
    gracefulExit();
  }
}

async function gracefulExit(mqttOnly = false) {
  if (telegramClient !== null && options.asUser === true && telegramClient.connected === true && mqttOnly === false) {
    try {
      await telegramClient.disconnect()
      log.info(`Telegram client is disconnected!`);
      try {
        await telegramClient.destroy();
        log.info(`Telegram client is destroyed!`);
        telegramClient = null;
      // eslint-disable-next-line sonarjs/no-ignored-exceptions
      } catch (error) {
        log.error(`Telegram client - nothing to destroy!`);
      }
    // eslint-disable-next-line sonarjs/no-ignored-exceptions
    } catch (error) {
      log.error(`Telegram client is not disconnected. Nothing to destroy!`);
    }
  } else if (telegramClient !== null && options.user === false) {
    log.info(`Telegram bot is stopped!`);
  }
  if (mqttClient !== null && mqttClient.connected === true) {
    try {
      await mqttClient.end();
      log.info(`Ecoflow MQTT broker is disconnected!`);
    // eslint-disable-next-line sonarjs/no-ignored-exceptions
    } catch (error) {
      log.error(`Ecoflow MQTT broker is not connected. Nothing to disconnect!`);
    }
    mqttClient = null;
    log.info(`Ecoflow MQTT broker is disconnected!`);
  }
  if (mqttOnly === false) {
    log.info('All clients are disconnected!');
    exit(0);
  }
}

process.on('SIGINT', () => {gracefulExit()});
process.on('SIGTERM', () => {gracefulExit()});

(async () => {
  try {
    if (await getTelegramPrepared()) {
      log.info('Telegram is prepared. Going to connect to EcoFlow MQTT!');
      await mqttConnectAndSubscribe();
    } else {
      log.error(`Telegram is not ready!`);
      await gracefulExit();
    }
  } catch (error) {
    log.error(`Error: ${error}`);
    await gracefulExit();
  }
})();
