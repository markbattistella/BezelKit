// import needed functions from the filesystem module
const { existsSync, mkdirSync, renameSync, appendFile } = require("fs");

// Import the 'path' module to work with file and directory paths in a
// platform-independent manner.
const path = require("path");

// temporary handle for the VARIABLE const while refactoring
const VARIABLES = { debug: true };

/**
 * Custom Logger Module
 *
 * This Immediately Invoked Function Expression (IIFE) serves as a custom logger for Node.js applications.
 * It overrides the standard `console.log` function to write log entries to a designated directory.
 * Additionally, it archives old logs and supports a debug mode.
 */
(() => {
  // Directory for storing logs
  const LOG_DIR = "logs";

  // File path for the main log file
  const LOG_FILE = path.join(LOG_DIR, "_console.log");

  // Create the log directory if it doesn't exist
  if (!existsSync(LOG_DIR)) {
    mkdirSync(LOG_DIR, { recursive: true });
  }

  // Archive the existing log file if it exists
  if (existsSync(LOG_FILE)) {
    const date = new Date().toISOString().replace(/[:.]/g, "-");
    const archiveLogName = `console_${date}.log`;
    const destination = path.join(LOG_DIR, archiveLogName);
    renameSync(LOG_FILE, destination);
  }

  /**
   * Custom logger function.
   *
   * @param {...any} args - Arguments to be logged.
   */
  const customLogger = (...args) => {
    // Check if debug mode is enabled before logging
    if (!VARIABLES.debug) return;

    // Call the original console.log
    console._log(...args);

    // Create log entry with a human-readable timestamp
    const entry = `[${getHumanReadableTimestamp()}] ` + args.join(" ") + "\n";
    appendFile(LOG_FILE, entry, (err) => {
      if (err) {
        console._log("Failed to write to log:", err);
      }
    });
  };

  /**
   * Get a human-readable timestamp.
   *
   * @returns {string} Human-readable timestamp.
   */
  const getHumanReadableTimestamp = () => {
    const date = new Date();
    const options = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    };
    return date.toLocaleString(undefined, options);
  };

  // Store the original console.log as console._log
  console._log = console.log;

  // Replace console.log with the custom logger
  console.log = customLogger;
})();

module.exports = {};
