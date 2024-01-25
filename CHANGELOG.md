# Change log

All notable changes to this project will be documented in this file.

## 2.0.2

### What's changed

#### 2024-01-25

- Updated README to detail using `init()` instead of `.onAppear` in SwiftUI
- Fixed the checks for `0` value bezels

## 2.0.1

<details>
<summary>Expand</summary>

### 2023-10-08

- Removed the "Generator" from main repo
- Moved "Generator" into its own repo [#28](https://github.com/markbattistella/BezelKit/issues/28)

</details>

## 2.0.0

<details>
<summary>Expand</summary>

### 2023-09-23

@corbin-c began working on some of the issues:

- This PR starts the refactoring of the huge `index.js` file, by extracting methods into separate modules.

### 2023-09-25 - Full Updated Package

This PR addresses a few changes:

1. The `Generator` has been extracted out into the root of the project. This makes it clearer what is Swift Package, and what is NodeJS generation [#20](https://github.com/markbattistella/BezelKit/issues/20)

1. Remove watchOS from the structure since there is no clear and simple way to extract the bezel radius data [#21](https://github.com/markbattistella/BezelKit/issues/21)

1. Removed the use of `txt` files and moved all data into a JSON file. This allows the data to be unique and easier to handle [#24](https://github.com/markbattistella/BezelKit/issues/24)

1. Refactored the way devices are listed in the JSON vs the CSV. JSON using the identifiers as the keys allows there to only be one key at a time - removing conflicts of duplicate identifiers [#24](https://github.com/markbattistella/BezelKit/issues/24)

1. Fixed the way identifiers and data is moved around once the script it run [#19](https://github.com/markbattistella/BezelKit/issues/19)

1. Refactored the modularisation of the Generator scripts [#22](https://github.com/markbattistella/BezelKit/issues/22)

> **Note:** as for the end user / developer there are no breaking changes. There are some error handling additions, and the way the JSON is outputted, but for usage in an Xcode project the API calls are still the same

</details>

## 1.0.4

<details>
<summary>Expand</summary>

### 2023-09-01

- Auto-update `SupportedDeviceList.md` by @markbattistella-bot in #15

### 2023-09-13

- Added iPhone 15 models by @markbattistella in #17

</details>

## 1.0.2

<details>
<summary>Expand</summary>

### What's Changed

#### 2023-08-26

- Auto-update `SupportedDeviceList.md` by @markbattistella-bot in #10

#### 2023-08-27

- Fix fallback bezel by @markbattistella in #12
- Revert testing of GH action by @markbattistella in #13

</details>

## 1.0.1

<details>
<summary>Expand</summary>

### Fixed

- Fixes #4: Now there is a cached version of the JSON next to the `index.js` script. The new data is merged into that instead of the CSV (which was defaulting the bezel to 0.0).
- Fixes #5: `index.js` file now has a help menu when passing in the `--help` option. This can aid others if using the script or taking it for their own projects.
- Fixed #6: Created a `.github/workflow` to handle `SupportedDevices`

### Updated

- Some of the variable names in the script were changed to be cleaner
- The JSON file name was changed
- Moved the Supported Device List to new file
- Created CRON action to generate the file
- README was updated with some images
- Images were compressed for data saving

</details>

## 1.0.0

<details>
<summary>Expand</summary>

- `Package.swift` now imports correct files from the Resources
- `Package.swift` now excludes the Generator correctly
- Codebase now references the JSON file correctly
- Got rid of the expanded JSON file as it wasn't used
- `README` file now has better explanation of `setFallbackDeviceBezel`
- `README` doesn't use US localisation

</details>

## 0.0.1

<details>
<summary>Expand</summary>

- Initial release

</details>
