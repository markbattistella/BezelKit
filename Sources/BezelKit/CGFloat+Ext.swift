//
// Project: BezelKit
// Author: Mark Battistella
// Website: https://markbattistella.com
//

import Foundation

@MainActor
extension CGFloat {

    /// A configurable set of fallback values per platform, used when bezel data is unavailable
    /// or zero.
    static internal var fallbackConfig = FallbackConfig()

    /// The bezel width of the current device, using actual data where available, or falling back
    /// to a configured default value when appropriate.
    ///
    /// This property checks the current platform and applies the corresponding fallback only if
    /// `applyIfZero` is set to `true`.
    ///
    /// - For **iOS** (non-Mac Catalyst), it attempts to retrieve the actual bezel size via
    /// `DeviceBezel`. If the value is `0` and fallback is allowed, it uses the configured iOS
    /// fallback.
    ///
    /// - For **Mac Catalyst**, **macOS**, **tvOS**, **watchOS**, and **visionOS**, it directly
    /// checks the fallback configuration and returns the value if permitted.
    ///
    /// - Returns: The device’s bezel width as a `CGFloat`, or a fallback/default value if none
    /// available.
    public static var deviceBezel: CGFloat {
        
        #if os(iOS) && !targetEnvironment(macCatalyst)

        let current = DeviceBezel.currentBezel ?? 0

        return (current == .zero && fallbackConfig.iOS.applyIfZero) ? fallbackConfig.iOS.value : current

        #elseif targetEnvironment(macCatalyst)

        return fallbackConfig.macCatalyst.applyIfZero ? fallbackConfig.macCatalyst.value : 0

        #elseif os(macOS)

        return fallbackConfig.macOS.applyIfZero ? fallbackConfig.macOS.value : 0

        #elseif os(tvOS)

        return fallbackConfig.tvOS.applyIfZero ? fallbackConfig.tvOS.value : 0

        #elseif os(watchOS)

        return fallbackConfig.watchOS.applyIfZero ? fallbackConfig.watchOS.value : 0

        #elseif os(visionOS)

        return fallbackConfig.visionOS.applyIfZero ? fallbackConfig.visionOS.value : 0

        #else

        return 0

        #endif
    }

    /// Returns the device bezel with an optional margin subtracted from it.
    ///
    /// Useful when you need to inset a view or spacing from the bezel area to define a "safe
    /// inner boundary".
    ///
    /// - Parameter margin: A margin to subtract from the computed bezel value.
    /// - Returns: The bezel value minus the given margin.
    public static func deviceBezel(with margin: CGFloat) -> CGFloat {
        deviceBezel.innerRadius(with: margin)
    }

    /// Sets the fallback configuration to use when a bezel value is missing or zero.
    ///
    /// - Parameter config: The fallback values to use across all supported platforms.
    public static func setFallbackConfig(_ config: FallbackConfig) {
        fallbackConfig = config
    }
}

extension Numeric where Self: Comparable {

    /// Subtracts the given margin from the current value.
    ///
    /// - Parameter margin: The value to subtract.
    /// - Returns: The result of `self - margin`.
    internal func innerRadius(with margin: Self) -> Self {
        return self - margin
    }
}
