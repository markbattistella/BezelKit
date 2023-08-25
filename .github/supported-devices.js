/*
 * Generate Supported Devices markdown file
 * -----------------------
 * This script reads the bezel-data-min.json file and generates a markdown file
 *
 * Author: Mark Battistella
 * Version: 1.0.0
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
  // Initialize Markdown header
  let markdown = '# Supported Device List\n\n';
  markdown += 'Below is the current supported list of devices `BezelKit` can return data for.\n\n';

  // Loop through each category (like 'iPod Touch', 'iPhone', etc.)
  for (const category in data) {
    // Add Markdown sub-header for each category
    markdown += `## ${category}\n\n`;

    // Define the Markdown table header
    markdown += '| Device                      | Model Identifier | Bezel Size |\n';
    markdown += '|-----------------------------|------------------|------------|\n';
    
    // Populate the table with device data
    for (const item of data[category]) {
      // Map each identifier with backticks and join them with a comma and space
      const identifiers = item.identifiers.map(id => `\`${id}\``).join(', ');
      markdown += `| ${item.device} | ${identifiers} | \`${item.bezel}\` |\n`;
    }

    // Add a newline to separate categories
    markdown += '\n';
  }

  // Remove trailing whitespace and add a single newline at the end
  return markdown.trim() + '\n';
};

/**
 * Main function to read JSON data, convert it to Markdown, and write it to a file.
 */
const main = () => {
  // Read JSON data from file
  const jsonStr = fs.readFileSync('./Sources/BezelKit/Resources/bezel-data-min.json', 'utf-8');
  
  // Parse the JSON string to an object
  const jsonData = JSON.parse(jsonStr);

  // Convert JSON data to Markdown format
  const markdownData = jsonToMarkdown(jsonData);

  // Write the generated Markdown to a file
  fs.writeFileSync('./SupportedDeviceList.md', markdownData);
};

// Execute the main function
main();
