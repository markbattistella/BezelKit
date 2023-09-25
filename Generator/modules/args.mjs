/*
 * Module: args
 * Description: This module provides a utility to parse command line arguments.
 *
 * Author: Mark Battistella
 * Licence: MIT
 */

/**
 * Parses command line arguments into an object.
 * 
 * @function
 * @param {string[]} argv - Array of command line arguments.
 * @returns {Object} - An object with argument names as keys and their corresponding values.
 * 
 * @example
 * // Assuming the script is run with: node index.js --name=John --age=30
 * cargs(process.argv); 
 * // Returns: { name: 'John', age: 30 }
 */
export const cargs = (argv) => {
    const args = {};
    for (const arg of argv.slice(2)) {
        let [argName, argValue] = arg.split('=');
        argName = argName.replace(/^-+/, '');
        argValue = argValue ? (isNaN(argValue) ? argValue : parseFloat(argValue)) : true;
        args[argName] = argValue;
    }
    return args;
};
