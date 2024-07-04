/** @module logging **/

const logLevelDebug = 0,
  logLevelInfo = 1,
  logLevelWarning = 2,
  logLevelError = 3;

let logLevel = logLevelInfo;

/**
 * Set the log level
 * @param {number} level - The log level
 **/
function setLogLevel(level) {
  logLevel = level;
}

/**
 * Log debug messages
 * @param {string} message - The message to log
 */
function logDebug(message) {
  if (logLevel <= logLevelDebug) {
    console.log(message);
  }
}

/**
 * Log informational messages
 * @param {string} message - The message to log
 */
function logInfo(message) {
  if (logLevel <= logLevelInfo) {
    console.log(message);
  }
}

/**
 * Log warnings
 * @param {string} message - The message to log
 */
function logWarning(message) {
  if (logLevel <= logLevelWarning) {
    console.warn(message);
  }
}

/**
 * Log errors messages
 * @param {string} message - The message to log
 */
function logError(message) {
  if (logLevel <= logLevelError) {
    console.error(message);
  }
}

module.exports = {
  logLevelDebug,
  logLevelInfo,
  logLevelWarning,
  logLevelError,
  setLogLevel,
  logDebug,
  logInfo,
  logWarning,
  logError,
};
