//
// Project: BezelKit
// Author: Mark Battistella
// Website: https://markbattistella.com
//

import CoreGraphics
import Foundation

#if os(iOS) && !targetEnvironment(macCatalyst)
  import UIKit
#endif

/// A utility class for retrieving bezel sizes of Apple devices based on model identifiers.
///
/// This class attempts to load a precompiled JSON database (`bezel.min.json`) containing bezel
/// information for known Apple device models. It supports caching and includes error reporting
/// via an optional callback.
@MainActor
public final class DeviceBezel {

  /// Possible errors thrown or reported during device data loading and decoding.
  public enum DeviceBezelError: Error, Sendable {

    /// Thrown when the JSON resource file could not be found in the bundle.
    case resourceNotFound

    /// Thrown when the data fails to decode properly, includes context.
    case dataParsingFailed(String)
  }

  /// The in-memory representation of decoded device data.
  private static var devices: Database.Devices?

  /// A cache mapping device model identifiers (e.g., `"iPhone14,2"`) to their bezel sizes.
  private static var cache: [String: CGFloat] = [:]

  /// The decoded entry for each device model identifier, kept so per-screen data stays reachable.
  internal static var infoCache: [String: Database.Devices.DeviceInfo] = [:]

  /// An optional callback for handling errors encountered during data loading.
  public static var errorCallback: ((DeviceBezelError) -> Void)?

  /// Loads and decodes the device bezel data from the embedded JSON resource file.
  ///
  /// This method throws an error if the file is not found or if decoding fails. Upon successful
  /// decoding, the data is cached for quick access.
  private static func loadDeviceData() throws {
    guard
      let url = Bundle.module.url(
        forResource: "bezel.min",
        withExtension: "json"
      )
    else {
      throw DeviceBezelError.resourceNotFound
    }

    let data = try Data(contentsOf: url)
    let decodedData = try JSONDecoder().decode(Database.self, from: data)
    self.devices = decodedData.devices
    cacheDevices(from: decodedData.devices)
  }

  /// Caches the bezel data from all supported device types.
  ///
  /// - Parameter devices: The decoded `Database.Devices` structure.
  private static func cacheDevices(from devices: Database.Devices) {
    cacheDeviceType(devices.iPad)
    cacheDeviceType(devices.iPhone)
    cacheDeviceType(devices.iPod)
  }

  /// Adds bezel values to the cache for a specific type of device.
  ///
  /// - Parameter deviceType: A dictionary of device identifiers to `DeviceInfo`.
  private static func cacheDeviceType(_ deviceType: [String: Database.Devices.DeviceInfo]) {
    for (identifier, deviceInfo) in deviceType {
      cache[identifier] = CGFloat(deviceInfo.bezel)
      infoCache[identifier] = deviceInfo
    }
  }
}

#if os(iOS) && !targetEnvironment(macCatalyst)

  extension DeviceBezel {

    /// The bezel size of the current device, if available.
    ///
    /// On multi-screen devices this is the largest corner of the screen the app is on.
    ///
    /// This property attempts to return the bezel size for the current device model by looking it
    /// up in the cached database. If the data has not yet been loaded, it tries to load and decode
    /// the JSON resource.
    ///
    /// - Returns: A `CGFloat` representing the bezel size in points, or `nil` if unavailable.
    internal static var currentBezel: CGFloat? {
      currentCorners?.largest
    }

    /// The corners of the screen the app is on right now, if the device is known.
    ///
    /// Devices with a single uniform display resolve to one radius on every corner. Multi-screen
    /// devices resolve to the active screen's corners, turned to match the interface orientation.
    ///
    /// - Returns: The current corners, or `nil` if the data is unavailable or the device is
    /// unknown.
    internal static var currentCorners: BezelCorners? {
      if devices == nil {
        do {
          try loadDeviceData()
        } catch let error as DeviceBezelError {
          errorCallback?(error)
          return nil
        } catch let error as DecodingError {
          errorCallback?(handleDecodingError(error))
          return nil
        } catch {
          errorCallback?(.dataParsingFailed(error.localizedDescription))
          return nil
        }
      }

      guard let info = infoCache[UIDevice.current.modelIdentifier] else { return nil }

      let display = activeDisplay
      return info.corners(nativeSize: display?.nativeSize, orientation: display?.orientation ?? .portrait)
    }

    /// The screen the app is currently shown on and how its interface is turned.
    ///
    /// Read from the window scene rather than a global screen, since a device like iPhone Duo
    /// has more than one. `UIApplication` is reached by selector because it is unavailable to
    /// app extensions at compile time, and this package must still build for them.
    private static var activeDisplay: (nativeSize: CGSize, orientation: DisplayOrientation)? {
      let selector = NSSelectorFromString("sharedApplication")
      guard
        UIApplication.responds(to: selector),
        let application = UIApplication.perform(selector)?.takeUnretainedValue() as? UIApplication
      else { return nil }

      let scenes = application.connectedScenes.compactMap { $0 as? UIWindowScene }
      guard
        let scene = scenes.first(where: { $0.activationState == .foregroundActive })
          ?? scenes.first(where: { $0.activationState == .foregroundInactive })
          ?? scenes.first
      else { return nil }

      let orientation: UIInterfaceOrientation
      if #available(iOS 16.0, *) {
        orientation = scene.effectiveGeometry.interfaceOrientation
      } else {
        orientation = scene.interfaceOrientation
      }

      return (scene.screen.nativeBounds.size, DisplayOrientation(orientation))
    }
  }

  extension DisplayOrientation {
    fileprivate init(_ orientation: UIInterfaceOrientation) {
      switch orientation {
      case .portraitUpsideDown: self = .portraitUpsideDown
      case .landscapeLeft: self = .landscapeLeft
      case .landscapeRight: self = .landscapeRight
      default: self = .portrait
      }
    }
  }

#endif

extension DeviceBezel {

  /// Converts a `DecodingError` into a `DeviceBezelError` with human-readable context.
  ///
  /// - Parameter error: The decoding error to convert.
  /// - Returns: A `DeviceBezelError` containing a description of the failure.
  internal static func handleDecodingError(_ error: DecodingError) -> DeviceBezelError {
    switch error {

    case .dataCorrupted(let context):
      return .dataParsingFailed(context.debugDescription)

    case .keyNotFound(let key, let context):
      return .dataParsingFailed("Key '\(key)' not found: \(context.debugDescription)")

    case .valueNotFound(let value, let context):
      return .dataParsingFailed("Value '\(value)' not found: \(context.debugDescription)")

    case .typeMismatch(let type, let context):
      return .dataParsingFailed("Type '\(type)' mismatch: \(context.debugDescription)")

    @unknown default:
      return .dataParsingFailed("Unknown DecodingError encountered.")
    }
  }
}
