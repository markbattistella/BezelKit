/*
 * Module: util
 * Description: Provides a collection of utility functions designed to perform various 
 * operations to extract bezel radius data from an Xcode project.
 *
 * Author: Mark Battistella
 * Licence: MIT
 */

import { promises as fsp } from 'fs';
import { execSync } from 'child_process';
import * as logger from './logger.mjs';

/**
 * Parses a JSON file and returns its contents as an object.
 * 
 * @async
 * @param {string} file - Path to the JSON file.
 * @returns {Object} - Parsed contents of the JSON file.
 * @throws {Error} If reading the file or parsing JSON fails.
 */
const parseJsonFile = async (file) => {
	const data = await fsp.readFile(file, 'utf8');
	return JSON.parse(data);
};

/**
 * Executes a shell command and returns its standard output.
 * 
 * @param {string} command - The command to execute.
 * @returns {string} - The standard output of the executed command.
 */
const executeCommand = command => {
	return execSync(command, { encoding: 'utf8' });
};

/**
 * Extracts a value from a settings string based on a key.
 * The settings are expected to be newline-separated key-value pairs.
 * 
 * @param {string} settings - The settings string, newline-separated.
 * @param {string} key - The key for which the value needs to be extracted.
 * @returns {string|null} - The extracted value or null if the key is not found.
 */
const getSettingValue = (settings, key) => {
	const settingLine = settings.split('\n').find(line => line.includes(key));
	return settingLine ? settingLine.split('=')[1].trim() : null;
};

/**
 * Introduces a delay in the execution.
 * 
 * @param {number} ms - The delay duration in milliseconds.
 * @returns {Promise<void>} - Resolves after the specified delay.
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));


/**
 * Extracts relevant device data from a specified file.
 * 
 * @async
 * @param {string} file - Path to the JSON file containing device data.
 * @returns {Object} - An object containing the pending devices to process and the original database.
 * @throws {Error} If there's an error in parsing the file or processing the data.
 */
export const extractDeviceDataFromFile = async (file) => {
    // Parse the provided JSON file to get the original database.
    const originalDatabase = await parseJsonFile(file);

    // Combine pending and problematic devices from the original database.
    const combinedPendingDevices = { ...originalDatabase.pending, ...originalDatabase.problematic };

    // Filter out iPod, iPad, and iPhone devices from the database.
    const databaseDevices = Object.entries(originalDatabase.devices)
        .filter(([deviceType]) => ['iPod', 'iPad', 'iPhone'].includes(deviceType))
        .reduce((acc, [, deviceList]) => ({ ...acc, ...deviceList }), {});

    // Identify devices in the combined pending list that are not in the main database.
    const pendingDevices = filterUnlistedDevices(combinedPendingDevices, databaseDevices);

    // If there are no new pending devices, log a success message and exit.
    if (Object.keys(pendingDevices).length === 0) {
        logger.success('There are no new simulators to process 🎉');
        process.exit(0);
    }

    return { pendingDevices, originalDatabase };
};

/**
 * Filters out devices that are not listed in a main device database.
 * 
 * @param {Object} pendingDevices - An object of devices that are pending processing.
 * @param {Object} allDevices - An object containing the main list of devices.
 * @returns {Object} - An object containing only the devices from the pending list that are not in the main device list.
 */
const filterUnlistedDevices = (pendingDevices, allDevices) => {
    // Retrieve the keys (device identifiers) from the main device database.
    const deviceKeys = Object.keys(allDevices);
    
    // Filter out devices from the pending list that aren't present in the main device list.
    return Object.keys(pendingDevices).reduce((acc, deviceKey) => {
        // If a device from the pending list isn't in the main list, add it to the accumulator.
        if (!deviceKeys.includes(deviceKey)) {
            acc[deviceKey] = pendingDevices[deviceKey];
        }
        return acc;
    }, {});
};


