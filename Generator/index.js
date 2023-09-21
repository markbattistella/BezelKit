/*
 * Fetch Bezel Data Script
 * -----------------------
 * This script extracts bezel data from simulators and merges it into a device database.
 *
 * Author: Mark Battistella
 * Version: 1.1.0
 * Licence: MIT
 * Contact: @markbattistella
 * Website: https://markbattistella.com
 * Copyright (c) 2023 Mark Battistella
 *
 * Description:
 * This script automates the process of extracting bezel data from iOS simulators
 * and merging it into a device database. It requires Node.js and Xcode to be installed.
 *
 * Usage:
 * 1. Install dependencies: npm install
 * 2. Run the script: node index.js
 *
 * Dependencies:
 * - fs (Node.js built-in module)
 * - path (Node.js built-in module)
 * - readline (Node.js built-in module)
 */

// MARK: - modules

// Import the 'fs' module, which provides an interface for file system operations.
const fs = require('fs');

// Import the 'fs.promises' module, an extension of 'fs' that offers promise-based 
// file system methods.
const fsp = require('fs').promises;

// Import the 'readline' module for creating interactive command-line interfaces by 
// reading input streams.
const readline = require('readline');

// Import the 'execSync' function from the 'child_process' module to execute shell 
// commands synchronously.
const { execSync } = require('child_process');

const ARGS = require("./args.js");
const VARIABLES = require("./config.js")(ARGS);

// import our custom logger module
require("./logger.js")(VARIABLES.debug);

//import help handler
const getHelpDialogue = require("./help.js");

//import file utilities
const { moveData, getUniqueLinesFromFile, sortFile } = require("./files.js");

/**
 * Executes a shell command and returns its output.
 *
 * @param {string} command - The shell command to execute.
 * @returns {string} The output of the executed command.
 * @throws {Error} If there's an issue executing the command.
 */
const executeCommand = (command) => {
	try {
		// Execute the shell command and capture its output as a string
		return execSync(command, { encoding: 'utf8' });
	} catch (error) {
		// Handle errors by displaying an error message and rethrowing the error
		console.error(`[x] ERROR: executing command: ${command}.`);
		console.error(`    ↳ Message: ${error.message}`);
		throw error;
	}
};

/**
 * Executes a shell command and attempts to parse its output as JSON.
 *
 * @param {string} command - The shell command to execute.
 * @returns {Object} Parsed JSON data from the executed command.
 * @throws {Error} If there's an issue executing the command or parsing JSON.
 */
const getSimulatorData = (command) => {
	// Execute the shell command and capture its output as a string
	const output = executeCommand(command);

	try {
		// Attempt to parse the output as JSON and return the parsed data
		return JSON.parse(output);
	} catch (error) {
		// Handle errors by displaying an error message and exiting the process
		console.error(`[x] ERROR: parsing JSON from command: ${command}.`);
		console.error(`    ↳ Message: ${error.message}`);
		process.exit(1);
	}
};

/**
 * Retrieves information about the installed simulators using xcrun simctl.
 *
 * @returns {Object[]} An array of objects representing the installed simulators.
 */
const getInstalledSimulators = () => {
	// Use the getSimulatorData function to execute the command and parse JSON
	return getSimulatorData('xcrun simctl list devices -j').devices;
};

/**
 * Retrieves information about the installed simulators runtimes using xcrun simctl.
 *
 * @returns {Object[]} An array of objects representing the installed simulator runtimes, sorted by version.
 */
const getInstalledRuntimes = () => {
	// Use the getSimulatorData function to execute the command and parse JSON
	const runtimes = getSimulatorData('xcrun simctl list runtimes -j').runtimes;

	// Sort the runtimes array by version in descending order
	runtimes.sort((a, b) => {
		const versionA = parseFloat(a.version);
		const versionB = parseFloat(b.version);
		return versionB - versionA;
	});

	return runtimes;
};

/**
 * Retrieves the value of a specific setting from a string of build settings.
 *
 * @param {string} settings - The build settings as a string.
 * @param {string} key - The key of the setting to retrieve the value for.
 * @returns {string|null} The value of the specified setting, or null if not found.
 */
const getSettingValue = (settings, key) => {
	// Find the line containing the key and extract the value
	const settingLine = settings.split('\n').find(line => line.includes(key));
	return settingLine ? settingLine.split('=')[1].trim() : null;
};

