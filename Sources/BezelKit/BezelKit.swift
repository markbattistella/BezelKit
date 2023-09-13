//
//  BezelKit
//  Created by Mark Battistella
//

import UIKit

/// A utility class for fetching device-specific bezel sizes.
public class DeviceBezel {

	/// A cache for device bezel sizes, using device identifiers as keys.
	private static var deviceCache: [String : CGFloat] = [:]

	/// Stores all device information after the initial load.
	private static var allDevices: AllDevices?

	/// Enum to categorise different types of devices.
	private enum DeviceCategory: String, CaseIterable {
		case iPod, iPhone, iPad
	}

	/// Struct to represent each device type.
	private struct DeviceType: Decodable {
		let device: String
		let identifiers: [String]
		let bezel: CGFloat
	}

	/// Struct to represent all devices, categorized by type.
	private struct AllDevices: Decodable {
		let iPod: [DeviceType]
		let iPhone: [DeviceType]
		let iPad: [DeviceType]
	}

	/// Loads and caches device information from the embedded JSON file.
	/// Throws an error if the JSON file cannot be loaded or decoded.
	private static func loadDeviceData() throws {

		// Attempt to find the URL of the JSON file in the module bundle.
		guard let url = Bundle.module.url(forResource: "bezel.min", withExtension: "json") else {
			throw NSError(domain: "ResourceNotFound", code: 404, userInfo: nil)
		}
		let data = try Data(contentsOf: url)
		let decodedData = try JSONDecoder().decode(AllDevices.self, from: data)
		allDevices = decodedData
		cacheDevices(from: decodedData)
	}

	/// Caches the bezel sizes of devices for quicker future access.
	///
	/// - Parameter data: The `AllDevices` instance containing all device information.
	private static func cacheDevices(from data: AllDevices) {
		for category in DeviceCategory.allCases {
			let deviceTypes: [DeviceType]
			switch category {
				case .iPod:
					deviceTypes = data.iPod
				case .iPhone:
					deviceTypes = data.iPhone
				case .iPad:
					deviceTypes = data.iPad
			}

			for deviceType in deviceTypes {
				deviceType.identifiers.forEach { identifier in
					deviceCache[identifier] = deviceType.bezel
				}
			}
		}
	}

	/// Fetches the bezel size for the current device.
	///
	/// This method will load and cache device data from a JSON file if it hasn't been loaded yet.
	/// If the device's bezel size is not found, this method returns `nil`.
	///
	/// - Returns: The bezel size of the current device as `CGFloat` or `nil` if not found.
	public static var currentBezel: CGFloat? {

		// Load device data if it hasn't been loaded yet.
		if allDevices == nil {
			do {
				try loadDeviceData()
			} catch {
				print("Failed to load device data: \(error)")
				return nil
			}
		}

		// Fetch the model identifier of the current device.
		let identifier = UIDevice.current.modelIdentifier

		// Look up the bezel size for the current device in the cache.
		return deviceCache[identifier]
	}
}

/// `UIDevice` extension to add a `modelIdentifier` property.
private extension UIDevice {

	/// The model name identifier of the device.
	///
	/// For real devices, this identifier is obtained by calling `uname()` function.
	/// For simulators, the identifier is read from the environment variable `SIMULATOR_MODEL_IDENTIFIER`.
	///
	/// - Returns: A `String` representing the model name identifier of the device.
	var modelIdentifier: String {
		#if targetEnvironment(simulator)
			return ProcessInfo().environment["SIMULATOR_MODEL_IDENTIFIER"] ?? ""
		#else
			var systemInfo = utsname()
			uname(&systemInfo)
			let machineMirror = Mirror(reflecting: systemInfo.machine)
			return machineMirror.children.compactMap {
				$0.value as? Int8
			}.filter {
				$0 != 0
			}.map {
				String(UnicodeScalar(UInt8($0)))
			}.joined()
		#endif
	}
}

/// `CGFloat` extension for accessing device-specific bezel sizes.
public extension CGFloat {

	// Fallback value if bezel size is unavailable.
	private static var fallbackBezelValue: CGFloat = 0.0

	// Flag to determine if zero should be considered as a fallback condition.
	private static var shouldFallbackIfZero: Bool = false

	/// Returns the bezel size for the current device, or the fallback value if unavailable or zero.
	///
	/// - Returns: A `CGFloat` representing the bezel size or the fallback value.
	static var deviceBezel: CGFloat {
		if let currentBezel = DeviceBezel.currentBezel,
		   !(shouldFallbackIfZero && currentBezel == 0.0) {
			return currentBezel
		}
		return fallbackBezelValue
	}

	/// Sets a fallback value to be used when the bezel size for the current device is unavailable or zero.
	///
	/// - Parameters:
	///   - value: The fallback `CGFloat` value to be used.
	///   - zero: A `Bool` flag to determine if a zero value should trigger the fallback.
	static func setFallbackDeviceBezel(_ value: CGFloat, ifZero zero: Bool = false) {
		fallbackBezelValue = value
		shouldFallbackIfZero = zero
	}
}
