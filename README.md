# Ecoflow MQTT to Telegram Alerter

[![GitHub release](https://img.shields.io/github/v/release/PetroVoronov/ecoflow-mqtt-to-telegram-alerter)](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/releases)
[![Docker Image Version](https://img.shields.io/docker/v/petrovoronov/ecoflow-mqtt-to-telegram-alerter)](https://hub.docker.com/r/petrovoronov/ecoflow-mqtt-to-telegram-alerter)
[![Docker Pulls](https://img.shields.io/docker/pulls/petrovoronov/ecoflow-mqtt-to-telegram-alerter)](https://hub.docker.com/r/petrovoronov/ecoflow-mqtt-to-telegram-alerter)
[![GitHub license](https://img.shields.io/github/license/PetroVoronov/ecoflow-mqtt-to-telegram-alerter)](LICENSE)
[![GitHub last commit](https://img.shields.io/github/last-commit/PetroVoronov/ecoflow-mqtt-to-telegram-alerter)](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commits/main)
[![GitHub issues](https://img.shields.io/github/issues/PetroVoronov/ecoflow-mqtt-to-telegram-alerter)](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/PetroVoronov/ecoflow-mqtt-to-telegram-alerter)](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/pulls)

[![Ukrainian translation](https://img.shields.io/static/v1?label=Readme&message=Ukrainian&labelColor=1f5fb2&color=fad247)](README-uk.md)

## About

This project integrates Ecoflow MQTT broker with Telegram to monitor and report the presence or absence of AC input on Ecoflow device.

## Features

- Connects to Ecoflow MQTT broker;
- Retrieves and connects to Telegram client;
- Subscribes to MQTT topics to monitor AC input parameters;
- Logs and reports changes in AC input status via Telegram.

## Prerequisites

- Ecoflow device: Tested with Ecoflow DELTA Pro. Should work with other Ecoflow devices that support MQTT. (Please refer on [EcoFlow to Prometheus exporter](https://github.com/berezhinskiy/ecoflow_exporter)).
- Node.js or Docker installed.
- Ecoflow device (serial number) and developer credentials from [EcoFlow Developer Platform](https://developer.ecoflow.com/).
- Telegram account API ID and hash or Telegram Bot token if alert will be generated by bot, and target user/chat/group/forum ID (including topicId for the forum). Details about the Telegram API can be found [here](https://core.telegram.org/api/obtaining_api_id).
- The Telegram target user, chat or group/forum ID and the topic ID for the forum (in other case is has to be set to 0).

### Obtaining the Telegram Chat ID

The Telegram user ID can be obtained by interacting with the [IDBot](https://t.me/myidbot) in Telegram. You can start a chat with the bot and it will provide you with your user ID.
Additionally, you can use this bot to obtain the chat ID of a group or channel by adding the bot to the group/channel and sending a message to the bot. The bot will reply with the chat ID.

### Obtaining the Telegram Topic ID

Post a message to that topic, then right-click on it and select Copy Message Link . Paste it on a scratchpad and notice that it has the following structure ```https://t.me/c/XXXXXXXXXX/YY/ZZ```. The topic ID is YY (integer).

## Installation

### Docker image installation

```sh
docker pull petrovoronov/ecoflow-mqtt-to-telegram-alerter
```

### Node.js installation from the source code

   1. Clone the repository:

        ```sh
        git clone https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter.git
        cd ecoflow-mqtt-to-telegram-alerter
        ```

   2. Or download the desired release from the [releases page](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/releases) and unpack it.

   3. Install dependencies:

        ```sh
        npm install
        ```

## Passing the basic configuration parameters

Basic configuration parameters, including Telegram credentials can be passed as environment variables, or you can skip it and application will ask you to enter it interactively.

After first run these parameters will be stored in the `data/storage` directory and will be used for the next runs.
So you will be asked to enter the parameters only once (or you should pass it as environment variables only on the first run).

**Important notice: if you want to change the parameters you should pass it again as environment variables at any time.**

Will look on it splitting by area of usage:

### Environment variables related to the EcoFlow API

There are two ways to authenticate with the EcoFlow API - via access & secret keys or via username & password. You can choose one of them.

#### Access & secret keys (preferred)

```sh
export ECOFLOW_ACCESS_KEY=your_ecoflow_access_key
export ECOFLOW_SECRET_KEY=your_ecoflow_secret_key
export ECOFLOW_DEVICE_SN=your_ecoflow_device_sn
```

#### Username & password

```sh
export ECOFLOW_USERNAME=your_ecoflow_username
export ECOFLOW_PASSWORD=your_ecoflow_password
export ECOFLOW_DEVICE_SN=your_ecoflow_device_sn
```

### Environment variables related to the Telegram API

Please pay attention that you should pass TELEGRAM_TOPIC_ID in any case. If no topics in target chat, set it to 0.

#### Environment variables in  case of working as telegram bot (default)

```sh
export TELEGRAM_BOT_AUTH_TOKEN=your_telegram_bot_auth_token
export TELEGRAM_CHAT_ID=your_telegram_chat_id
export TELEGRAM_TOPIC_ID=your_telegram_topic_id
```

#### Environment variables in case of working as telegram user

```sh
export TELEGRAM_API_ID=your_telegram_api_id
export TELEGRAM_API_HASH=your_telegram_api_hash
export TELEGRAM_CHAT_ID=your_telegram_chat_id
export TELEGRAM_TOPIC_ID=your_telegram_topic_id
```

## Command-line Options

The application can be configured using the following command-line options:

| Option                        | Short | Description                                           |  Type   | Default | Required |
|-------------------------------|-------|-------------------------------------------------------|---------|---------|----------|
| `--api-url`                   | `-a`  | URL of the Ecoflow API                                | String  | `https://api.ecoflow.com` | No  |
| `--auth-via-access-key`       |       | Use the access key for the Ecoflow API authentication | Boolean | `false` | No       |
| `--auth-via-username-password`|       | Use the username and password for the Ecoflow API authentication | Boolean | `false` | No       |
| `--as-user`                   |       | Start as user instance (bot instance by default)      | Boolean | `false` |    No    |
| `--keep-alive`                | `-k`  | Check if the MQTT client is alive every X seconds     | Number  |  `60`   |    No    |
| `--log-alive-status-interval` |       | Log the MQTT client alive status every Y minutes      | Number  |   `0`   |    No    |
| `--full-reconnect-failed-count`| `-r`  | Number of failed keep alive checks to perform full reconnect | Number | `5` |    No    |
| `--language`                  | `-l`  | Language code for i18n                                | String  |  `en`   |    No    |
| `--pin-message`               | `-p`  | Unpin message from chat                               | Boolean | `false` |    No    |
| `--unpin-previous`            | `-u`  | Pin message to chat                                   | Boolean | `false` |    No    |
| `--add-timestamp`             | `-t`  | Add timestamp to message                              | Boolean | `false` |    No    |
| `--tz`, `--time-zone`         |       | Time zone for timestamp                               | String  | Value of `TZ` environment variable or empty string |    No    |
| `--night-time`                | `-n`  | Interval in hours, when the script is sending messages in silent mode. Format is "start:stop" in 24h format   | String | Empty string |    No    |
| `-d, --debug`                 | `-d`  | Debug level of logging                                | Boolean | `false` |    No    |

## Running the Application

### Node.js

There is an example with all possible command-line options:

```sh
node index.js --language en --as-user --keep-alive 30 --log-alive-status-interval 5 --pin-message --unpin-previous --add-timestamp --time-zone "America/New_York" --debug
```

### Docker

By default the application will run as a telegram user instance and without any additional command-line options.

Due to the limitations of the Docker environment, the application will not be able to ask for the missing configuration parameters interactively. That's why you need to make a first run in interactive mode to provide the missing parameters.

**Important notice: pass all later needed command-line options at first run!***

#### Docker Volumes

**You must to map the application data directory to the container:**

- `/app/data` - for the application data, including the configurations and the some other actual data. Mandatory for the mapping!
You can map in on any local directory on the host system or docker volume.

Additionally, you can map the localization directory to the container:

- `/app/locales` - for the localization files, if  you want to use own messages in the telegram chat. Optional for the mapping.

#### Docker first run to work as Telegram user

Due to the specifics of the Docker environment, the application will not be able to ask for the missing configuration parameters interactively. That's why you need to make a first run in interactive mode to provide the missing parameters.

So, the first run should be like one of the following:

- to work as telegram user and set all basic configuration parameters interactively:

    ```sh
    docker run -it --name ecoflow-mqtt-to-telegram-alerter \
        -v /path/to/your/data:/app/data \
        -v /path/to/your/locales:/app/locales \
        petrovoronov/ecoflow-mqtt-to-telegram-alerter:latest \
        --as-user
    ```

- to work as telegram user and set all basic configuration parameters as environment variables (but interactive mode still required):

    ```sh
    docker run -it --name ecoflow-mqtt-to-telegram-alerter \
        -v /path/to/your/data:/app/data \
        -v /path/to/your/locales:/app/locales \
        -e ECOFLOW_USERNAME=your_ecoflow_username \
        -e ECOFLOW_PASSWORD=your_ecoflow_password \
        -e ECOFLOW_DEVICE_SN=your_ecoflow_device_sn \
        -e TELEGRAM_API_ID=your_telegram_api_id \
        -e TELEGRAM_API_HASH=your_telegram_api_hash \
        -e TELEGRAM_CHAT_ID=your_telegram_chat_id \
        -e TELEGRAM_TOPIC_ID=your_telegram_topic_id \
        petrovoronov/ecoflow-mqtt-to-telegram-alerter:latest \
        --as-user
    ```

After the first run the application will store the configuration parameters and additional info - please stop the container by pressing `Ctrl+C` and start it again with the commands from the next section.

#### Docker first run to work as Telegram bot

- If you don't want to pass the configuration parameters as environment variables at the first run, you can run the docker image in interactive mode and pass the needed parameters interactively.

  And again, after the first run the application will store the configuration parameters and additional info - please stop the container by pressing `Ctrl+C` and start it again with the commands from the next section.

```sh
docker run -it --name ecoflow-mqtt-to-telegram-alerter \
    -v /path/to/your/data:/app/data \
    -v /path/to/your/locales:/app/locales \
    petrovoronov/ecoflow-mqtt-to-telegram-alerter:latest
```

- But please take in account there is no interactive mode for the telegram bot instance is needed. Simple pass all needed parameters as environment variables at the first run.

```sh
docker run -d --name ecoflow-mqtt-to-telegram-alerter \
    -v /path/to/your/data:/app/data \
    -v /path/to/your/locales:/app/locales \
    -e ECOFLOW_USERNAME=your_ecoflow_username \
    -e ECOFLOW_PASSWORD=your_ecoflow_password \
    -e ECOFLOW_DEVICE_SN=your_ecoflow_device_sn \
    -e TELEGRAM_BOT_AUTH_TOKEN=your_telegram_bot_auth_token \
    -e TELEGRAM_CHAT_ID=your_telegram_chat_id \
    -e TELEGRAM_TOPIC_ID=your_telegram_topic_id \
    petrovoronov/ecoflow-mqtt-to-telegram-alerter:latest
```

#### Docker next runs

After the first run you can run the application with the same configuration parameters as the previous run without any additional command-line options.

To start the application, run the following command:

```sh
docker start ecoflow-mqtt-to-telegram-alerter
```

To stop the application, run the following command:

```sh
docker stop ecoflow-mqtt-to-telegram-alerter
```

### Docker Compose

To run the application using Docker Compose, create a `docker-compose.yml` file with the following content:

### Working as Telegram user with username & password to access EcoFlow API

```yaml
version: '3'
services:
    ecoflow-mqtt-to-telegram-alerter:
        image: petrovoronov/ecoflow-mqtt-to-telegram-alerter:latest
        volumes:
            - /path/to/your/data:/app/data
            - /path/to/your/locales:/app/locales
        environment:
            - ECOFLOW_USERNAME=your_ecoflow_username
            - ECOFLOW_PASSWORD=your_ecoflow_password
            - ECOFLOW_DEVICE_SN=your_ecoflow_device_sn
            - TELEGRAM_API_ID=your_telegram_api_id
            - TELEGRAM_API_HASH=your_telegram_api_hash
            - TELEGRAM_CHAT_ID=your_telegram_chat_id
            - TELEGRAM_TOPIC_ID=your_telegram_topic_id
        command: --as-user
```

### Working as Telegram bot with access & secret keys for EcoFlow API

```yaml
version: '3'
services:
    ecoflow-mqtt-to-telegram-alerter:
        image: petrovoronov/ecoflow-mqtt-to-telegram-alerter:latest
        volumes:
            - /path/to/your/data:/app/data
            - /path/to/your/locales:/app/locales
        environment:
            - ECOFLOW_ACCESS_KEY=your_ecoflow_access_key
            - ECOFLOW_SECRET_KEY=your_ecoflow_secret_key
            - ECOFLOW_DEVICE_SN=your_ecoflow_device_sn
            - TELEGRAM_BOT_AUTH_TOKEN=your_telegram_bot_auth_token
            - TELEGRAM_CHAT_ID=your_telegram_chat_id
            - TELEGRAM_TOPIC_ID=your_telegram_topic_id
```

Replace `/path/to/your/data` and `/path/to/your/locales` with the actual paths on your system where you want to store the application data and localization files.

Then, run the following command to start the application:

```sh
docker-compose up -d
```

This will start the application as a Telegram bot instance with the specified configuration parameters.

## Localization

The application supports sending the alerts to telegram in different languages. The default language is English (`en`).
You can change the language by passing the `--language` command-line option with the language code.
You can change the messages by editing the localization files in the `locales` directory.

### Adding a New Language

You can add a new language by creating a new localization file in the `locales` directory with the language code as the filename (e.g., `fr.json` for French). And then you can add the translations for the messages in the new file.

```json
{
    "Electricity is returned": "L'électricité est revenue",
    "Electricity is cut off": "L'électricité est coupée"
}
```

Then you can pass the language code as the value of the `--language` command-line option to use the new language.

### Localization Files for Docker

In case of using Docker, you can map the `locales` directory to the container to use the own localization files for the messages in the telegram chat.
But in this case after first run you will have only the **empty files** in the appropriate `locales` directory in the host system. Then you can edit/add the needed localization files to the `locales` directory in the host system and restart the container.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