/**
 * Adds a delay to an asynchronous function using a Promise.
 *
 * @param {number} ms - The delay time in milliseconds.
 * @returns {Promise<void>} A Promise that resolves after the specified delay.
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Checks if an object is empty and of the Object constructor.
 *
 * @param {Object} obj - The object to check.
 * @returns {boolean} `true` if the object is empty and of the Object constructor, otherwise `false`.
 */
const isEmptyObject = (obj) => {
	return Object.keys(obj).length === 0 && obj.constructor === Object;
};

/**
 * Initializes the data extraction process.
 */
const init = async () => {
	try {
		// See: #1
		getHelpDialogue(ARGS);

		// See: #2
		const uniqueSimulatorIdentifiers = await getFilteredSimulators(
			VARIABLES.targetSims,
			VARIABLES.completedSims,
			VARIABLES.problematicSims
		);

		// Check to see if the simulator list has anything to parse.
		// Otherwise we gracefully exit.
		if (uniqueSimulatorIdentifiers.length === 0) {
			console.log('[i] There are no new target simulators');
			console.log('    ↳ Check that the list is either (a) not empty,');
			console.log('      or (b) the items do not already exist in the');
			console.log('      completed or problematic lists.');
			process.exit(0);
		}

		// See: #4
		const parsedDatabaseOfModels = await convertCSVtoJson(VARIABLES.deviceCsv);

		// See: #5
		const targetSimulatorObjectData = getSimulatorObjectData(
			uniqueSimulatorIdentifiers,
			parsedDatabaseOfModels
		);

		// See: #6
		const buildSettings = getAppBuildPath(
			VARIABLES.projectPath,
			VARIABLES.schemeName
		);

		// See: #7
		const getSimulatorData = await getDataFromSimulators(
			buildSettings,
			targetSimulatorObjectData
		);

		// See: #8
		const lastRunData = await getLastRunData(
			VARIABLES.mergedOutputFilePath
		);
		
		// We use this to check if there is the last run JSON to update that.
		// Otherwise if there isn't, we assume it is first run, and return the CSV -> JSON.
		let data;
		if (lastRunData && !isEmptyObject(lastRunData)) {
			data = lastRunData;
		} else {
			data = parsedDatabaseOfModels;
		}

		// See: #9
		const result = mergeData(
			data,
			getSimulatorData
		);

		// See: #10
		await saveData(
			VARIABLES.mergedOutputFilePath,
			VARIABLES.bezelKitResources,
			result
		);

		// See: #11
		//await clearFile(VARIABLES.targetSims);

		// See: #12
		await sortFiles([
			VARIABLES.completedSims,
			VARIABLES.problematicSims
		]);

	} catch (error) {
		console.error('[x] ERROR: An error occurred during data extraction process.');
		console.error(`    ↳ Message: ${error.message}`);
		process.exit(1);
	}
};


/**
 * 2. Filters out completed and problematic simulators from the target simulators list.
 *
 * @param {string} targetList - The path to the target simulators list file.
 * @param {string} completedList - The path to the completed simulators list file.
 * @param {string} problematicList - The path to the problematic simulators list file.
 * @returns {Promise<string[]>} A Promise that resolves with an array of unique simulator identifiers that are not completed or problematic.
 */
const getFilteredSimulators = async (targetList, completedList, problematicList) => {
	// Get unique lines from the respective files
	const targetUnique = await getUniqueLinesFromFile(targetList);
	const completedUnique = await getUniqueLinesFromFile(completedList);
	const problematicUnique = await getUniqueLinesFromFile(problematicList);

	// Filter and return unique simulator identifiers not completed or problematic
	return [...targetUnique].filter(
		simulator => (
			!completedUnique.has(simulator) &&
			!problematicUnique.has(simulator)
		)
	);
};

/**
 * 4. Converts CSV data into a structured JSON format.
 *
 * @param {string} csvFilePath - The path to the CSV file.
 * @returns {Promise<Object>} A Promise that resolves with the parsed JSON data.
 */