/**
 * Transforms device objects into an array of device identifiers and names.
 * 
 * @param {Object} deviceObjects - The device objects to transform.
 * @returns {Array} An array of objects containing device identifiers and names.
 */
const transform = deviceObjects => 
    Object.keys(deviceObjects).map(identifier => (
        { identifier, name: deviceObjects[identifier].name })
    );

/**
 * Retrieves a list of available simulators.
 * 
 * @returns {Object} An object containing available devices parsed from the command's JSON output.
 */
const getAvailableSimulators = () => {
    const json = executeCommand('xcrun simctl list devices -j');
    return JSON.parse(json).devices;
};

/**
 * Retrieves a list of available runtimes.
 * 
 * @returns {Array} An array of runtime objects sorted by version in descending order.
 */
const getAvailableRuntimes = () => {
    const json = executeCommand('xcrun simctl list runtimes -j');
    return JSON.parse(json).runtimes.sort(
		(a, b) => parseFloat(b.version) - parseFloat(a.version));
};

/**
 * Retrieves data for a specific simulator by name.
 * 
 * @param {string} name - The name of the simulator to search for.
 * @returns {Object|null} The simulator object if found, otherwise null.
 */
const getSimulatorData = name => {
    const simulators = getAvailableSimulators();
    for (const runtime in simulators) {
        const foundDevice = simulators[runtime].find(device => device.name === name);
        if (foundDevice) return foundDevice;
    }
    return null;
};

/**
 * Retrieves the supported runtime for a specific simulator.
 * 
 * @param {string} name - The name of the simulator to search for.
 * @returns {Object|null} An object containing simulator and runtime identifiers, otherwise null.
 */
const getSupportedRuntime = name => {
    const runtimes = getAvailableRuntimes();
    for (const runtime of runtimes) {
        const foundDevice = runtime.supportedDeviceTypes.find(device => device.name === name);
        if (foundDevice) return { simulatorId: foundDevice.identifier, runtimeId: runtime.identifier };
    }
    return null;
};

/**
 * Installs a simulator.
 * 
 * @param {Object} options - An object containing `name`, `simulatorId`, and `runtimeId` 
 * for the simulator to install.
 * @returns {string} The output of the installation command.
 */
const installSimulator = ({ name, simulatorId, runtimeId }) => 
    executeCommand(`xcrun simctl create "${name}" "${simulatorId}" "${runtimeId}"`)
        .toString()
		.trim();

/**
 * Processes a simulator device by either retrieving its existing data or installing 
 * it if not present.
 * 
 * @param {Object} device - The device object containing information like its name.
 * @returns {Object|null} An object containing the processed device data, or null if 
 * the device cannot be processed.
 */
const processSimulator = device => {

	// Check if the simulator for the given device already exists.
	const existingSimulator = getSimulatorData(device.name);

	// If the simulator exists, return its data along with the given device data.
	if (existingSimulator) return {
		...device,
		udid: existingSimulator.udid,
		state: existingSimulator.state
	};

	// If the simulator doesn't exist, check if there's a supported runtime available for it.
	const supportedRuntime = getSupportedRuntime(device.name);

	// If there's no supported runtime, log a warning and return null.
	if (!supportedRuntime) {
		logger.warn(`No supported runtime found for device: ${device.name}`);
		return null;
	}

	// Install the simulator for the given device using the found supported runtime.
	const udid = installSimulator({ name: device.name, ...supportedRuntime });

	// If the simulator couldn't be installed, log a warning and return null.
	if (!udid) {
		logger.warn(`Failed to install simulator for device: ${device.name}`);
		return null;
	}

	// Retrieve the newly installed simulator's data.
	const simulatorData = getSimulatorData(device.name);
	return {
		...device,
		udid: udid,
		state: simulatorData.state
	};
};

/**
 * Processes a set of simulator objects to determine which ones exist and which don't.
 * 
 * @param {Object[]} objects - An array of simulator objects to be processed.
 * @returns {Object} An object containing two arrays: `foundDevices` with existing 
 * simulators and `unfoundDevices` with simulators that couldn't be found or processed.
 */
