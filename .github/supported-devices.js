/*
 * Generate Supported Devices markdown file
 * -----------------------
 * This script reads the bezel.min.json file and generates a markdown file
 *
 * Author: Mark Battistella
 * Version: 2.0.0
 * Licence: MIT
 * Contact: @markbattistella
 * Website: https://markbattistella.com
 * Copyright (c) 2023 Mark Battistella
 */

const fs = require('fs');

/**
 * Converts a JSON data structure to a Markdown formatted string.
 *
 * @param {Object} data - The JSON data representing the devices and their details.
 * @return {string} The Markdown-formatted string.
 */
const jsonToMarkdown = (data) => {
  let markdown = '# Supported Device List\n\n';
  markdown += 'Below is the current supported list of devices `BezelKit` can return data for.\n\n';

  const devices = data.devices;

  for (const category in devices) {
    markdown += `## ${category}\n\n`;

    markdown += '| Device                      | Model Identifier       | Bezel Size |\n';
    markdown += '|-----------------------------|------------------------|------------|\n';

    const categoryDevices = devices[category];
    for (const modelId in categoryDevices) {
      const deviceDetails = categoryDevices[modelId];
      markdown += `| ${deviceDetails.name} | \`${modelId}\` | \`${deviceDetails.bezel}\` |\n`;
    }

    markdown += '\n';
  }

  // Add _metadata information at the bottom
  const meta = data._metadata;
  markdown += '---\n\n'; // Horizontal line for separation
  markdown += `**Author**: [${meta.Author}](${meta.Website})\n`;
  markdown += `**Project**: ${meta.Project}\n`;

  return markdown.trim() + '\n';
};

/**
 * Main function to read JSON data, convert it to Markdown, and write it to a file.
 */
const main = () => {
  // Read JSON data from file
  const jsonStr = fs.readFileSync('./Sources/BezelKit/Resources/bezel.min.json', 'utf-8');

  // Parse the JSON string to an object
  const jsonData = JSON.parse(jsonStr);

  // Convert JSON data to Markdown format
  const markdownData = jsonToMarkdown(jsonData);

  // Write the generated Markdown to a file
  fs.writeFileSync('./SupportedDeviceList.md', markdownData);
};

// Execute the main function
main();