const convertCSVtoJson = async (csvFilePath) => {
	// Create a read stream for the CSV file
	const fileStream = fs.createReadStream(csvFilePath);
	const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

	// Define device types and initialize output structures
	const deviceTypes = [
		{ type: 'iPod', prefix: 'iPod' },
		{ type: 'iPhone', prefix: 'iPhone' },
		{ type: 'iPad', prefix: 'iPad' },
		{ type: 'Watch', prefix: 'Watch' },
	];
	const output = {};
	const deviceDicts = {};
	deviceTypes.forEach(device => {
		output[device.type] = [];
		deviceDicts[device.type] = {};
	});

	// Function to determine device type based on identifier
	const getDeviceType = identifier => {
		if (!identifier) return null;
		for (const device of deviceTypes) {
			if (identifier.startsWith(device.prefix)) return device.type;
		}
		return null;
	};

	// Parse each line of the CSV and populate the output structure
	for await (const line of rl) {
		const regex = /(?:[^,"]+|"[^"]*")+/g;
		const fields = [];
		let match;
		while ((match = regex.exec(line)) !== null) {
			fields.push(match[0].replace(/"/g, '').trim());
		}

		const [device, identifier] = fields;
		const deviceType = getDeviceType(identifier);

		if (deviceType) {
			if (!deviceDicts[deviceType][device]) {
				const newDevice = {
					device,
					identifiers: [identifier],
					bezel: 0.00
				};

				deviceDicts[deviceType][device] = newDevice;
				output[deviceType].push(newDevice);
			} else {
				deviceDicts[deviceType][device].identifiers.push(identifier);
			}
		}
	}

	return output;
};

/**
 * 5a. Finds the device name in the given database based on its identifier.
 *
 * @param {string} identifier - The device identifier to search for.
 * @param {Object} database - The database containing device information.
 * @returns {string|null} The device name if found, or null if not found.
 */
const findDeviceInDatabase = (identifier, database) => {
	for (const category in database) {
		for (const device of database[category]) {
			if (device.identifiers.includes(identifier)) {
				return device.device;
			}
		}
	}
	return null;
};

/**
 * 5b. Finds the installed simulator with the given device name.
 *
 * @param {string} deviceName - The device name to search for.
 * @returns {Object|null} The installed simulator object if found, or null if not found.
 */
const findInstalledSimulator = (deviceName) => {
	const installedSimulators = getInstalledSimulators();
	for (const runtime in installedSimulators) {
		for (const device of installedSimulators[runtime]) {
			if (device.name === deviceName) {
				return device;
			}
		}
	}
	return null;
};

/**
 * 5c. Finds the supported runtime for the given device name.
 *
 * @param {string} deviceName - The device name to search for.
 * @returns {Object|null} An object with deviceType and runtime identifiers if found, or null if not found.
 */
const findSupportedRuntime = (deviceName) => {
	const installedRuntimes = getInstalledRuntimes();
	for (const runtime of installedRuntimes) {
		for (const deviceType of runtime.supportedDeviceTypes) {
			if (deviceType.name === deviceName) {
				return {
					deviceType: deviceType.identifier,
					runtime: runtime.identifier,
				};
			}
		}
	}
	return null;
};

/**
 * 5d. Finds the state of a simulator based on its UDID.
 *
 * @param {string} udid - The UDID of the simulator to search for.
 * @returns {string|null} The state of the simulator if found, or null if not found.
 */
const findSimulatorState = (udid) => {
	const installedSimulators = getInstalledSimulators();
	for (const runtime in installedSimulators) {
		for (const device of installedSimulators[runtime]) {
			if (device.udid === udid) {
				return device.state;
			}
		}
	}
	return null;
};

/**
 * 5e. Installs a simulator with the provided details.
 *
 * @param {Object} options - The options for simulator installation (name, deviceType, runtime).
 * @returns {string|null} The UDID of the installed simulator if successful, or null if there's an error.
 */
const installSimulator = ({ name, deviceType, runtime }) => {
	try {
		const command = `xcrun simctl create "${name}" "${deviceType}" "${runtime}"`;
		const result = execSync(command).toString();
		return result.trim();
	} catch (error) {
		console.error('[x] ERROR: installing simulator');
		console.error(`    ↳ Message: ${error.message}`);
		return null;
	}
};

/**
 * 5f. Processes a simulator identifier and performs necessary actions based on its state.
 *
 * @param {string} identifier - The simulator identifier to process.
 * @param {Object} database - The database containing device information.
 * @returns {Object|null} An object with simulator details if successfully processed, or null if there's an issue.
 */
const processIdentifier = (identifier, database) => {
	// Find the device name in the database using the identifier
	const deviceName = findDeviceInDatabase(identifier, database);

	if (!deviceName) {
		// Move the identifier to problematic-list file and return
		moveData(
			identifier,
			VARIABLES.targetSims,
			VARIABLES.problematicSims
		);
		return null;
	}

	// Check if the device is already installed
	const installedDevice = findInstalledSimulator(deviceName);
	if (installedDevice) {

		// Move the identifier to completed-list file
		moveData(
			identifier,
			VARIABLES.targetSims,
			VARIABLES.completedSims
		);
	
		return {
			udid: installedDevice.udid,
			deviceName: installedDevice.name,
			identifier: identifier,
			state: installedDevice.state
		};
	}

	// Find a supported runtime for the device
	const supportedRuntime = findSupportedRuntime(deviceName);
	if (!supportedRuntime) {
		console.warn(`[!] WARN: no supported runtime found for device: ${deviceName}`);
		console.warn('    ↳ Moving the identifier to problematic-list file');
		moveData(
			identifier,
			VARIABLES.targetSims,
			VARIABLES.problematicSims
		);
		return null;
	}

	// Install the simulator
	const udid = installSimulator({ ...supportedRuntime, name: deviceName });
	if (!udid) {
		console.warn(`[!] WARN: failed to install simulator for device: ${deviceName}`);
		console.warn('    ↳ Moving the identifier to problematic-list file');
		moveData(
			identifier,
			VARIABLES.targetSims,
			VARIABLES.problematicSims
		);
		return null;
	}

	// Find the state of the installed simulator
	const state = findSimulatorState(udid);

	// Move the identifier to completed-list file
	console.warn(`[i] INFO: moving identifier to completed-list file"`);
	console.warn('    ↳ Identifier: ${identifier}');
	console.warn('    ↳ Destination: ${VARIABLES.completedSims}');
	moveData(
		identifier,
		VARIABLES.targetSims,
		VARIABLES.completedSims
	);

	return { udid, deviceName, identifier, state };
};

/**
 * 5g. Processes a list of simulator identifiers and returns simulator data for successful ones.
 *
 * @param {string[]} identifiers - An array of simulator identifiers to process.
 * @param {Object} database - The database containing device information.
 * @returns {Object[]} An array of simulator data objects for successful identifiers.
 */
const getSimulatorObjectData = (identifiers, database) => {
	const results = [];
	const failedIdentifiers = [];

	for (const identifier of identifiers) {
		const result = processIdentifier(identifier, database);
		if (result) {
			results.push(result);
		} else {
			failedIdentifiers.push(identifier);
		}
	}

	if (failedIdentifiers.length) {
		console.warn('[!] WARN: Some identifiers were not found');
		console.warn(`    ↳ Identifiers: ${failedIdentifiers}`);
	}

	return results;
};

/**
 * 6. Builds the project, retrieves build settings, and returns the app build path.
 *
 * @param {string} projectPath - The path to the Xcode project file.
 * @param {string} projectScheme - The name of the Xcode project scheme.
 * @returns {string} The path to the built app.
 */
const getAppBuildPath = (projectPath, projectScheme) => {

	// Build the project and hide any lines with a warning
	executeCommand(`xcodebuild -project "${projectPath}" -scheme "${projectScheme}" -destination 'generic/platform=iOS Simulator' clean build 2>&1 | grep -v warning`);

	// Get the build settings
	const buildSettings = executeCommand(`xcodebuild -project "${projectPath}" -sdk iphonesimulator -configuration Debug -showBuildSettings`);

	// Build the derived data path
	const builtProductsDirectory = getSettingValue(buildSettings, "BUILT_PRODUCTS_DIR");
	const fullProductName = getSettingValue(buildSettings, "FULL_PRODUCT_NAME");

	return `${builtProductsDirectory}/${fullProductName}`;
};

/**
 * 7. Executes a series of steps on a list of simulators to extract data from the app.
 *
 * @param {string} appBuildPath - The path to the built app.
 * @param {Object[]} simulators - An array of simulator objects to process.
 * @returns {Promise<Object[]>} A Promise that resolves with an array of data from the simulators.
 */
const getDataFromSimulators = async (appBuildPath, simulators) => {
	const allSimulatorData = [];
	const bundleID = VARIABLES.bundleID;

	for (const simulator of simulators) {

		console.log(`[i] Start work on simulator: ${simulator.deviceName}`);
		console.log(`    ↳ Name: ${simulator.deviceName}`);
		console.log(`    ↳ Identifier: ${simulator.identifier}`);
		console.log(`    ↳ UDID: ${simulator.udid}`);
		console.log(`    ↳ State: ${simulator.state}`);

		// Shutdown any open simulators if not already shut down
		if (simulator.state !== 'Shutdown') {
			console.log('  - Simulator is not shut down. Closing...');
			executeCommand(`xcrun simctl shutdown "${simulator.udid}"`);
			console.log('  - Simulator is shut down');
		}

		// Boot the simulator
		console.log('  - Booting the simulator for testing');
		executeCommand(`xcrun simctl boot '${simulator.udid}'`);

		// Install the desired app
		console.log(`  - Installing the app with bundle ID: ${bundleID}`);
		executeCommand(`xcrun simctl install '${simulator.udid}' "${appBuildPath}"`);

		// Launch the app
		console.log(`  - Launching the app with bundle ID: ${bundleID}`);
		executeCommand(`xcrun simctl launch '${simulator.udid}' '${bundleID}'`);

		// Wait for 5 seconds
		await delay(5000);

		// Get app container path and retrieve simulator data
		const appContainerPath = executeCommand(`xcrun simctl get_app_container '${simulator.udid}' '${bundleID}' data`).trim();
		const outputFilePath = `${appContainerPath}/Documents/output.txt`;
		const simulatorOutputContent = fs.readFileSync(outputFilePath, 'utf8');
		const simulatorData = JSON.parse(simulatorOutputContent);

		// Build device data for the simulator
		const deviceData = {
			device: simulator.deviceName,
			identifiers: [simulatorData.identifiers],
			bezel: simulatorData.bezel
		};

		// Append device data to the array
		allSimulatorData.push(deviceData);

		// Wait for 5 seconds
		await delay(5000);

		// Close the app
		console.log(`  - Terminating the app with bundle ID: ${bundleID}`);
		executeCommand(`xcrun simctl terminate '${simulator.udid}' "${bundleID}"`);

		// Delete the app
		console.log(`  - Deleting the app with bundle ID: ${bundleID}`);
		executeCommand(`xcrun simctl uninstall "${simulator.udid}" "${bundleID}"`);

		// Shut the simulator down
		console.log(`  - Shutting down simulator`);
		executeCommand(`xcrun simctl shutdown "${simulator.udid}"`);

		console.log(`[i] Ended work on simulator: ${simulator.deviceName}\n`);
	};

	return allSimulatorData;
};

/**
 * 8. Gets and parses the previously run JSON data.
 * 
 * @param {string} dataFile - The file path to the JSON file
 * @returns {Object} The parsed JSON data.
 */
const getLastRunData = async (dataFile) => {
	const jsonData = await fsp.readFile(dataFile);
	return JSON.parse(jsonData);
};

/**
 * 9. Merges new data into the original device data using matching identifiers.
 *
 * @param {Object} original - The original device data object.
 * @param {Object[]} newData - An array of device data to merge into the original.
 * @returns {Object} The modified original device data with merged bezel values.
 */
const mergeData = (original, newData) => {
	for (const category in original) {
		if (original.hasOwnProperty(category)) {
			original[category] = original[category].map(device => {
				// Find a matching new device based on identifiers
				const matchingNewDevice = newData.find(newDevice =>
					device.identifiers.some(id => newDevice.identifiers.includes(id))
				);
				if (matchingNewDevice) {
					device.bezel = matchingNewDevice.bezel;
				}
				return device;
			});
		}
	}
	return original;
};

/**
 * 10. Asynchronously saves data into a JSON files: one uncompressed, the other compressed.
 *
 * @param {string} uncompressedFilePath - The base file path for the uncompressed JSON file.
 * @param {string} compressedFilePath - The base file path for the compressed JSON file.
 * @param {object} data - The data object to be saved in the files.
 *
 * @throws {Error} If there's an error writing to the files.
 *
 * @returns {Promise<void>} A promise that resolves when the files have been written.
 */
const saveData = async (uncompressedFilePath, compressedFilePath, data) => {
	await fsp.writeFile(
		uncompressedFilePath,
		JSON.stringify(data, null, 2)
	);
	await fsp.writeFile(
		compressedFilePath,
		JSON.stringify(data, null, null)
	);
};

/**
 * 11. Asynchronously clears the content of a file.
 *
 * @param {string} filePath - The path to the file that needs to be cleared.
 *
 * @throws {Error} If there's an error writing to the file.
 *
 * @returns {Promise<void>} A promise that resolves when the file has been cleared.
 */
const clearFile = async (filePath) => {
	await fsp.writeFile(filePath, '', 'utf-8');
};

/**
 * 12. Asynchronously sorts the lines of multiple text files and writes the sorted content to new files.
 *
 * @param {string[]} filePaths - An array of paths to the text files that will be sorted.
 * @throws Will log an error if sorting of any file fails.
 */
const sortFiles = async (filePaths) => {
	for (const filePath of filePaths) {
		await sortFile(filePath);
	}
};

// MARK: - Initialize the script
init();
