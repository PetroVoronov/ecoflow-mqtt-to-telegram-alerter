# Ecoflow MQTT and Telegram Integration

This project integrates Ecoflow MQTT broker with Telegram to monitor and report the status of AC input voltage, current, and frequency.

## Features

- Connects to Ecoflow MQTT broker
- Retrieves and connects to Telegram client
- Subscribes to MQTT topics to monitor AC input parameters
- Logs and reports changes in AC input status via Telegram

## Prerequisites

- Node.js
- MQTT broker credentials (username, password, protocol)
- Telegram bot token and target entity

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter.git
    cd ecoflow-mqtt-to-telegram-alerter
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Configure your environment variables for MQTT and Telegram:
    ```sh
    export ECOFLOW_USERNAME=your_ecoflow_username
    export ECOFLOW_PASSWORD=your_ecoflow_password
    export ECOFLOW_DEVICE_SN=your_ecoflow_device_sn
    export TELEGRAM_API_ID=your_telegram_api_id
    export TELEGRAM_API_HASH=your_telegram_api_hash
    export TELEGRAM_CHAT_ID=your_telegram_chat_id
    export TELEGRAM_TOPIC_ID=your_telegram_topic_id
    ```

## Usage

1. Start the application:
    ```sh
    node index.js
    ```

2. The application will connect to the MQTT broker and Telegram client, then start monitoring the AC input parameters.

## Docker

You can also run this application using Docker.

1. Build the Docker image:
    ```sh
    docker build -t ecoflow-mqtt-to-telegram-alerter .
    ```

2. Run the Docker container:
    ```sh
    docker run -d --name ecoflow-mqtt-to-telegram-alerter \
        -e ECOFLOW_USERNAME=your_ecoflow_username \
        -e ECOFLOW_PASSWORD=your_ecoflow_password \
        -e ECOFLOW_DEVICE_SN=your_ecoflow_device_sn \
        -e TELEGRAM_API_ID=your_telegram_api_id \
        -e TELEGRAM_API_HASH=your_telegram_api_hash \
        -e TELEGRAM_BOT_AUTH_TOKEN=your_telegram_bot_auth_token \
        -e TELEGRAM_CHAT_ID=your_telegram_chat_id \
        -e TELEGRAM_TOPIC_ID=your_telegram_topic_id \
        ecoflow-mqtt-to-telegram-alerter
    ```

## Code Overview

- **index.js**: Main entry point of the application. Connects to MQTT broker and Telegram client, subscribes to MQTT topics, and handles incoming messages.

## Logging

- Logs information about the connection status and AC input parameters.
- Reports changes in AC input status via Telegram messages.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/fooBar`)
3. Commit your changes (`git commit -am 'Add some fooBar'`)
4. Push to the branch (`git push origin feature/fooBar`)
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.