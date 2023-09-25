/*
 * Fetch Bezel Data Script
 * -----------------------
 * This script extracts bezel data from simulators and merges it into a device database.
 *
 * Author: Mark Battistella
 * Version: 2.0.0
 * Licence: MIT
 * Contact: @markbattistella
 * Website: https://markbattistella.com
 * Copyright (c) 2023 Mark Battistella
 *
 * Description:
 * This script automates the process of extracting bezel data from iOS simulators
 * and merging it into a device database. It requires Node.js and Xcode to be installed.
 */

/** 
 * Importing internal modules required for the operation.
 */
import * as logger from './modules/logger.mjs';
import * as util from './modules/utilities.mjs';
import * as defaults from './modules/defaults.mjs';

/**
 * Get the default variables or those provided via command line arguments.
 * @constant
 * @type {Object}
 */
const VARIABLE = defaults.getVariables(process.argv);

/**
 * Set up the logging mechanism based on whether 'debug' mode is active or not.
 */
logger.setup(VARIABLE.debug);

/**
 * Initializes the process of data extraction.
 * 
 * The flow involves:
 * 1. Displaying onscreen help.
 * 2. Reading and processing device data from a JSON database.
 * 3. Identifying simulators based on the data.
 * 4. Generating related data for these simulators.
 * 5. Saving the updated information to a database.
 * 
 * @async
 * @function
 */
const init = async () => {
	try {

		/** Display the onscreen help menu. */
		defaults.displayHelp();

		/**
		 * Extract device data from the provided JSON database.
		 * @constant
		 * @type {Object}
		 */
		const {
			pendingDevices,
			originalDatabase
		} = await util.extractDeviceDataFromFile(VARIABLE.databaseJson);

		/**
		 * Derive simulator-specific information based on the extracted devices.
		 * @constant
		 * @type {Object}
		 */
		const {
			foundDevices,
			unfoundDevices
		} = util.getSimulatorObjectData(pendingDevices);

		/**
		 * Get simulator details, especially the bezel radius data.
		 * @constant
		 * @type {Array}
		 */
		const bezelSimulators = await util.generateData(
			foundDevices,
			VARIABLE.xCodeData.project,
			VARIABLE.xCodeData.scheme,
			VARIABLE.xCodeData.bundleId
		);

		/**
		 * Save the newly derived information to a database, 
		 * while also making necessary updates and removals.
		 */
		await util.saveNewDatabase(
			originalDatabase,
			bezelSimulators,
			unfoundDevices,
			VARIABLE.databaseJson,
			VARIABLE.output
		);

	} catch (error) {
		/** Log the error and halt the process if any unexpected issues arise. */
		logger.error('An error occurred during the init process', error);
		process.exit(1);
	}
};

/**
 * Start the data extraction process by initializing the script.
 */
await init();