export const getSimulatorObjectData = objects => {

	// Arrays to store the found and unfound devices.
    const foundDevices = [];
    const unfoundDevices = [];

    // Transform the given objects into a usable format.
    const transformedObjects = transform(objects);

    // Iterate over each transformed object.
    transformedObjects.forEach(object => {
        // Process the simulator object to check if it exists.
        const result = processSimulator(object);

        // Based on the result, classify the device as either found or unfound.
        result ? foundDevices.push(result) : unfoundDevices.push(object);
    });

    // Return the classified devices in two separate arrays.
    return { foundDevices, unfoundDevices };
};


/**
 * Returns the build path for an app using given project parameters.
 * 
 * @param {string} projectPath - The path to the Xcode project.
 * @param {string} projectScheme - The scheme name of the Xcode project.
 * @returns {string} The path to the built app.
 */
const getAppBuildPath = (projectPath, projectScheme) => {

	// Execute a clean build of the Xcode project, suppressing warnings in the output.
    executeCommand(`xcodebuild -project "${projectPath}" -scheme "${projectScheme}" -destination 'generic/platform=iOS Simulator' clean build 2>&1 | grep -v warning`);

    // Retrieve build settings of the Xcode project.
    const buildSettings = executeCommand(`xcodebuild -project "${projectPath}" -sdk iphonesimulator -configuration Debug -showBuildSettings`);

    // Extract the directory where the built products reside from the build settings.
    const builtProductsDirectory = getSettingValue(buildSettings, "BUILT_PRODUCTS_DIR");

    // Extract the name of the built product from the build settings.
    const fullProductName = getSettingValue(buildSettings, "FULL_PRODUCT_NAME");

    // Return the full path to the built app.
    return `${builtProductsDirectory}/${fullProductName}`;
};

/**
 * Shuts down a specified simulator if it's not already in a `Shutdown` state.
 * 
 * @param {Object} simulator - The simulator object with details such as its 
 * `state`, `name`, and `udid`.
 */
const shutdownSimulator = (simulator) => {

	// Check if the simulator is not already in a 'Shutdown' state.
    if (simulator.state !== 'Shutdown') {
        // Log a warning that the simulator isn't shut down.
        logger.warn('Simulator is not shutdown', null, 2);

        // Log an attempt to shut down the simulator.
        logger.log(`↳ Attempting to shutdown: ${simulator.name}`, 6);

        // Execute the command to shut down the simulator using its UDID.
        executeCommand(`xcrun simctl shutdown "${simulator.udid}"`);

        // Log a success message indicating the simulator was shut down.
        logger.success('Simulator successfully shut down', 2);
    }
};

/**
 * Reads data from a simulator based on its UDID and a specified bundle ID.
 * 
 * @async
 * @param {string} udid - The UDID of the simulator.
 * @param {string} bundleId - The bundle ID of the app whose data needs to be read.
 * @returns {Object} The parsed JSON data from the specified file path within the simulator.
 */
const readSimulatorData = async (udid, bundleId) => {

	// Get the app's container path within the simulator using its UDID and bundle ID.
    const appContainerPath = executeCommand(`xcrun simctl get_app_container "${udid}" "${bundleId}" data`).trim();
    
    // Construct the file path to the desired JSON data within the app's container.
    const filePath = `${appContainerPath}/Documents/output.json`;

    // Parse and return the JSON data from the specified file path.
    return await parseJsonFile(filePath);
};


/**
 * Generates data for a list of simulators based on project details and an app bundle ID.
 *
 * @async
 * @param {Object[]} simulators - An array of simulator objects.
 * @param {string} projectPath - The path to the Xcode project.
 * @param {string} projectScheme - The scheme name of the Xcode project.
 * @param {string} appBundleID - The bundle ID of the app for which data is being generated.
 * @returns {Object[]} An array of objects containing data for each simulator.
 */
