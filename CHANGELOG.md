# Changelog

## [1.5.6](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/compare/v1.5.5...v1.5.6) (2024-11-06)


### Miscellaneous Chores

* **deps-dev:** Bump @babel/core from 7.25.8 to 7.26.0 ([cc70fbc](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/cc70fbc54bc717f6a6f07ab23bb7a4174cd57d3c))
* **deps-dev:** Bump @babel/eslint-parser from 7.25.8 to 7.25.9 ([6670628](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/6670628d7c563739d576f0773d8d99a0f0b0655c))
* **deps-dev:** Bump eslint-plugin-sonarjs from 2.0.3 to 2.0.4 ([8e821b9](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/8e821b980c2a7e31e0b7d12604cdd3e177c2ca8b))
* **deps:** Bump node from 22-alpine to 23-alpine ([62bf27e](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/62bf27ed34a1223e4c9a22c7d21a49609520ad66))
* **deps:** Bump telegram from 2.25.15 to 2.26.6 ([9af927b](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/9af927b334dcd2eca89342a21cb81c856ac417db))
* **deps:** Bump uuid from 10.0.0 to 11.0.2 ([71eca6e](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/71eca6eb36eb3008e08af2d7df38b3e8f847cb2e))
* **dev:** add Jest configuration and dependency ([1623d77](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/1623d7784fb80ef09b1aaf7d06ebff7c0aa1e05d))


### Code Refactoring

* **cache:** refactor code of Cache class with type conversion and event reactions ([1623d77](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/1623d7784fb80ef09b1aaf7d06ebff7c0aa1e05d))
* **logging:** refactor code of SecuredLogger with sensitive data masking ([1623d77](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/1623d7784fb80ef09b1aaf7d06ebff7c0aa1e05d))


### Tests

* **cache:** add some tests ([1623d77](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/1623d7784fb80ef09b1aaf7d06ebff7c0aa1e05d))
* **logging:** add some tests ([1623d77](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/1623d7784fb80ef09b1aaf7d06ebff7c0aa1e05d))

## [1.5.5](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/compare/v1.5.4...v1.5.5) (2024-10-16)

### Miscellaneous Chores

* **deps-dev:** Bump @babel/core from 7.25.7 to 7.25.8 ([20ab12f](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/20ab12fe1182a065518bb47f9d7480b949d55887))
* **deps-dev:** Bump @babel/eslint-parser from 7.25.7 to 7.25.8 ([2c91ef3](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/2c91ef3b12ea2f2961fdc1ea2ce4113933812dbd))
* **deps-dev:** Bump globals from 15.10.0 to 15.11.0 ([9d64f7e](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/9d64f7e8e98c13ed3316b0b075647456a3ca7be2))

## [1.5.4](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/compare/v1.5.3...v1.5.4) (2024-10-08)

### Code Refactoring

* The whole code refactored to mostly use the `await` construction instead of `.then` ([5dcb216](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/5dcb216b9df75d0b1c171b0400fdb13d38e26959))

## [1.5.3](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/compare/v1.5.2...v1.5.3) (2024-10-07)

### Code Refactoring

* `readline` replaced by `enquirer` ([ecf9157](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/ecf91579631bda2f7165ec88e59db9701bafa81b))
* Added authentication via access and secret keys pair, as alternative to user and password ([ecf9157](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/ecf91579631bda2f7165ec88e59db9701bafa81b))

## [1.5.2](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/compare/v1.5.1...v1.5.2) (2024-10-07)

### Continuous Integration

* **release-please:** run CHANGELOG.md through markdownlint-cli2 on PR's ([69a5234](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/69a5234693e0f4a98291aa653b3d6eb276d02ecb))

### Miscellaneous Chores

