//
// Project: BezelKit
// Author: Mark Battistella
// Website: https://markbattistella.com
//

#if canImport(UIKit)

import UIKit

extension UIDevice {

    /// A string that uniquely identifies the model of the current device.
    ///
    /// This property returns a device identifier such as `"iPhone14,2"` for physical devices,
    /// or the simulator model identifier when running in a simulator environment.
    ///
    /// - Note: The value returned is typically used for identifying specific hardware models and
    /// may not correspond to the user-facing device name.
    ///
    /// - Returns: A string representing the model identifier, or an empty string if unavailable.
    internal var modelIdentifier: String {

        #if targetEnvironment(simulator)

        /// Retrieves the model identifier from the environment variable when running in a simulator.
        return ProcessInfo().environment["SIMULATOR_MODEL_IDENTIFIER"] ?? ""

        #else

        /// Populates system info and extracts the model identifier for physical devices.
        var systemInfo = utsname()
        uname(&systemInfo)

        /// Reflects on the machine field of the utsname struct to build the identifier string.
        let machineMirror = Mirror(reflecting: systemInfo.machine)
        return machineMirror.children.compactMap { $0.value as? Int8 }
            .filter { $0 != 0 }
            .map { String(UnicodeScalar(UInt8($0))) }
            .joined()

        #endif
    }
}

#endif
