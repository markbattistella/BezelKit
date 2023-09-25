/*
 * Module: defaults
 * Description: This module provides default configurations, command-line argument parsing, 
 * and a help generator for the CLI tool.
 *
 * Author: Mark Battistella
 * Licence: MIT
 */

import { cargs } from './args.mjs';

// Default configuration constants
const DEFAULTS = {
  databaseJson: './apple-device-database.json',
  xCodeData: {
    project: './FetchBezel/FetchBezel.xcodeproj',
    scheme: 'FetchBezel',
    bundleId: 'com.mb.FetchBezel'
  },
  output: '../Sources/BezelKit/Resources/bezel.min.json',
  debug: true
};

/**
 * Returns the value if defined or defaults to the provided default value.
 * 
 * @function
 * @param {*} value - The value to check.
 * @param {*} defaultValue - The default value to return if the value is undefined or true.
 * @returns {*} - The value or the default value.
 */
const assignOrDefault = (value, defaultValue) => (
  value === undefined || value === true ? defaultValue : value
);

const ARGS = cargs(process.argv);

/**
 * Gathers and returns configuration variables either from the provided command-line 
 * arguments or default values.
 * 
 * @function
 * @returns {Object} - Configuration object.
 */
export const getVariables = () => {
  return {
    databaseJson: assignOrDefault(
      ARGS.database || ARGS.db, DEFAULTS.databaseJson),
    xCodeData: {
      project: assignOrDefault(
        ARGS.project || ARGS.p, DEFAULTS.xCodeData.project),
      scheme: assignOrDefault(
        ARGS.scheme || ARGS.s, DEFAULTS.xCodeData.scheme),
      bundleId: assignOrDefault(
        ARGS.bundle || ARGS.b, DEFAULTS.xCodeData.bundleId)
    },
    output: assignOrDefault(
      ARGS.output || ARGS.o, DEFAULTS.output),
    debug: assignOrDefault(
      ARGS.debug || ARGS.d, DEFAULTS.debug) === 'false' ? false : true
  };
};

/**
 * Generates and displays the help message for the CLI tool.
 * 
 * @private
 */
const generateHelp = () => {
  console.log(`
---------------------------------------------------
--    CLI for generating simulator bezel data    --
---------------------------------------------------

Usage: [command] [options]

Options:
  --database, -db       Path to the Apple device database JSON file.
                        Default: './apple-device-database.json'

  --project, -p         Path to the FetchBezel XCode project.
                        Default: './FetchBezel/FetchBezel.xcodeproj'

  --scheme, -s          Scheme name for the FetchBezel project.
                        Default: 'FetchBezel'

  --bundle, -b          Bundle ID for the FetchBezel app.
                        Default: 'com.mb.FetchBezel'

  --output, -o          Path to the output JSON file.
                        Default: '../Sources/BezelKit/Resources/bezel.min.json'

  --debug, -d           Enable debugging mode. Pass 'false' to disable.
                        Default: 'true'

  --help, -h            Display this help message and exit.

Example:
  node index.js --database="./path/to/db.json" --debug="false"
`);
};

/**
 * Displays the CLI tool's help message if the `help` or `h` command-line argument is provided.
 * 
 * @function
 */
export const displayHelp = () => {
  if (ARGS.help || ARGS.h) {
    generateHelp();
    process.exit(0);
  }
};
