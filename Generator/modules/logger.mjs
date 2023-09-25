/*
 * Module: logger
 * Description: Provides custom logging functionalities, logging messages to both console and a log file. Additionally, it handles archiving and purging of old logs.
 *
 * Author: Mark Battistella
 * Licence: MIT
 */

// Importing required modules for filesystem and path manipulation.
import fs from 'fs';
import path from 'path';

/**
 * Initializes and configures custom logging.
 *
 * @param {boolean} debug - Flag to indicate whether to enable logging.
 */
export const setup = (debug) => {

  // Early exit if logging is disabled.
  if (!debug) return;

  // Define constants for log directory and log file path.
  const LOG_DIR = 'logs';
  const LOG_FILE = path.join(LOG_DIR, '_console.log');

  /**
   * Deletes the oldest logs, keeping only the 14 newest logs.
   */
  const deleteOldestLogs = () => {
    const logs = fs.readdirSync(LOG_DIR);  // Read the log directory
    const sortedLogs = logs.sort((a, b) => {
      const aStat = fs.statSync(path.join(LOG_DIR, a));
      const bStat = fs.statSync(path.join(LOG_DIR, b));
      return bStat.mtime - aStat.mtime; // Sort logs by modification time in descending order.
    });

    // Remove logs if there are more than 14, keeping the newest.
    while (sortedLogs.length > 13) {
      const oldestLog = sortedLogs.pop();
      fs.unlinkSync(path.join(LOG_DIR, oldestLog));
    }
  };

  // Create the log directory if it doesn't exist.
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }

  // Archive and move the existing log file if it exists, and then delete the oldest logs.
  if (fs.existsSync(LOG_FILE)) {
    const date = new Date().toISOString().replace(/[:.]/g, '-');
    const archiveLogName = `console_${date}.log`;
    const destination = path.join(LOG_DIR, archiveLogName);
    fs.renameSync(LOG_FILE, destination);
    deleteOldestLogs();
  }

  /**
   * Creates a custom logger function for console methods.
   *
   * @param {string} method - The console method to override ('log', 'error', 'warn', 'info').
   * @returns {Function} - A custom logger function.
   */
  const createCustomLogger = (method) => {
    return (...args) => {
      console['_' + method](...args);  // Call the backup original method.
      const entry = `[${getHumanReadableTimestamp()}] ` + args.join(' ') + '\n';
      fs.appendFile(LOG_FILE, entry, err => {  // Append the log to the file.
        if (err) {
          console['_' + method]('Failed to write to log:', err);
        }
      });
    };
  };

  /**
   * Generates a human-readable timestamp for logging.
   *
   * @returns {string} A timestamp in a human-readable format.
   */
  const getHumanReadableTimestamp = () => {
    const date = new Date();
    const options = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    };
    return date.toLocaleString(undefined, options);
  };

  // Backup existing console methods for safe overriding.
  console._log = console.log;
  console._error = console.error;
  console._warn = console.warn;
  console._info = console.info;

  // Create custom logger functions for each console method.
  const customLogger = createCustomLogger('log');
  const customErrorLogger = createCustomLogger('error');
  const customWarnLogger = createCustomLogger('warn');
  const customInfoLogger = createCustomLogger('info');

  // Override the existing console methods with custom loggers.
  console.log = customLogger;
  console.error = customErrorLogger;
  console.warn = customWarnLogger;
  console.info = customInfoLogger;
};

/**
 * A generic logging function.
 *
 * @param {string} level - The logging level ('error', 'warn', 'info', etc.).
 * @param {string} colour - The color for the log level.
 * @param {string} [title=''] - The title to display before the message.
 * @param {string} message - The message to log.
 * @param {Error} [error] - Optional Error object.
 * @param {number} [indent=0] - The number of spaces for indentation.
 */
const genericLog = (level, colour, title = '', message, error, indent) => {
  const indentation = " ".repeat(indent);
  const logMessage = `${indentation}${colour}${title}${colours.reset}${message}`;
  console[level](logMessage);
  if (error && error.message) {
    const errorMessage = `${indentation}${colours.fg.gray}    ↳ Message: ${colours.reset}${error.message}`;
    console[level](errorMessage);
  }
};

/**
 * Log an error message.
 *
 * @param {string} message - The error message.
 * @param {Error} [error] - Optional Error object.
 * @param {number} [indent=0] - The number of spaces for indentation.
 */
export const error = (message, error = null, indent = 0) => {
  genericLog('error', colours.fg.red, '[x] ERROR: ', message, error, indent);
};

/**
 * Log a warning message.
 *
 * @param {string} message - The warning message.
 * @param {Error} [error] - Optional Error object.
 * @param {number} [indent=0] - The number of spaces for indentation.
 */
export const warn = (message, error = null, indent = 0) => {
  genericLog('warn', colours.fg.yellow, '[!] WARN: ', message, error, indent);
};

/**
 * Log an informational message.
 *
 * @param {string} message - The information message.
 * @param {Error} [error] - Optional Error object.
 * @param {number} [indent=0] - The number of spaces for indentation.
 */
export const info = (message, error = null, indent = 0) => {
  genericLog('info', colours.fg.blue, '[i] INFO: ', message, error, indent);
};

/**
 * Log a success message.
 *
 * @param {string} message - The success message.
 * @param {number} [indent=0] - The number of spaces for indentation.
 */
export const success = (message, indent = 0) => {
  genericLog('info', colours.fg.green, '[√] OKAY: ', message, null, indent);
};

/**
 * General-purpose log function.
 *
 * @param {string} message - The message to log.
 * @param {number} [indent=0] - The number of spaces for indentation.
 */
export const log = (message, indent = 0) => {
  genericLog('info', colours.fg.gray, '', message, null, indent);
};

/**
 * Colours object providing ANSI color codes for terminal text formatting.
 * Useful for distinguishing different logging levels or highlighting specific messages.
 */
export const colours = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",

  fg: {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    gray: "\x1b[90m",
    crimson: "\x1b[38m"
  },
  bg: {
    black: "\x1b[40m",
    red: "\x1b[41m",
    green: "\x1b[42m",
    yellow: "\x1b[43m",
    blue: "\x1b[44m",
    magenta: "\x1b[45m",
    cyan: "\x1b[46m",
    white: "\x1b[47m",
    gray: "\x1b[100m",
    crimson: "\x1b[48m"
  }
};