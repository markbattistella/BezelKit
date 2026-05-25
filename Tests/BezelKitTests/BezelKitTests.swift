import BezelKit
import CoreGraphics
import Testing

@MainActor
@Suite(.serialized)
struct BezelKitTests {

  @Test("Default configuration resolves safely")
  func defaultConfigurationResolvesToZero() {
    defer { CGFloat.setFallbackConfig(FallbackConfig()) }

    CGFloat.setFallbackConfig(FallbackConfig())

    #if os(iOS) && !targetEnvironment(macCatalyst)
      #expect(CGFloat.deviceBezel >= 0)
    #else
      #expect(CGFloat.deviceBezel == 0)
    #endif
  }

  #if !(os(iOS) && !targetEnvironment(macCatalyst))
    @Test("Configured fallback applies on fallback-only platforms")
    func configuredFallbackApplies() {
      defer { CGFloat.setFallbackConfig(FallbackConfig()) }

      CGFloat.setFallbackConfig(Self.fallbackConfig(value: 12, applyIfZero: true))

      #expect(CGFloat.deviceBezel == 12)
    }
  #endif

  @Test("Margin is subtracted from the resolved bezel")
  func marginIsSubtractedFromResolvedBezel() {
    defer { CGFloat.setFallbackConfig(FallbackConfig()) }

    CGFloat.setFallbackConfig(Self.fallbackConfig(value: 12, applyIfZero: true))
    let resolvedBezel = CGFloat.deviceBezel

    #expect(CGFloat.deviceBezel(with: 4) == resolvedBezel - 4)
  }

  private static func fallbackConfig(
    value: CGFloat,
    applyIfZero: Bool
  ) -> FallbackConfig {
    #if os(iOS) && !targetEnvironment(macCatalyst)
      FallbackConfig(iOS: (value, applyIfZero))
    #elseif targetEnvironment(macCatalyst)
      FallbackConfig(macCatalyst: (value, applyIfZero))
    #elseif os(macOS)
      FallbackConfig(macOS: (value, applyIfZero))
    #elseif os(tvOS)
      FallbackConfig(tvOS: (value, applyIfZero))
    #elseif os(watchOS)
      FallbackConfig(watchOS: (value, applyIfZero))
    #elseif os(visionOS)
      FallbackConfig(visionOS: (value, applyIfZero))
    #else
      FallbackConfig()
    #endif
  }
}