export const generateData = async (simulators, projectPath, projectScheme, appBundleID) => {
	const allSimulatorData = [];

	// Determine the build path for the app using the project details.
	const appBuildPath = getAppBuildPath(projectPath, projectScheme);
	const totalSimulators = simulators.length;

	for (const [index, simulator] of simulators.entries()) {
		const indexNumber = index + 1

		// Display the current simulator being processed.
		console.log(
			logger.colours.bg.cyan,
			`** Start work on simulator: ${indexNumber} / ${totalSimulators} **`,
			logger.colours.reset,
			'\n'
		);

		// Log details of the current simulator.
		logger.info(`Current device: ${simulator.name}`, null, 2)
		logger.log(`↳ Name: ${simulator.name}`, 6);
		logger.log(`↳ Identifier: ${simulator.identifier}`, 6);
		logger.log(`↳ UDID: ${simulator.udid}`, 6);
		logger.log(`↳ State: ${simulator.state}`, 6);

		// Ensure the simulator is shut down.
		shutdownSimulator(simulator);

		// Boot the simulator.
		logger.info('Booting the simulator for testing', null, 2);
		executeCommand(`xcrun simctl boot '${simulator.udid}'`);

		// Install and launch the app on the simulator.
		logger.info(`Installing local project with bundle ID: ${appBundleID}`, null, 2);
		logger.log('↳ Installing app', 6);
		executeCommand(`xcrun simctl install '${simulator.udid}' "${appBuildPath}"`);

		logger.log('↳ Launching app', 6);
		executeCommand(`xcrun simctl launch '${simulator.udid}' '${appBundleID}'`);

		// Wait for a while to let the app complete its operations.
		logger.log('↳ Waiting 5 seconds', 6);
		await delay(5000);

		// Read data from the simulator.
		logger.log('↳ Reading bezel data from device', 6);
		const data = await readSimulatorData(simulator.udid, appBundleID);

		const deviceData = {
			... simulator,
			bezel: data.bezel
		};
		allSimulatorData.push(deviceData);
		logger.log('↳ Found device data', 6);

		// Wait again for other possible operations.
		logger.log('↳ Waiting 5 seconds', 6);
		await delay(5000);

		// Terminate and uninstall the app from the simulator.
		logger.log('↳ Terminating app', 6);
		executeCommand(`xcrun simctl terminate '${simulator.udid}' "${appBundleID}"`);
		logger.log('↳ Deleting app from simulator', 6);
		executeCommand(`xcrun simctl uninstall "${simulator.udid}" "${appBundleID}"`);

		// Shut down the simulator after processing.
		logger.info('Shutting down the simulator\n', null, 2);
		executeCommand(`xcrun simctl shutdown "${simulator.udid}"`);
	};

	return allSimulatorData;
};


/**
 * Merges new device data with original device data, adding or updating device entries as required.
 *
 * @param {Object} originalData - The original device data.
 * @param {Object[]} newData - Array of new device objects to be merged.
 * @returns {Object} - The merged device data.
 */
const mergeDeviceData = (originalData, newData) => {
	newData.forEach(device => {

		// Determine the device category (e.g., 'iPhone') from the device name.
		const category = device.name.split(" ")[0];
		
		// If the category does not exist in original data, initialize it.
		if (!originalData.devices[category]) {
			originalData.devices[category] = {};
		}

		// If device already exists, update its bezel data, else add the device entry.
		if (originalData.devices[category][device.identifier]) {
			originalData.devices[category][device.identifier].bezel = device.bezel;
		} else {
			originalData.devices[category][device.identifier] = {
				name: device.name,
				bezel: device.bezel
			};
		}
	});
	return originalData;
};

/**
 * Cleans the device database, setting pending to empty and adding unfound devices 
 * to the problematic list.
 *
 * @param {Object} newData - The new device data to be cleaned.
 * @param {Object[]} unfoundDevices - Array of device objects that weren't found.
 * @returns {Object} - The cleaned device data.
 */
