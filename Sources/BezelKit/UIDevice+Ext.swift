//
// Project: BezelKit
// Author: Mark Battistella
// Website: https://markbattistella.com
//

import UIKit

extension UIDevice {

    /// The model identifier string of the device.
    ///
    /// For devices running in the simulator, this will retrieve the simulated device's model
    /// identifier. For physical devices, it will return the actual device's model identifier.
    ///
    /// Example identifiers: `iPhone7,1`, `iPad6,11`, etc.
    ///
    /// - Returns: A `String` representing the model identifier of the device.
    var modelIdentifier: String {

        #if targetEnvironment(simulator)

        // Fetch the model identifier for the simulated device.
        return ProcessInfo().environment["SIMULATOR_MODEL_IDENTIFIER"] ?? ""

        #else

        // Fetch the model identifier for a physical device.
        var systemInfo = utsname()
        uname(&systemInfo)
        let machineMirror = Mirror(reflecting: systemInfo.machine)
        return machineMirror.children.compactMap { $0.value as? Int8 }
            .filter { $0 != 0 }
            .map { String(UnicodeScalar(UInt8($0))) }
            .joined()

        #endif
    }
}
