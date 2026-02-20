#!/bin/bash

set -e

echo "Generating SupportedDeviceList.md from JSON..."
(cd ./Generator && swift run BezelGenerator generate-docs)

if [[ `git status --porcelain` ]]; then

  git add ./SupportedDeviceList.md
  echo "SupportedDeviceList.md updated and staged."

else

  echo "No changes in SupportedDeviceList.md"

fi