const cleanDatabase = (newData, unfoundDevices) => {

	// Reset the pending list to empty.
	newData.pending = {};

	// For each unfound device, if it's not in the problematic list, add it.
	unfoundDevices.forEach(device => {
		if (!newData.problematic[device.identifier]) {
			newData.problematic[device.identifier] = {
				name: device.name ? device.name : ''
			};
		}
	});
	return newData;
};

/**
 * Sorts the keys of a JSON object using a custom sorting function.
 * 
 * The sort order is determined by extracting numeric values from keys and sorting them.
 * If two keys have the same numeric value, they are sorted lexicographically.
 *
 * @param {Object} json - The JSON object to be sorted.
 * @returns {Object} - The sorted JSON object.
 */
const sortJSON = (json) => {

	/**
	 * Custom sorting function for string keys.
	 * 
	 * Extracts numbers from keys and sorts them in ascending order.
	 * If two keys have the same numeric value, sorts them lexicographically.
	 *
	 * @param {string} a - First key to compare.
	 * @param {string} b - Second key to compare.
	 * @returns {number} - Returns -1 if 'a' should be sorted before 'b', 1 if 'a' should be sorted after 'b', and 0 if they are equal.
	 */
	const customSort = (a, b) => {
		const numberA = parseFloat(a.match(/\d+(?:,\d+)?/));
		const numberB = parseFloat(b.match(/\d+(?:,\d+)?/));
		if (numberA < numberB) return -1;
		if (numberA > numberB) return 1;
		return a.localeCompare(b);
	}

	/**
	 * Recursively sorts the keys of an object.
	 * 
	 * Sorts the keys of the input object based on the customSort function.
	 * If a key's value is an object, sorts its keys recursively.
	 *
	 * @param {Object} obj - The object whose keys need to be sorted.
	 * @returns {Object} - The object with sorted keys.
	 */
	const sortKeysRecursively = (obj) => {
		if (typeof obj !== 'object' || obj === null) {
			return obj;
		}
		const sortedObj = {};
		Object.keys(obj).sort(customSort).forEach(key => {
			sortedObj[key] = sortKeysRecursively(obj[key]);
		});
		return sortedObj;
	}

	return sortKeysRecursively(json);
}

/**
 * Processes and saves the new device database.
 * 
 * This function does the following:
 * 1. Merges new device data with the original data.
 * 2. Cleans the merged data by updating the problematic list with unfound devices and resetting the pending list.
 * 3. Sorts the cleaned data.
 * 4. Writes the sorted data to a cache file and writes a minified version to a package file.
 *
 * @async
 * @param {Object} originalData - The original device data.
 * @param {Object[]} newData - Array of new device objects.
 * @param {Object[]} unfoundDevices - Array of device objects that weren't found.
 * @param {string} cacheFilePath - Path where the sorted data should be saved.
 * @param {string} packageFilePath - Path where the minified data should be saved.
 */
export const saveNewDatabase = async (originalData, newData, unfoundDevices, cacheFilePath, packageFilePath) => {

	// Merge new data with the original data.
	const mergedData = mergeDeviceData(originalData, newData);

	// Clean the merged data by updating the problematic list and resetting the pending list.
	const cleanData = cleanDatabase(mergedData, unfoundDevices);

	// Sort the cleaned data.
	const sortedData = sortJSON(cleanData);

	// Prepare a minified version of the sorted data by removing the pending and problematic lists.
	const minifiedData = { ...sortedData };
	delete minifiedData.pending;
	delete minifiedData.problematic;

	// Write the sorted data to the cache file.
	await fsp.writeFile(cacheFilePath, JSON.stringify(sortedData, null, 2), 'utf-8');
	logger.success(`Saved cache file: ${cacheFilePath}`);

	// Write the minified data to the package file.
	await fsp.writeFile(packageFilePath, JSON.stringify(minifiedData, null, null), 'utf-8');
	logger.success(`Saved resource file: ${packageFilePath}`);
};
