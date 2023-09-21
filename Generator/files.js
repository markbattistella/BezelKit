// Import necessary functions from the 'fs.promises' module,
// an extension of 'fs' that offers promise-based file system methods.
const { access, appendFile, readFile, writeFile } = require("fs").promises;
const { createInterface } = require("readline");
const { createReadStream } = require("fs");
const F_OK = require("fs").constants;


/**
 * Reads a file and returns a set of unique non-empty lines from it.
 *
 * @param {string} file - The path to the file to read.
 * @returns {Promise<Set<string>>} A Promise that resolves with a Set of unique non-empty lines from the file.
 */
const getUniqueLinesFromFile = async (file) => {
	try {
		// Check if the file exists and is accessible
		await access(file, F_OK);

		// Create a read stream for the file
		const fileStream = createReadStream(file, 'utf8');

		// Create a readline interface to read lines from the stream
		const rl = createInterface({ input: fileStream, crlfDelay: Infinity });

		// Set to store unique non-empty lines
		const uniqueLines = new Set();

		// Iterate through each line and add non-empty lines to the set
		for await (const line of rl) {
			if (line.trim() !== '') {
				uniqueLines.add(line);
			}
		}

		return uniqueLines;
	} catch (error) {
		// Handle errors by displaying an error message and exiting the process
		console.error(`[x] ERROR: issue with file: ${file}.`);
		console.error(`    ↳ Message: ${error.message}`);
		process.exit(1);
	}
};

/**
 * Appends a unique data item to a file if it doesn't already exist.
 *
 * @param {string} data - The data item to append.
 * @param {string} filePath - The path to the file.
 */
const append = async (data, filePath) => {
	try {
		// Get unique lines from the file
		const uniqueLines = await getUniqueLinesFromFile(filePath);

		// Append the data item if it's not already present
		if (!uniqueLines.has(data)) {
			await appendFile(filePath, `\n${data}`, 'utf-8');
			uniqueLines.add(data);
		}
	} catch (error) {
		console.error(`[x] ERROR: appending data to file: ${data}`);
		console.error(`    ↳ Message: ${error.message}`);
	}
};

/**
 * Removes a data item from a file if it exists.
 *
 * @param {string} data - The data item to remove.
 * @param {string} filePath - The path to the file.
 */
const remove = async (data, filePath) => {
	try {
		// Get unique lines from the file
		const uniqueLines = await getUniqueLinesFromFile(filePath);

		// Remove the data item if it exists
		if (uniqueLines.has(data)) {
			uniqueLines.delete(data);
			const updatedContent = [...uniqueLines].join('\n');
			await writeFile(filePath, updatedContent, 'utf-8');
		}
	} catch (error) {
		console.error(`[x] ERROR: removing data from file: ${data}`);
		console.error(`    ↳ Message: ${error.message}`);
	}
};

/**
 * Moves a data item from one file to another.
 *
 * @param {string} data - The data item to move.
 * @param {string} fromFile - The source file path.
 * @param {string} toFile - The destination file path.
 */
const moveData = async (data, fromFile, toFile) => {
	// Append the data to the destination file and remove from the source file
	await append(data, toFile);
	await remove(data, fromFile);
};

/**
 * Asynchronously sorts the lines of a text file and writes the sorted content to a new file named 'sorted.txt'.
 * 
 * @param {string} filePath - The path to the text file that will be sorted.
 * @throws Will throw an error if reading from the file or writing to the file fails.
 */
const sortFile = async (filePath) => {
	try {
		// Read the file into a string
		const data = await readFile(filePath, 'utf8');

		// Split the string into lines
		const lines = data.split('\n');

		// Sort the lines
		const sortedLines = lines.sort();

		// Join the sorted lines back into a string
		const sortedData = sortedLines.join('\n');

		// Write the sorted string back to a file
		await writeFile(filePath, sortedData, 'utf8');

		console.log('[i] INFO: File sorted successfully.');
		console.log(`    ↳ ${filePath}`);
	} catch (err) {
		console.error('[x] Error: File sorting failed.');
		console.error(`    ↳ ${filePath}`);
	}
};

module.exports = {
  getUniqueLinesFromFile,
  moveData,
  sortFile
}