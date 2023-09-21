const DEFAULTS = {

	/**
	 * The CSV file which contains all the device models and internal identifiers.
	 * @type {string}
	 */
	deviceCsv: './Simulators/apple-device-database.csv',

	/**
	 * The file containing the list of target simulators from which to gather bezel data.
	 * @type {string}
	 */
	targetSims: './Simulators/target-simulators.txt',

	/**
	 * The file containing the list of simulators from which bezel data has already been extracted.
	 * This is used for filtering to prevent overloading the script's runtime.
	 * @type {string}
	 */
	completedSims: './Simulators/completed-simulators.txt',

	/**
	 * The file containing the list of simulator identifiers that have no runtime installed,
	 * but have not been run previously. Used to identify new devices without runtimes.
	 * @type {string}
	 */
	problematicSims: './Simulators/problematic-simulators.txt',

	/**
	 * The path to the Xcode project used to extract bezel data.
	 * @type {string}
	 */
	projectPath: './FetchBezel/FetchBezel.xcodeproj',

	/**
	 * The name of the Xcode scheme to use for extracting bezel data.
	 * @type {string}
	 */
	schemeName: 'FetchBezel',

	/**
	 * The bundle identifier of the Xcode project where bezel data can be extracted.
	 * @type {string}
	 */
	bundleID: 'com.mb.FetchBezel',

	/**
	 * The location to save the output merged JSON data for next run.
	 * @type {string}
	 */
	mergedOutputFilePath: './cache.json',

	/**
	 * The location to save the output merged JSON data for use in the Package.
	 * @type {string}
	 */
	bezelKitResources: '../Sources/BezelKit/Resources/bezel.min.json',

	/**
	 * Whether to generate a log file for reporting or not.
	 * @type {boolean}
	 */
	debug: true
};

/**
 * Assigns a value or a default value based on the condition.
 *
 * @param {*} value - The value to assign or evaluate.
 * @param {*} defaultValue - The default value to use if the condition is met.
 * @returns {*} The assigned value or the default value.
 */
const assignOrDefault = (value, defaultValue) => (
	value === undefined || value === true ? defaultValue : value
);

/**
 * Generates a configuration object containing variable values.
 * Uses command line arguments or defaults if arguments are not provided.
 *
 * @param {Object} args - Parsed command line arguments.
 * @returns {Object} A configuration object with variable values.
 */
module.exports = (args) => {
  const outputConfig = {};
  Object.keys(DEFAULTS).forEach(key => {
    outputConfig[key] = assignOrDefault(args[key], DEFAULTS[key]);
  });
  return outputConfig;
};