* **deps-dev:** Bump @babel/core from 7.25.2 to 7.25.7 ([78ba104](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/78ba1042beb9c73da5a53cb11f46461cefb54654))
* **deps-dev:** Bump @babel/eslint-parser from 7.25.1 to 7.25.7 ([e79b5bd](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/e79b5bdcadbb46ad5138d6bc7f4ac2d50a8a02b3))
* **deps-dev:** Bump globals from 15.9.0 to 15.10.0 ([fda3c0e](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/fda3c0e4f8876035d471b97f6c89fd14540d7a57))
* **deps:** Bump telegram from 2.25.11 to 2.25.15 ([2341bdf](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/2341bdf0dd05687d738f5c8b2b6767b8425fe6a8))
* **dev:** Add markdownlint-cli2 to improve format of documentation (README's, CHANGELOG) ([69a5234](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/69a5234693e0f4a98291aa653b3d6eb276d02ecb))

### Documentation

* Fix README's and CHANGELOG formatting through markdownlint-cli2 ([69a5234](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/69a5234693e0f4a98291aa653b3d6eb276d02ecb))
* Fix README's sections related to the default start mode and first Docker runs ([69a5234](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/69a5234693e0f4a98291aa653b3d6eb276d02ecb))

## [1.5.1](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/compare/v1.5.0...v1.5.1) (2024-10-01)

### Continuous Integration

* Update package-lock.json ([89f2433](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/89f24337d19bc5657caed5fc26419506acad3052))

### Documentation

* **docker:** Refactor run chapter in README-uk.md ([89f2433](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/89f24337d19bc5657caed5fc26419506acad3052))
* Update command-line options in README's ([449a92f](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/449a92fa5f4ebb85d03d71b22554c81ce9eb8435))

### Code Refactoring

* Add new command-line option for Ecoflow API URL ([449a92f](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/449a92fa5f4ebb85d03d71b22554c81ce9eb8435))

## [1.5.0](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/compare/v1.4.1...v1.5.0) (2024-10-01)

### Miscellaneous Chores

* **deps-dev:** Bump eslint-plugin-sonarjs from 2.0.2 to 2.0.3 ([b43a5bd](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/b43a5bde5bd1bc68dc158762e8cc563b5a29d1bd))
* **deps:** Bump telegram from 2.24.11 to 2.25.11 ([b7a426f](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/b7a426f71b6460f987e32184565a3a951ece48b7))

### Documentation

* **docker:** Refactor run chapter ([25f01aa](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/25f01aacb2ed36c52b828f1986c64971dd816811))

### Features

* **docker:** Refactor Dockerfile to use ENTRYPOINT and empty CMD instruction, to have possibility to use command-line options of application directly with docker start ([25f01aa](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/25f01aacb2ed36c52b828f1986c64971dd816811))

## [1.4.1](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/compare/v1.4.0...v1.4.1) (2024-09-27)

### Continuous Integration

* Update repo description in deploy_docker_on_tag.yml ([3135f58](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/3135f587f270ef32dcf7fa629ce2979adcbf6755))

### Documentation

* Make CHANGELOG.md full of changes ([48d18e1](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/48d18e12d2cec99ecdde2e2f9e420c95ab5fa33b))

### Code Refactoring

* Refactor logging statements in Cache.js ([bbe5932](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/bbe5932a63c9afcf1038f4e5c846981f08f66a3d))

## [1.4.0](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/compare/v1.3.0...v1.4.0) (2024-09-16)

### Miscellaneous Chores

* Additional logging of command-line options on start ([4630503](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/4630503aa51f83209e166c176449f4709157063a))

### Features

* New option: `nightTime` - Interval in hours, when the script is sending messages in silent mode. Format is "start:stop" in 24h format ([4630503](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/4630503aa51f83209e166c176449f4709157063a))

### Bug Fixes

* Debug log improvement ([4630503](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/4630503aa51f83209e166c176449f4709157063a))

## [1.3.0](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/compare/v1.2.9...v1.3.0) (2024-09-15)

### Features

* Replace `telegraf` with `grammy` ([044405b](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/044405b7e32fd4b53151d2e52754a22a7a872e36))

### Bug Fixes

* Added overrides for `whatwg-url` to version 14.0.0, to get rid of "DeprecationWarning: The `punycode` module is deprecated." ([044405b](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/044405b7e32fd4b53151d2e52754a22a7a872e36))
* **cache:** Fixed reading and writing the `null` or `undefined` values in `Cache` module ([044405b](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/044405b7e32fd4b53151d2e52754a22a7a872e36))

### Code Refactoring

* Reorder processing `Telegram` and `Ecoflow MQTT` preparation and connection to avoid impossibility to send message to "unprepared" `Telegram`. ([044405b](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/044405b7e32fd4b53151d2e52754a22a7a872e36))
* **telegram:** Code to interact with `Telegram` is rewritten, to make it more unified, independently from mode (user or bot) ([044405b](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/044405b7e32fd4b53151d2e52754a22a7a872e36))

## [1.2.9](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/compare/v1.2.8...v1.2.9) (2024-09-15)

### Continuous Integration

* Update version.js ([59e424f](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/59e424fe9cfa05ea48bd77efbb686741b2b642dd))

### Miscellaneous Chores

* Remove unused `genversion` dependencies and scripts ([abbbcc7](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/abbbcc7edf65bb4a9fed7fbc83cef921d8cc084b))

## [1.2.8](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/compare/v1.2.7...v1.2.8) (2024-09-15)

### Continuous Integration

* Update release-please-config.json to process src/version.js ([ba6989f](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/ba6989fe8423819452e7624530c3ae560ba73d76))

### Documentation

* Update README files with release badges ([9293bce](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/9293bce934d87f49b4b2c50907a9730edea6cff7))

## [1.2.7](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/compare/v1.2.6...v1.2.7) (2024-09-14)

### Continuous Integration

* Add release-please configuration files ([ba5485e](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/ba5485ed4611ec506f269facf41af54e63e95c36))

### Miscellaneous Chores

* release 1.2.7 ([3f9d229](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/3f9d2297f941d772867e0d5b464a4459cd7435ff))

### Features

* Add release-please workflow ([c56d953](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/c56d953dc730961608053fab7ba0335d695365d8))

## [1.2.6](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/compare/v1.2.5...v1.2.6) (2024-09-14)

### Code Refactoring

* Refactor `gramjs` connection configuration to include script name and version ([94a7fa9](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/94a7fa917dcfcc5979cf1fafb2b407d3a5b3d4ff))

## [1.2.5](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/compare/v1.2.4...v1.2.5) (2024-09-14)

### Bug Fixes

* Refactor log messages to use the 'log.error' function instead of 'logError' ([e693719](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/e693719494ec49a0ca69fd553c7ae5d1c0368645))

## [1.2.4](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/compare/v1.2.3...v1.2.4) (2024-09-14)

### Features

* Add the functionality to mask sensitive data in logs ([1ba6687](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/1ba668707653e79cdb197977f84676e0eb45c4bc))

### Code Refactoring

* Refactor logging to reuse the logger from the `gramjs` ([1ba6687](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/1ba668707653e79cdb197977f84676e0eb45c4bc))
* Small refactoring of Telegram message sending logic ([1ba6687](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/1ba668707653e79cdb197977f84676e0eb45c4bc))
* Refactor log message in user session migration function ([8b77fa5](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/8b77fa5039c0cd5d11173e5fdca9017ac62bba80))
* Refactor log message in mqttSubscribe function ([d4b334e](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/d4b334ea555e9986eb51e2cfc597b1c2f68f748c))

## [1.2.3](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/compare/v1.2.2...v1.2.3) (2024-09-13)

### Code Refactoring

* Update `npm install` command to use `npm ci` in Dockerfile and make it dependent on `TARGETPLATFORM`. This ensures that the node-gyp module is correctly installed for the 'linux/amd64' environment ([1058d9f](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/1058d9f153d823fcd57bc17e3f38f1bb48100d73))

## [1.2.2](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/compare/v1.2.1...v1.2.2) (2024-09-13)

### Code Refactoring

* Refactor mqttSubscribe function in index.js ([2b94722](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/2b947226184093b47f7261b8f684bb641e5e064f))

## [1.2.1](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/compare/v1.2.0...v1.2.1) (2024-09-13)

### Miscellaneous Chores

* Improve logging functionality ([d41a1f9](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/d41a1f9b99bdcc0579bb2346b9720ac60bb4d949))

## [1.2.0](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/compare/v1.1.6...v1.2.0) (2024-09-13)

### Features

* Refactor the script to work in `bot` mode by default and via `telegraf` package instead of `gramjs` to simplify usage. Update READMEs accordingly. ([f5a816e](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/f5a816eddd9d2b332d5ca8e645b64386a9afcfa4))

### Bug Fixes

* Process `process.env.TELEGRAM_TOPIC_ID` correctly when it has zero value ([2adea5c](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/2adea5c375f8246a587058782827fac819beb440))

## [1.1.6](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/compare/v1.1.5...v1.1.6) (2024-09-10)

### Bug Fixes

* Fix variable name `logAliveInterval` ([f093211](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/f0932116a64cbcff7154b1b68af7a99aab0134cf))

## [1.1.5](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/compare/v1.1.4...v1.1.5) (2024-09-09)

### Documentation

* Update Ukrainian translation in `README-uk.md` ([7d81ddb](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/7d81ddbef737a00a0e90e06525a22c482cc39aaf))
* Update `README.md` with Docker badges and Ukrainian translation ([ff43593](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/ff43593b636c9eccc36c3aa5d9034dee1378ab5e))
* Rewrite `README.md` and populate all locale files ([09acd17](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/09acd1761368d56592d31512b8a4f04218acdeb2))
* Fix `README.md` formatting ([e186344](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/e186344af51357c5deba76a201808ace6c7c36f3))

## [1.1.4](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/compare/v1.1.3...v1.1.4) (2024-09-08)

### Bug Fixes

* Fix bot mode check on entity validation in package.json ([39c75c7](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/39c75c72a9715f6532705677f718614d5323ce36))

## [1.1.3](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/compare/v1.1.2...v1.1.3) (2024-09-08)

### Code Refactoring

* Make bot mode fully functional and compatible with chat/forum/channel ID checks ([90fb6e4](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/90fb6e462b16250b978d0f5ba19b9f2d01f35a03))

## [1.1.2](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/compare/v1.1.1...v1.1.2) (2024-09-07)

### Bug Fixes

* Update workflow name for Docker image build and push ([7a383d0](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/7a383d056eb04ff6068effc326a0bf2ec77b4653))

### Miscellaneous Chores

* Add Docker image building for `ghcr.io` and Docker Hub, adapting Dockerfile for ARM platform build ([7356532](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/735653288dbd57c55f60504daf5b6557d7930d1a))

## [1.1.1](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/compare/v1.1.0...v1.1.1) (2024-09-01)

### Code Refactoring

* Refactor to add alive info logging for Ecoflow MQTT client ([887e02c](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/887e02c75c2e61e7284223f543661727f85b1b82))

## 1.0.29 (2024-08-27)

### Miscellaneous Chores

* Update `npm install` command to omit dev dependencies in Dockerfile ([d89bc09](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/d89bc09791a3486472b02a7187632cffbbd4ed6c))
* Improve SonarJS rules ([16c8d20](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/16c8d20160ac49d1082ce406fdb80eddb4654c13))
* Update dependencies to the latest stable versions ([7336c42](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/7336c422e02521ef656fff6427de14229b79ede0))
* Update package-lock.json ([88afdf6](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/88afdf6192ca2ff803ea3aa2c0c9af8e721c5fb9))

## 1.2.8 (2024-08-27)

### Miscellaneous Chores

* Improve logging module ([f04a866](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/f04a866edd8afdc7254b79ad6e73af8c42651f14))
* Bump eslint from 9.8.0 to 9.9.1 ([3c82f9a](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/3c82f9add946fb6cdfd26566a2b574a4adc6403d))
* Bump eslint-plugin-sonarjs from 1.0.4 to 2.0.1 ([135208a](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/135208a40ca16baaad224748be636936673b7249))
* Bump eslint-plugin-sonarjs from 1.0.4 to 2.0.1 ([2e31d6b](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/2e31d6be869d857de5895c60f0611f389881309e))
* Bump eslint from 9.8.0 to 9.9.1 ([33a3236](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/33a3236fa3d77098a5729cadc00ad05f7ab63822))
* Bump axios from 1.7.3 to 1.7.5 ([04e779f](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/04e779fae3c258da0e2a3201952956546e8443cf))
* Bump mqtt from 5.9.1 to 5.10.0 ([5ecb2aa](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/5ecb2aac6d35b44cb2ed83cf2b95bc38df922f8a))
* Bump @eslint/js from 9.8.0 to 9.9.1 ([0a097f3](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/0a097f3df45b46a07373b06a92bd5157e22f475d))
* Bump axios from 1.7.3 to 1.7.5 ([5c5c7c7](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/5c5c7c79bde13c4362093158ef99fd4960cc8381))
* Bump @eslint/js from 9.8.0 to 9.9.1 ([6cb827b](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/6cb827ba12be295e6a082287b208fc608503f01a))
* Bump mqtt from 5.9.1 to 5.10.0 ([a6116b8](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/a6116b86e2377ca42351358451accc898edc964f))
* post @dependabot PR's update ([0b45083](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/0b45083c669f479b03ea3544fd7793e374ff6ce0))
* Bump @babel/eslint-parser from 7.24.8 to 7.25.1 ([36c9beb](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/36c9bebf57e3d27bf745c177b8a454ea6614eb0f))
* Bump @babel/eslint-parser from 7.24.8 to 7.25.1 ([6da2ac9](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/6da2ac99a111beb461adec2fc48dce66e5da5a66))
* Bump eslint from 9.7.0 to 9.8.0 ([174a985](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/174a9850b7caf6786d1472a8ec218416a3288c9d))
* Bump eslint from 9.7.0 to 9.8.0 ([30a3600](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/30a3600019670d6b0426c7de400b36a1ef251e7a))
* Bump telegram from 2.22.2 to 2.23.10 ([f75fe97](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/f75fe979c908ce0bb3e2b3c4cfb390400692bebb))
* Bump mqtt from 5.8.1 to 5.9.1 ([c214737](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/c2147372e650e0a8ae266d7a1a950cb56796a2e6))
* Bump @eslint/js from 9.7.0 to 9.8.0 ([4f163dc](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/4f163dc27217e9e27b9f91421b11ba84eef3b59a))
* Bump telegram from 2.22.2 to 2.23.10 ([9e75d2e](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/9e75d2eae450f7a935a24b111f30b054555aa536))
* Bump mqtt from 5.8.1 to 5.9.1 ([757ccae](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/757ccae109096b21539b3346aeaeb6c94f86965c))

## 1.2.6 (2024-08-09)

### Documentation

* Update README.md ([0fa95cc](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/0fa95cc38b986f424edbb9b9802e4672163cb6de))

### Miscellaneous Chores

* Bump @eslint/js from 9.7.0 to 9.8.0 ([3f72ed4](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/3f72ed442ce0da770274e3283826dbbe2e12160e))
* Bump eslint-plugin-sonarjs from 1.0.3 to 1.0.4 ([48f889f](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/48f889f30fcc33011d5d0a6f76f8adeaa885ff62))
* Bump eslint-plugin-sonarjs from 1.0.3 to 1.0.4 ([d968d9f](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/d968d9f1d48f544024353def603d84e8dcd0f2a3))

## 1.2.4 (2024-07-21)

### Miscellaneous Chores

* Add option to set time zone for timestamp in chat message ([b74d8d8](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/b74d8d8ae57d822600455d7d89d8615495be8205))

## 1.2.2 (2024-07-20)

### Miscellaneous Chores

* Remove unused `node:http` import and update Telegram message handling ([1bb68b1](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/1bb68b11571a2e4b54eaef8dd502cef75119fdea))
* Bump mqtt from 5.8.0 to 5.8.1 ([cfc2cab](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/cfc2cabc552eac3ca644c82c8804dbd70edda178))
* Bump @babel/core from 7.24.7 to 7.24.9 ([0ed9e54](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/0ed9e54cbe2908e3d629afcf2d581203c161d48c))
* Bump mqtt from 5.8.0 to 5.8.1 ([a8b2b25](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/a8b2b25c95b00efa97d6245d830edc971d303790))
* Bump eslint from 9.6.0 to 9.7.0 ([905753e](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/905753e0867eff8c3fada07bb18f78cc79b23d2f))
* Bump @babel/core from 7.24.7 to 7.24.9 ([281c81a](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/281c81a1444e4c2387f716c5f4cdc75be785d6fc))
* Bump eslint from 9.6.0 to 9.7.0 ([4b99eeb](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/4b99eeb747108ca0c4d80bb959a26c7e8663ed89))
* Bump @eslint/js from 9.6.0 to 9.7.0 ([b802561](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/b802561519309170e2fabfd50c4ccf65f98b5809))
* Bump @eslint/js from 9.6.0 to 9.7.0 ([f67e559](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/f67e5593b10a95d2a3a2857f878e6c01547a8c9f))
* Bump @babel/eslint-parser from 7.24.7 to 7.24.8 ([bb1a8ca](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/bb1a8caaa1922f7ef36b7df312d2ec9cb45e847b))

## 1.2.0 (2024-07-20)

### Features

* Add option to pin and unpin messages in Telegram ([b3bbfb2](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/b3bbfb27f49294601d048d53b3efc559acf825df))
  * The `--pin-message` option allows users to pin the message sent to the chat.
  * The `--unpin-previous` option allows users to unpin the previously pinned message.
  * The `--add-timestamp` option adds a timestamp to the message sent.

### Miscellaneous Chores

* Bump @babel/eslint-parser from 7.24.7 to 7.24.8 ([971a465](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/971a465faa8380bf2a34c596c518aeb3837816ef))
* Set parse mode to HTML for Telegram client ([74f30b3](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/74f30b3af0e8ba7342aad0a176a0ed2e1aa4af81))
* Bump node from 20-alpine to 22-alpine ([f64fe87](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/f64fe879c9fa63a4c863b286d63996d05ff2c264))
* Bump mqtt from 5.7.3 to 5.8.0 ([5c37829](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/5c378294c3f26cfce9c311a4b7738937d2bc0549))
* Bump mqtt from 5.7.3 to 5.8.0 ([db2ce4c](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/db2ce4c527771608a8474b878e425e2673164c51))
* Bump node from 20-alpine to 22-alpine ([d5bcb66](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/d5bcb661024d834631fe383b995576330145c8a4))
* Create dependabot.yml ([6dd83f9](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/6dd83f945ca69341e1603e810a0e9e14ff02c7d6))

## 1.0.12 (2024-07-05)

### Features

* Add logging of electricity connection state changes ([a325253](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/a3252532e1ca4c169573b8907e54d0ecb852e85b))

### Miscellaneous Chores

* Update Dockerfile and package.json versions and fix the sending message to the topic ([f0a702e](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/f0a702e9bf62165ca19cb22ead0eca39e15651aa))

## 1.0.10 (2024-07-05)

### Miscellaneous Chores

* Mostly final version. ([95d04ab](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/95d04abc42a046e5596bf832c2aa4baa03f0d31b))
  * Everything can be configured via direct input, or via environment variables.
  * After initial configuration, everything will be stored in the `data/storage` folder.
  * Session data for `gramjs` is stored in `data/session/[user|bot]` folders.
  * To check the power availability, AC input `voltage`, `current`, and `frequency` are used. If all are zero, there is no AC input.

## 1.0.2 (2024-07-04)

### Miscellaneous Chores

* Draft version of the connection to the EcoFlow Cloud, including subscription on the appropriate Device topic ([862783c](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/862783cca6d443d41072d5581c9a2d4d615031be))
* Remove unnecessary entries from .gitignore ([4f483dd](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/4f483dde621bafa50caf8bb75171f6bf1519741d))

## 1.0.0 (2024-07-04)

### Miscellaneous Chores

* Add initial project configuration files and dependencies ([74f8527](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/74f8527d39289de65601c6f1c25ab5e8319f2151))
* Initial commit ([15d5305](https://github.com/PetroVoronov/ecoflow-mqtt-to-telegram-alerter/commit/15d5305f71dd2b81c3a006249d69fb2d16db6307))
