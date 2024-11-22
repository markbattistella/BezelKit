//
// Project: BezelKit
// Author: Mark Battistella
// Website: https://markbattistella.com
//

import Foundation

@MainActor
extension CGFloat {

    /// A fallback value used when the device bezel radius cannot be determined.
    private static var fallbackBezelValue: CGFloat = 0.0

    /// Indicates if the fallback value should be used when the determined bezel radius is zero.
    private static var shouldFallbackIfZero: Bool = false

    /// The bezel radius for the current device.
    ///
    /// If the bezel radius is not available or an error occurs, this property will use the
    /// fallback value. If the bezel radius is zero and `shouldFallbackIfZero` is set to true,
    /// it will also use the fallback value.
    ///
    /// - Returns: A `CGFloat` representing the bezel radius for the current device or the
    /// fallback value if necessary.
    public static var deviceBezel: CGFloat {
        if let currentBezel = DeviceBezel.currentBezel,
            !(shouldFallbackIfZero
                && (currentBezel == 0.0 || currentBezel == 0 || currentBezel == .zero))
        {
            return currentBezel
        }
        return fallbackBezelValue
    }

    /// Calculates the bezel radius with a specified margin.
    ///
    /// - Parameter margin: The margin to subtract from the bezel radius.
    /// - Returns: The bezel radius adjusted by the margin.
    public static func deviceBezel(with margin: CGFloat) -> CGFloat {
        deviceBezel.innerRadius(with: margin)
    }

    /// Sets a fallback value for the device bezel radius, to be used when the actual value
    /// cannot be determined.
    ///
    /// - Parameters:
    ///   - value: The fallback bezel radius.
    ///   - zero: A Boolean indicating if the fallback value should be used when the determined
    ///   bezel radius is zero.
    public static func setFallbackDeviceBezel(_ value: CGFloat, ifZero zero: Bool = false) {
        fallbackBezelValue = value
        shouldFallbackIfZero = zero
    }
}

extension Numeric where Self: Comparable {

    /// Calculates the inner radius by subtracting a given margin.
    ///
    /// - Parameter margin: The margin to subtract from the current radius.
    /// - Returns: The calculated inner radius.
    func innerRadius(with margin: Self) -> Self {
        return self - margin
    }
}
