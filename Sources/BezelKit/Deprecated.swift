//
// Project: BezelKit
// Author: Mark Battistella
// Website: https://markbattistella.com
//

import Foundation

@MainActor
extension CGFloat {

    /// The legacy fallback bezel value used for iOS devices.
    ///
    /// - Warning: Deprecated. Use `setFallbackConfig(_:)` and define platform-specific values in
    /// `FallbackConfig` instead.
    @available(*, deprecated, message: "Use setFallbackConfig(_:), and define platform-specific values in FallbackConfig.")
    private static var fallbackBezelValue: CGFloat {
        get { fallbackConfig.iOS.value }
        set { fallbackConfig.iOS.value = newValue }
    }

    /// Indicates whether the fallback bezel value should be used if the detected value is zero.
    ///
    /// - Warning: Deprecated. Use `setFallbackConfig(_:), and define platform-specific values in FallbackConfig` instead.
    @available(*, deprecated, message: "Use setFallbackConfig(_:), and define platform-specific values in FallbackConfig.")
    private static var shouldFallbackIfZero: Bool {
        get { fallbackConfig.iOS.applyIfZero }
        set { fallbackConfig.iOS.applyIfZero = newValue }
    }

    /// Sets the legacy fallback bezel value and fallback behaviour for iOS.
    ///
    /// This method modifies only the iOS entry in the fallback configuration and is maintained
    /// for compatibility with older code.
    ///
    /// - Parameters:
    ///   - value: The fallback bezel value to apply.
    ///   - zero: Whether the fallback should be used if the actual value is zero.
    ///
    /// - Warning: Deprecated. Use `setFallbackConfig(_:)` with a complete `FallbackConfig` instead.
    @available(*, deprecated, message: "Use setFallbackConfig(_:) with a FallbackConfig instance.")
    public static func setFallbackDeviceBezel(_ value: CGFloat, ifZero zero: Bool = false) {
        fallbackConfig.iOS = (value, zero)
    }
}
