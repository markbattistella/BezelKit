//
// Project: BezelKit
// Author: Mark Battistella
// Website: https://markbattistella.com
//

import UIKit

/// `DeviceBezel` provides a mechanism to obtain the bezel radius of the current device.
public class DeviceBezel {

	/// An enumeration of errors that can occur when attempting to obtain a device's bezel thickness.
	public enum DeviceBezelError: Error {

		/// The resource needed to fetch bezel data could not be located.
		case resourceNotFound

		/// An error occurred when parsing the bezel data.
		/// - Parameters:
		///   - String: A description of the parsing error.
		case dataParsingFailed(String)
	}

	/// Cache to hold parsed device information.
	private static var devices: Devices?

	/// A cache mapping device identifiers to their respective bezel thicknesses.
	private static var cache: [String: CGFloat] = [:]

	/// A callback to be invoked when an error occurs during bezel data fetching or processing.
	public static var errorCallback: ((DeviceBezelError) -> Void)?

	/// Loads device data from the JSON resource, decoding and caching the relevant information.
	///
	/// - Throws: An error of type `DeviceBezelError` if there's an issue accessing or decoding the data.
	private static func loadDeviceData() throws {
		guard let url = Bundle.module.url(
			forResource: "bezel",
			withExtension: "min.json"
		) else {
			throw DeviceBezelError.resourceNotFound
		}

		let data = try Data(contentsOf: url)
		let decodedData = try JSONDecoder().decode(Database.self, from: data)
		self.devices = decodedData.devices
		cacheDevices(from: decodedData.devices)
	}

	/// Caches bezel radius data for various device types: iPad, iPhone, and iPod.
	///
	/// - Parameters:
	///   - devices: The `Devices` struct containing bezel information for different device types.
	private static func cacheDevices(from devices: Devices) {
		cacheDeviceType(devices.iPad)
		cacheDeviceType(devices.iPhone)
		cacheDeviceType(devices.iPod)
	}

	/// Helper function that populates the cache with bezel radius for a specific device type.
	///
	/// - Parameters:
	///   - deviceType: A dictionary mapping device identifiers to their respective `DeviceInfo`.
	private static func cacheDeviceType(_ deviceType: [String: DeviceInfo]) {
		for (identifier, deviceInfo) in deviceType {
			cache[identifier] = CGFloat(deviceInfo.bezel)
		}
	}
}

extension DeviceBezel {

	/// Provides the bezel thickness for the current device.
	///
	/// If the data hasn't been loaded yet, this property will attempt to load it. If any errors occur during the loading or
	/// processing, the registered error callback (if any) will be invoked.
	///
	/// - Returns: An optional `CGFloat` representing the bezel thickness for the current device.
	/// Returns `nil` if the information isn't available or an error occurred.
	public static var currentBezel: CGFloat? {
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
