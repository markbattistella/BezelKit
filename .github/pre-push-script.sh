#!/bin/bash

# Step 1: Run the JSON to Markdown conversion
echo "Generating SupportedDeviceList.md from JSON..."
node ./.github/supported-devices.js

# Step 2: Check if there are changes to commit
if [[ `git status --porcelain` ]]; then

  # Add the generated markdown to the staging area
  git add ./SupportedDeviceList.md
  echo "SupportedDeviceList.md updated and staged."

else

  echo "No changes in SupportedDeviceList.md"

fi
