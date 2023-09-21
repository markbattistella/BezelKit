/**
 * 1. Displays a help message and exits the script if the help flag is provided.
 * @param {Object} args - parsed command-line arguments
 */
const getHelpDialogue = (args) => {
	if (args.help || args.h) {
		console.log(
			"---------------------------------------------------\n"    +
			"--               BezelKit Generator              --\n"    +
			"---------------------------------------------------\n"    +
			"\n"                                                       +
			"Usage: node index.js [options]\n\n"                       +
			"Options:\n"                                               +
			"  --deviceCsv\n\tThe CSV file with the Apple model and identifiers\n" +
			"  --targetSims\n\tA text file with the identifiers you wish to get data from\n" +
			"  --completedSims\n\tA text file of past, completed identifiers\n" +
			"  --problematicSims\n\tA text file of error identifiers - either not found or error in creation or use\n" +
			"  --projectPath\n\tPath to the Xcode project to fetch bezel sizes\n" +
			"  --schemeName\n\tSceheme for the aboce Xcode project\n" +
			"  --bundleID\n\tThe app bundle ID of the above project for easy install\n" +
			"  --mergedOutputFilePath\n\tFile location to output local JSON file with data\n" +
			"  --bezelKitResources\n\tThe JSON file used in the Package\n" +
			"  --debug\n\tLog files to output or supress them\n" +
			"  --help\n\tDisplay this screen\n\n" +
			"Chances are you won't need to override any of these, but they're built in for growth or custom setups. Mainly would be good if you need use your own CSV file or custom list of device identifiers. Most beneficial section is the projectPath, schemeName, and bundleID where you can use that logic for your own app.\n\n"
		);
		process.exit(0);
	}
};

module.exports = getHelpDialogue;