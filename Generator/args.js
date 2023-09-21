module.exports = ((argv) => {

	/**
	 * Parses command-line arguments into an object.
	 *
	 * @param {string[]} argv - Array of command-line arguments.
	 * @returns {Object} Parsed arguments as key-value pairs.
	 */
	const args = {};

	// Iterate through command-line arguments starting from the third element
	// (excluding 'node' and script filename)
	for (const arg of argv.slice(2)) {
		let [argName, argValue] = arg.split('=');

		// Remove leading dashes from the argument name
		argName = argName.replace(/^-+/, '');

		if (typeof argValue !== "undefined") {
			// Convert argValue to a number if it's a numeric string, otherwise
			// keep it as a string
      argValue = isNaN(argValue) ? argValue : parseFloat(argValue);
      if (argValue === "false") { //edge case where the arg is a boolean flag
        argValue = false;
      }
		} else {
			// If no value provided, consider it as a boolean flag
			argValue = true;
		}

		// Store the argument and its value in the args object
		args[argName] = argValue;
	}

	return args;
})(process.argv);