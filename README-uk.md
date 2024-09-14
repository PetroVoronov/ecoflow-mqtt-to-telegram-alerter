# Ecoflow MQTT to Telegram Alerter

[![GitHub release](https://img.shields.io/github/v/release/PetroVoronov/ecoflow-mqtt-to-telegram-alerter)](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/releases)
[![Docker Image Version](https://img.shields.io/docker/v/petrovoronov/ecoflow-mqtt-to-telegram-alerter)](https://hub.docker.com/r/petrovoronov/ecoflow-mqtt-to-telegram-alerter)
[![Docker Pulls](https://img.shields.io/docker/pulls/petrovoronov/ecoflow-mqtt-to-telegram-alerter)](https://hub.docker.com/r/petrovoronov/ecoflow-mqtt-to-telegram-alerter)
[![GitHub license](https://img.shields.io/github/license/PetroVoronov/ecoflow-mqtt-to-telegram-alerter)](LICENSE)
[![GitHub last commit](https://img.shields.io/github/last-commit/PetroVoronov/ecoflow-mqtt-to-telegram-alerter)](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commits/main)
[![GitHub issues](https://img.shields.io/github/issues/PetroVoronov/ecoflow-mqtt-to-telegram-alerter)](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/PetroVoronov/ecoflow-mqtt-to-telegram-alerter)](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/pulls)

## Про проект

Цей проєкт інтегрує брокер MQTT від Ecoflow з Telegram для моніторингу та звітування про наявність або відсутність вхідної змінної напруги на пристрої Ecoflow.

## Функції

- Підключення до брокера MQTT від Ecoflow;
- Отримання та підключення до клієнта Telegram;
- Підписка на теми MQTT для моніторингу параметрів вхідної змінної напруги;
- Журналювання та звітування про зміни статусу вхідної змінної напруги через Telegram.

## Вимоги

- Пристрій Ecoflow: протестовано з Ecoflow DELTA Pro. Має працювати з іншими пристроями Ecoflow, які підтримують MQTT. (Будь ласка, зверніться до [EcoFlow to Prometheus exporter](https://github.com/berezhinskiy/ecoflow_exporter)).
- Встановлений Node.js або Docker.
- Пристрій Ecoflow (серійний номер) та облікові дані розробника з [EcoFlow Developer Platform](https://developer.ecoflow.com/).
- Ідентифікатор API та хеш-ключ облікового запису Telegram або токен Telegram бота (якщо сповіщення генеруватиметься ботом), ідентифікатор цільового користувача/чату/групи/форуму (включно з topicId для форуму). Деталі щодо API Telegram можна знайти [тут](https://core.telegram.org/api/obtaining_api_id).
- Ідентифікатор цільового користувача, чату або групи/форуму в Telegram та ідентифікатор теми для форуму (в іншому випадку має бути встановлено на 0).

### Отримання ідентифікатора чату в Telegram

Ідентифікатор користувача Telegram можна отримати, взаємодіючи з [IDBot](https://t.me/myidbot) у Telegram. Ви можете почати чат з ботом, і він надасть вам ваш ідентифікатор користувача.
Крім того, ви можете використати цього бота для отримання ідентифікатора чату групи або каналу, додавши бота до групи/каналу та надіславши повідомлення боту. Бот відповість з ідентифікатором чату.

### Отримання ідентифікатора теми в Telegram

Опублікуйте повідомлення в цій темі, потім клацніть правою кнопкою миші на ньому та виберіть «Копіювати посилання на повідомлення». Вставте його у чернетку та зверніть увагу на наступну структуру: https://t.me/c/XXXXXXXXXX/YY/ZZ. Ідентифікатор теми — YY (ціле число).

## Встановлення

### Встановлення Docker образу

```sh
docker pull petrovoronov/ecoflow-mqtt-to-telegram-alerter
```

### Встановлення Node.js з вихідного коду

1. Клонуйте репозиторій:
    ```sh
    git clone https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter.git
    cd ecoflow-mqtt-to-telegram-alerter
    ```

2. Встановіть залежності:
    ```sh
    npm install
    ```

## Передача базових параметрів конфігурації
Базові параметри конфігурації, включаючи облікові дані Telegram, можуть бути передані як змінні середовища, або ви можете пропустити це, і програма запросить вас ввести їх інтерактивно.

### Змінні середовища у разі роботи як користувач Telegram (за замовчуванням):
```sh
export ECOFLOW_USERNAME=your_ecoflow_username
export ECOFLOW_PASSWORD=your_ecoflow_password
export ECOFLOW_DEVICE_SN=your_ecoflow_device_sn
export TELEGRAM_API_ID=your_telegram_api_id
export TELEGRAM_API_HASH=your_telegram_api_hash
export TELEGRAM_CHAT_ID=your_telegram_chat_id
export TELEGRAM_TOPIC_ID=your_telegram_topic_id
```

### Змінні середовища у разі роботи як бот Telegram:

```sh
export ECOFLOW_USERNAME=your_ecoflow_username
export ECOFLOW_PASSWORD=your_ecoflow_password
export ECOFLOW_DEVICE_SN=your_ecoflow_device_sn
export TELEGRAM_BOT_AUTH_TOKEN=your_telegram_bot_auth_token
export TELEGRAM_CHAT_ID=your_telegram_chat_id
export TELEGRAM_TOPIC_ID=your_telegram_topic_id
```

Після першого запуску ці параметри будуть збережені в каталозі `data/storage` і будуть використовуватися для наступних запусків.
Таким чином, вас попросять ввести параметри лише один раз (або ви повинні передати їх як змінні середовища лише під час першого запуску).

**Важливе зауваження: якщо ви хочете змінити параметри, вам потрібно знову передати їх як змінні середовища в будь-який час.**

## Опції командного рядка

Програму можна налаштувати за допомогою таких параметрів командного рядка:

| Параметр                         | Псевдонім | Опис | Тип | За замовчуванням | Обов'язково |
|----------------------------------|-----------|------|-----|------------------|-------------|
| `-l, --language`                 | `-l`      | Код мови для інтернаціоналізації | Рядок | `en` | Ні |
| `-b, --as-user`                  |           | Запуск як екземпляр бота | Логічний |  | Ні |
| `-k, --keep-alive`               | `-k`      | Перевірка чи MQTT клієнт активний кожні X секунд | Число | `60` | Ні |
| `--log-alive-status-interval`    |           | Запис статусу MQTT клієнта кожні Y хвилин | Число | `0` | Ні |
| `-p, --pin-message`              | `-p`      | Відкріпити повідомлення з чату | Логічний | `false` | Ні |
| `-u, --unpin-previous`           | `-u`      | Закріпити повідомлення в чаті | Логічний | `false` | Ні |
| `-t, --add-timestamp`            | `-t`      | Додати мітку часу до повідомлення | Логічний | `false` | Ні |
| `-tz, --time-zone`               | `-tz`     | Часовий пояс для мітки часу | Рядок | Значення змінної середовища `TZ` або порожній рядок | Ні |
| `-d, --debug`                    | `-d`      | Детальний рівень журналювання | Рядок | | Ні |

## Запуск програми

### Node.js

Приклад з усіма можливими параметрами командного рядка:

```sh
node index.js --language en --as-user --keep-alive 30 --log-alive-status-interval 5 --pin-message --unpin-previous --add-timestamp --time-zone "America/New_York" --debug
```

### Docker

За замовчуванням програма запускається як екземпляр користувача Telegram без додаткових параметрів командного рядка.

Через обмеження Docker-середовища програма не зможе інтерактивно запитувати відсутні параметри конфігурації. Саме тому необхідно виконати перший запуск у інтерактивному режимі, щоб надати відсутні параметри.

#### Docker Volumes

**Необхідно змонтувати каталог даних програми в контейнер:**
- `/app/data` - для даних програми, включаючи конфігурації та інші актуальні дані. Обов'язково для монтування!
Ви можете змонтувати будь-який локальний каталог на хост-системі або об'єм Docker.

Крім того, ви можете змонтувати каталог локалізації в контейнер:
- `/app/locales` - для файлів локалізації, якщо ви хочете використовувати власні повідомлення у Telegram-чаті. Необов'язково для монтування.

#### Перший запуск Docker для роботи як користувач Telegram або як бот Telegram для налаштування всіх основних параметрів конфігурації в інтерактивному режимі

Через специфіку середовища Docker, додаток не зможе запитати відсутні параметри конфігурації в інтерактивному режимі. Тому вам потрібно зробити перший запуск в інтерактивному режимі, щоб надати відсутні параметри.

Отже, перший запуск повинен бути таким:

- для роботи як користувач Telegram і налаштування всіх основних параметрів конфігурації в інтерактивному режимі:
    ```sh
    docker run -it --name ecoflow-mqtt-to-telegram-alerter \
        -v /path/to/your/data:/app/data \
        -v /path/to/your/locales:/app/locales \
        petrovoronov/ecoflow-mqtt-to-telegram-alerter:latest \
        node src/index.js --as-user
    ```

- для роботи як користувач Telegram і налаштування всіх основних параметрів конфігурації через змінні середовища (але інтерактивний режим все ще потрібен):
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
        node src/index.js --as-user
    ```

- для роботи як бот Telegram і налаштування всіх основних параметрів конфігурації в інтерактивному режимі:
    ```sh
    docker run -it -d --name ecoflow-mqtt-to-telegram-alerter \
        -v /path/to/your/data:/app/data \
        -v /path/to/your/locales:/app/locales \
        petrovoronov/ecoflow-mqtt-to-telegram-alerter:latest
    ```

Після першого запуску додаток збереже параметри конфігурації та додаткову інформацію - будь ласка, зупиніть контейнер, натиснувши `Ctrl+C`, і запустіть його знову за допомогою команд з наступного розділу.

#### Перший запуск Docker для роботи як бот Telegram і налаштування всіх основних параметрів конфігурації через змінні середовища

Інтерактивний режим для роботи як бот Telegram не потрібен. Тому перший запуск повинен бути таким:
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

**Важлива примітка: вкажіть усі потрібні пізніше параметри командного рядка під час першого запуску!**

#### Наступні запуски Docker

Після першого запуску ви можете запускати застосунок із тими самими параметрами конфігурації, що й під час попереднього запуску, без додаткових параметрів командного рядка.

Щоб запустити застосунок, виконайте наступну команду:

```sh
docker start ecoflow-mqtt-to-telegram-alerter
```

Щоб зупинити застосунок, виконайте наступну команду:

```sh
docker stop ecoflow-mqtt-to-telegram-alerter
```

### Docker Compose

Щоб запустити застосунок за допомогою Docker Compose, створіть файл `docker-compose.yml` з наступним вмістом:

### У разі роботи як користувач Telegram:

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
        command: node src/index.js --as-user
```

### У разі роботи як бот Telegram:

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
            - TELEGRAM_BOT_AUTH_TOKEN=your_telegram_bot_auth_token
            - TELEGRAM_CHAT_ID=your_telegram_chat_id
            - TELEGRAM_TOPIC_ID=your_telegram_topic_id
        command: node src/index.js
```

Замініть `/path/to/your/data` та `/path/to/your/locales` на фактичні шляхи на вашій системі, де ви хочете зберігати дані застосунку та файли локалізації.

Потім виконайте наступну команду для запуску застосунку:

```sh
docker-compose up -d
```

Це запустить застосунок як інстанцію бота Telegram зі вказаними параметрами конфігурації.

## Локалізація

Застосунок підтримує відправлення сповіщень у Telegram різними мовами. Мова за замовчуванням — англійська (`en`).
Ви можете змінити мову, передавши опцію командного рядка `--language` з кодом мови.
Ви можете змінити повідомлення, відредагувавши файли локалізації в каталозі `locales`.

### Додавання нової мови
Ви можете додати нову мову, створивши новий файл локалізації в каталозі `locales` з кодом мови як ім'ям файлу (наприклад, `fr.json` для французької). Потім ви можете додати переклади повідомлень у новий файл.
```json
{
    "Electricity is returned": "L'électricité est revenue",
    "Electricity is cut off": "L'électricité est coupée"
}
```
Потім ви можете передати код мови як значення опції командного рядка `--language`, щоб використовувати нову мову.

### Файли локалізації для Docker
У разі використання Docker ви можете зв'язати каталог `locales` з контейнером, щоб використовувати власні файли локалізації для повідомлень у чаті Telegram.
Але в цьому випадку після першого запуску ви матимете лише **порожні файли** у відповідному каталозі `locales` на хост-системі. Потім ви можете відредагувати/додати потрібні файли локалізації в каталог `locales` у хост-системі та перезапустити контейнер.


## Ліцензія

Цей проект ліцензовано за ліцензією MIT – див. файл [LICENSE](LICENSE) для деталей.