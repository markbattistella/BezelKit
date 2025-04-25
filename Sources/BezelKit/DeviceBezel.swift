//
// Project: BezelKit
// Author: Mark Battistella
// Website: https://markbattistella.com
//

#if canImport(UIKit)

import UIKit

/// A utility class for retrieving bezel sizes of Apple devices based on model identifiers.
///
/// This class attempts to load a precompiled JSON database (`bezel.min.json`) containing bezel
/// information for known Apple device models. It supports caching and includes error reporting
/// via an optional callback.
@MainActor
public class DeviceBezel {

    /// Possible errors thrown or reported during device data loading and decoding.
    public enum DeviceBezelError: Error {

        /// Thrown when the JSON resource file could not be found in the bundle.
        case resourceNotFound

        /// Thrown when the data fails to decode properly, includes context.
        case dataParsingFailed(String)
    }

    /// The in-memory representation of decoded device data.
    private static var devices: Database.Devices?

    /// A cache mapping device model identifiers (e.g., `"iPhone14,2"`) to their bezel sizes.
    private static var cache: [String: CGFloat] = [:]
    
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
        }
    }
}

extension DeviceBezel {

    /// The bezel size of the current device, if available.
    ///
    /// This property attempts to return the bezel size for the current device model by looking it
    /// up in the cached database. If the data has not yet been loaded, it tries to load and decode
    /// the JSON resource.
    ///
    /// - Returns: A `CGFloat` representing the bezel size in points, or `nil` if unavailable.
    internal static var currentBezel: CGFloat? {
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

        let identifier = UIDevice.current.modelIdentifier
        return cache[identifier]
    }
}

extension DeviceBezel {

    /// Converts a `DecodingError` into a `DeviceBezelError` with human-readable context.
    ///
    /// - Parameter error: The decoding error to convert.
    /// - Returns: A `DeviceBezelError` containing a description of the failure.
    internal static func handleDecodingError(_ error: DecodingError) -> DeviceBezelError {
        switch error {

            case let .dataCorrupted(context):
                return .dataParsingFailed(context.debugDescription)

            case let .keyNotFound(key, context):
                return .dataParsingFailed("Key '\(key)' not found: \(context.debugDescription)")

            case let .valueNotFound(value, context):
                return .dataParsingFailed("Value '\(value)' not found: \(context.debugDescription)")

            case let .typeMismatch(type, context):
                return .dataParsingFailed("Type '\(type)' mismatch: \(context.debugDescription)")

            @unknown default:
                return .dataParsingFailed("Unknown DecodingError encountered.")
        }
    }
}

#endif
