const {Api, TelegramClient} = require('telegram');
const {StringSession, StoreSession} = require('telegram/sessions');
const readline = require('node:readline/promises');
const {stdin: input, stdout: output, exit} = require('node:process');
const stringify = require('json-stringify-safe');
const {LocalStorage} = require('node-localstorage');
const yargs = require('yargs');
const {logLevelInfo, logLevelDebug, setLogLevel, logDebug, logInfo, logWarning, logError} = require('./modules/logging/logging');
const {NewMessage, NewMessageEvent} = require('telegram/events');
const {CallbackQuery, CallbackQueryEvent} = require('telegram/events/CallbackQuery');
const {name: scriptName, version: scriptVersion} = require('./version');
const i18n = require('./modules/i18n/i18n.config');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const mqtt = require('mqtt');
const { log } = require('node:console');

const ecoflowUserName = process.env.ECOFLOW_USERNAME;
const ecoflowPassword = process.env.ECOFLOW_PASSWORD;
const ecoflowDeviceSN = process.env.ECOFLOW_DEVICE_SN;

const options = yargs
  .usage('Usage: $0 [options]')
  .option('b', {
    alias: 'no-bot',
    describe: 'Start without the bot instance',
    type: 'boolean',
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

const ecoflowAPIURL = 'https://api.ecoflow.com',
  ecoflowAPIAuthenticationPath = '/auth/login',
  ecoflowAPICertificationPath = '/iot-auth/app/certification',
  headers = {lang: 'en_US', 'content-type': 'application/json'};

logDebug(`Ecoflow username: ${ecoflowUserName}`);
logDebug(`Ecoflow password: ${ecoflowPassword}`);
logDebug(`Ecoflow device SN: ${ecoflowDeviceSN}`);
const ecoflowAPI = axios.create({
  baseURL: ecoflowAPIURL,
  timeout: 10000,
});
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
    // const ecoflowToken = response.data.data.token;
    // logDebug(`Ecoflow response: ${stringify(response, null, 2)}`);
    // logDebug(`Ecoflow token: ${ecoflowToken}`);
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
      "lang": "en_US",
      "authorization": `Bearer ${token}`
    };
    ecoflowAPI.get(`${ecoflowAPICertificationPath}?userId=${userId}`, {headers: headers}).then((response) => {
      // logDebug(`Ecoflow certification response: ${stringify(response, null, 2)}`);
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
      const connectMQTTUrl = `${mqttProtocol}://${mqttUrl}:${mqttPort}`

      mqtt.connectAsync(connectMQTTUrl, {
        clientId: mqttClientId,
        clean: true,
        connectTimeout: 4000,
        username: mqttUsername,
        password: mqttPassword,
        reconnectPeriod: 1000,
        protocol: mqttProtocol,
      }).then((mqttClient) => {
        logDebug("Ecoflow MQTT broker is connected. Subscribing to topics...");
        // mqttClient.on("connect", () => {
        //   logDebug("Ecoflow MQTT client is connected");
          mqttClient.subscribe(`/app/device/property/${ecoflowDeviceSN}`, (error) => {
            if (error) {
              logError(`Ecoflow MQTT subscription error: ${error}`);
            } else {
              logDebug(`Ecoflow MQTT subscription to topic: /app/device/property/${ecoflowDeviceSN}`);
            }
          });
        // });

        mqttClient.on("message", (topic, message) => {
          // logDebug(`Ecoflow MQTT message received on topic: ${topic}`);
          // message is Buffer
          // console.log(message.toString());
          data = JSON.parse(message.toString());
          if (data.params?.hasOwnProperty('inv.acInVol') && data.params?.hasOwnProperty('inv.acInFreq') && data.params?.hasOwnProperty('inv.acInAmp') ) {
            logInfo(`Ecoflow AC input voltage: ${data.params['inv.acInVol']/1000} V`);
            logInfo(`Ecoflow AC input frequency: ${data.params['inv.acInFreq']} Hz`);
            logInfo(`Ecoflow AC input current: ${data.params['inv.acInAmp']/1000} A`);
          }
          // client.end();
        });

      }).catch((error) => {
        logError(`Ecoflow MQTT broker connection error: ${error}`);
      });
    }).catch((error) => {
      logError(`Ecoflow certification error: ${error}`);
    });
  })
  .catch((error) => {
    logError(`Error: ${error}`);
  });
