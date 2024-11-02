#!/bin/bash

echo "Generating SupportedDeviceList.md from JSON..."
node ./.github/supported-devices.js

if [[ `git status --porcelain` ]]; then

  git add ./SupportedDeviceList.md
  echo "SupportedDeviceList.md updated and staged."

else

  echo "No changes in SupportedDeviceList.md"

fi
