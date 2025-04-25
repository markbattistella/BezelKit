//
// Project: BezelKit
// Author: Mark Battistella
// Website: https://markbattistella.com
//

import Foundation

/// A configuration container that provides platform-specific fallback values.
///
/// `FallbackConfig` is useful for defining default values per platform, optionally allowing those
/// values to be applied even when the primary value is zero. Each platform configuration contains
/// a `CGFloat` value and a `Bool` indicating whether the value should be used when the target
/// value is zero.
public struct FallbackConfig {

    /// Fallback value and usage condition for iOS.
    internal var iOS: (value: CGFloat, applyIfZero: Bool)

    /// Fallback value and usage condition for macOS.
    internal var macOS: (value: CGFloat, applyIfZero: Bool)

    /// Fallback value and usage condition for Mac Catalyst.
    internal var macCatalyst: (value: CGFloat, applyIfZero: Bool)

    /// Fallback value and usage condition for tvOS.
    internal var tvOS: (value: CGFloat, applyIfZero: Bool)

    /// Fallback value and usage condition for watchOS.
    internal var watchOS: (value: CGFloat, applyIfZero: Bool)

    /// Fallback value and usage condition for visionOS.
    internal var visionOS: (value: CGFloat, applyIfZero: Bool)

    /// Creates a new instance of `FallbackConfig` with optional fallback values for each platform.
    ///
    /// All parameters default to `(0.0, false)`, meaning no fallback is applied by default.
    ///
    /// - Parameters:
    ///   - iOS: A tuple for iOS fallback.
    ///   - macOS: A tuple for macOS fallback.
    ///   - macCatalyst: A tuple for Mac Catalyst fallback.
    ///   - tvOS: A tuple for tvOS fallback.
    ///   - watchOS: A tuple for watchOS fallback.
    ///   - visionOS: A tuple for visionOS fallback.
    public init(
        iOS: (CGFloat, Bool) = (0.0, false),
        macOS: (CGFloat, Bool) = (0.0, false),
        macCatalyst: (CGFloat, Bool) = (0.0, false),
        tvOS: (CGFloat, Bool) = (0.0, false),
        watchOS: (CGFloat, Bool) = (0.0, false),
        visionOS: (CGFloat, Bool) = (0.0, false)
    ) {
        self.iOS = iOS
        self.macOS = macOS
        self.macCatalyst = macCatalyst
        self.tvOS = tvOS
        self.watchOS = watchOS
        self.visionOS = visionOS
    }
}
