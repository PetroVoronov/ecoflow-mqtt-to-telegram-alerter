# Changelog

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
