<div align="center">

<img src="https://raw.githubusercontent.com/markbattistella/BezelKit/main/Data/kit-icon.png" width="128" height="128"/>

# BezelKit

<small>Perfecting Corners, One Radius at a Time</small>

![Languages](https://img.shields.io/badge/Languages-Swift,%20SwiftUI,%20UIKit-white?labelColor=orange&style=flat)
![Platforms](https://img.shields.io/badge/Platforms-iOS%2011+,%20iPadOS%2013+-white?labelColor=gray&style=flat)
![Licence](https://img.shields.io/badge/Licence-MIT-white?labelColor=blue&style=flat)

</div>

## Overview

BezelKit is a Swift package designed to simplify the process of accessing device-specific bezel sizes in apps.

Knowing the exact bezel size can be crucial for aligning UI elements, creating immersive experiences, or when you need pixel-perfect design layouts.

By providing an easy-to-use API, `BezelKit` allows developers to focus more on their app's functionality rather than wrestling with device metrics.

## Rationale

> **Quick Summary**
>
> - No public API from Apple for fetching bezel sizes.
> - Using internal APIs can jeopardise App Store eligibility.
> - Static bezel values can cause UI distortions across devices.
> - `BezelKit` offers an easy-to-use solution for accurate bezel metrics.

Apple currently does not offer a public API for fetching the bezel radius of its devices.

Although an internal API exists, using it jeopardises the app's eligibility for the App Store — a risk that's not justifiable for a mere UI element.

Another consideration stems from the variability in screen bezel dimensions across different Apple devices. Setting a static bezel value is problematic for several reasons:

1. If the actual bezel radius is smaller or larger than the static value, the UI corners will appear disproportionately thick or thin.

   ![Zoomed - Static Value](https://raw.githubusercontent.com/markbattistella/BezelKit/main/Data/zoomed-static.jpg)

2. On older devices or those with square screens, such as the SE models, the display will inaccurately feature curved corners when it should not.

While Apple has provided the [`ContainerRelativeShape`](https://developer.apple.com/documentation/swiftui/containerrelativeshape) inset, its functionality is currently limited to Widgets. For all other applications, this API reports a squared rectangle, making it unsuitable for our needs.

A nice looking solution would look like this:

![Zoomed - BezelKit](https://raw.githubusercontent.com/markbattistella/BezelKit/main/Data/zoomed-bezelkit.jpg)

## Compatibility

### Devices

In terms of the devices supported though, it covers from the initial versions of all devices. See the [supported device list](https://github.com/markbattistella/BezelKit/blob/main/SupportedDeviceList.md).

## Installation

### Swift Package Manager

The BezelKit package uses Swift Package Manager (SPM) for easy and convenient distribution. Follow these steps to add it to your project:

1. In Xcode, click `File -> Swift Packages -> Add Package Dependency`.
2. In the search bar, type `https://github.com/markbattistella/BezelKit` and click `Next`.
3. Specify the version you want to use. You can select the exact version, use the latest one, or set a version range, and then click `Next`.
4. Finally, select the target in which you want to use `BezelKit` and click `Finish`.

## Usage

Using `BezelKit` is simple and can help you avoid complexities related to device metrics.

### Quick Start

1. Import the BezelKit module:

   ```swift
   import BezelKit
   ```

1. Access the device bezel size:

   ```swift
   let currentBezel = CGFloat.deviceBezel
   ```

For advanced usage, including perfect scaling of UI elements and setting fallback sizes, read the sections below.

### Perfect Scaling

The `BezelKit` package not only provides an easy way to access device-specific bezel sizes but also enables perfect scaling of rounded corners within the UI.

When you have a rounded corner on the outer layer and an inner UI element that also needs a rounded corner, maintaining a perfect aspect ratio becomes essential for a harmonious design. This ensures your UI scales beautifully across different devices.

Here's how to implement it:

```swift
let outerBezel = CGFloat.BezelKit
let innerBezel = outerBezel - distance  // Perfect ratio
```

By following this approach, you can ensure that your UI elements scale perfectly in relation to the device's bezel size.

![Perfect scaling](https://raw.githubusercontent.com/markbattistella/BezelKit/main/Data/ratio.jpg)

### Setting a Fallback Bezel Size

The package provides an easy way to specify a fallback bezel size. By default, the `CGFloat.deviceBezel` attribute returns `0.0` if it cannot ascertain the device's bezel size.

#### Enable Zero-Check Option

In addition to specifying the fallback value, you have the option to return the fallback value even when the bezel size is determined to be zero.

#### UIKit: Setting the Fallback in AppDelegate

For UIKit-based applications, you can set the fallback value in the `AppDelegate` within the `application(_:didFinishLaunchingWithOptions:)` method. This is the earliest point at which you can set the fallback value for your app.

```swift
import UIKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

  func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    // Sets a fallback value of 10.0 and enables zero-check
    CGFloat.setFallbackDeviceBezel(10.0, ifZero: true)
    return true
  }
}
```

#### SwiftUI: Setting the Fallback on Appear

For SwiftUI applications, you can set this value in the `.onAppear()` modifier for your main content view.

```swift
import SwiftUI

@main
struct YourApp: App {
  var body: some Scene {
    WindowGroup {
      ContentView()
        .onAppear() {
          // Sets a fallback value of 10.0 and enables zero-check
          CGFloat.setFallbackDeviceBezel(10.0, ifZero: true)
        }
    }
  }
}

struct ContentView: View {
  var body: some View {
    Text("Hello, SwiftUI!")
  }
}
```

#### Note

You only need to call `setFallbackDeviceBezel(_:ifZero:)` once. Doing this as early as possible ensures the fallback setting is applied throughout your application.

### Effects of Setting a Fallback

If you've set a fallback value, `CGFloat.deviceBezel` will return this fallback value when it cannot determine the bezel size for the current device, or optionally, when the bezel size is zero.

```swift
// With fallback set to 10.0 and zero check enabled
let currentBezel = CGFloat.deviceBezel
print("Current device bezel: \(currentBezel)")

// Output will be 10.0 if the device is not in the JSON data or the bezel is zero
```

If no fallback is set, `CGFloat.BezelKit` defaults to `0.0` when the device-specific bezel size is unavailable.

```swift
// With no fallback set and zero check disabled
let currentBezel = CGFloat.deviceBezel
print("Current device bezel: \(currentBezel)")

// Output will be 0.0 if the device is not in the JSON data
```

## Comparison

This is a comparison between using a static, single value for all devices and how it looks when rendered compared to `BezelKit` which will adapt to each device.

This was the code when using a static, single value for all devices:

```swift
import SwiftUI

struct ContentView: View {
  var body: some View {
    RoundedRectangle(cornerRadius: 60)
      .stroke(.green, lineWidth: 20)
      .ignoresSafeArea()
  }
}
```

![Comparison - Static Values](https://raw.githubusercontent.com/markbattistella/BezelKit/main/Data/comparison-static.jpg)

In a fixed value configuration, devices with no curved screen look odd, while this `cornerRadius` is designed for the iPhone 14 Pro Max, it looks chunky on the iPhone 14, and *good-ish* on the iPhone 14 Pro.

This was the code when using a `BezelKit`:

```swift
import SwiftUI
import BezelKit

struct ContentView: View {
  var body: some View {
    RoundedRectangle(cornerRadius: .BezelKit)
      .stroke(.green, lineWidth: 20)
      .ignoresSafeArea()
  }
}
```

![Comparison - BezelKit](https://raw.githubusercontent.com/markbattistella/BezelKit/main/Data/comparison-bezelkit.jpg)

As you can see, with no `setFallbackBezelKit` set, the iPhone SE (3rd generation) value is set to `0.0` and results in no curve. However, all other curved devices have a consistent look.

## Things to note

`BezelKit` **does not** currently support the affects from display zooming. When the generator runs, it perfoms all extractions on the "Standard" zoom level of the device.

If this was run on the "Zoomed" level, then the bezel radius would be different. However, since the physical device cannot change based on the zoom level, using "Standard" is the correct CGFloat number.

There is also no way to automate zoom levels in `xcrun simctl` so it would have to be a manual inclusion, and at this point in time (unless raised via Issues) there is no realy benefit for using the zoomed value for `_displayRoundedCorner`.

## Generating New Bezels

You can generate new bezel data for additional devices using the `index.js` NodeJS script located in the `Sources/Generator` folder.

### Requirements

- iOS/iPadOS runtime installed on your Mac machine to get the simulator.
- NodeJS installed to run the script.
- All requirements for running a simulator, opening an Xcode project, etc.

**Recommendation**: Install it on a macOS VM so as not to interfere with your personal Xcode setup.

### Steps

1. **CSV File**: The script reads from a CSV file that contains Apple device identifiers (like `iPhone1,1`) and their friendly names (like "iPhone 1").

2. **Target Simulators**: The script uses the `target-simulators.txt` file to decide which simulators to boot and fetch bezel sizes from.

3. **Success & Failure**:
   - If it succeeds, the simulator ID is moved to the `completed-simulators.txt` file.
   - If it fails, the simulator ID is moved to the `problematic-simulators.txt` file.

To run the script:

```bash
cd Sources/Generator
node index.js
```

### Updating Data

If you'd like to update or extend the list of device bezel sizes, you can easily do so by:

1. **Adding to CSV**: Add more devices and their identifiers to the existing CSV file. Make sure the friendly names in the CSV match the "Device Type" from the `Create New Simulator` screen in Xcode.

   ![Add New Simulator](https://raw.githubusercontent.com/markbattistella/BezelKit/main/Data/simulator.jpg)

2. **Problematic Simulators**: If any simulators are listed in the `problematic-simulators.txt`, you can move them back to `target-simulators.txt` and attempt to run the script again to see if the issue is resolved.

By following these steps, you can continually update and maintain the device bezel data.

## Contributing

Contributions are more than welcome. If you find a bug or have an idea for an enhancement, please open an issue or provide a pull request.

Please follow the code style present in the current code base when making contributions.

**Note**: any pull requests need to have the title in the following format, otherwise it will be rejected.

```text
YYYY-mm-dd - {title}
eg. 2023-08-24 - Updated README file
```

I like to track the day from logged request to completion, allowing sorting, and extraction of data. It helps me know how long things have been pending and provides OCD structure.

## Licence

The BezelKit package is released under the MIT licence. See [LICENCE](https://github.com/markbattistella/BezelKit/blob/main/LICENCE) for more information.
