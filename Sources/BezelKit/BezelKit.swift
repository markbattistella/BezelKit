//
//  BezelKit
//  Created by Mark Battistella
//

import UIKit

/// `DeviceBezel` provides an interface for accessing device-specific bezel sizes.
public class DeviceBezel {

	/// Represents a single device's bezel information.
	private struct DeviceData: Decodable {

		/// Unique identifiers associated with a device.
		let identifiers: [String]

		/// Bezel size of the device.
		let bezel: CGFloat
	}

	// Loads device data from the embedded JSON file.
	private static var deviceData: [DeviceData] = {
		guard let data = Bundle(for: DeviceBezel.self)
			.decode([DeviceData].self, from: "bezelData.min.json") else {
			print("Failed to initialize DeviceBezel")
			return []
		}
		return data
	}()

	/// Returns the bezel size for the current device, if available.
	///
	/// - Returns: A `CGFloat` value representing the bezel size, or `nil` if the information is not available.
	public static var currentBezel: CGFloat? {
		let identifier = UIDevice.current.modelIdentifier
		return deviceData.first { $0.identifiers.contains(identifier) }?.bezel
	}
}

/// `UIDevice` extension to add a `modelIdentifier` property.
public extension UIDevice {

	/// Returns the model identifier of the device.
	///
	/// - Returns: A `String` representing the model identifier.
	var modelIdentifier: String {
		var systemInfo = utsname()
		uname(&systemInfo)
		let machineMirror = Mirror(reflecting: systemInfo.machine)
		return machineMirror.children.reduce("") { identifier, element in
			guard let value = element.value as? Int8, value != 0 else { return identifier }
			return identifier + String(UnicodeScalar(UInt8(value)))
		}
	}
}

/// Bundle extension for decoding JSON data.
private extension Bundle {

	/// Decodes a JSON file to a specified type.
	///
	/// - Parameters:
	///   - type: The type to decode to.
	///   - file: The name of the file to decode.
	/// - Returns: The decoded object, or `nil` if the decoding fails.
	func decode<T: Decodable>(_ type: T.Type, from file: String) -> T? {
		guard let url = self.url(forResource: file, withExtension: nil) else {
			return nil
		}
		guard let data = try? Data(contentsOf: url) else {
			return nil
		}
		return try? JSONDecoder().decode(T.self, from: data)
	}
}

/// `CGFloat` extension for accessing device-specific bezel sizes.
public extension CGFloat {

	// Fallback value if bezel size is unavailable.
	private static var fallbackBezelValue: CGFloat = 0.0

	/// Returns the bezel size for the current device, or the fallback value if unavailable.
	///
	/// - Returns: A `CGFloat` representing the bezel size or the fallback value.
	static var deviceBezel: CGFloat {
		return DeviceBezel.currentBezel ?? fallbackBezelValue
	}

	/// Sets a fallback value to be used when the bezel size for the current device is unavailable.
	///
	/// - Parameter value: The fallback `CGFloat` value to be used.
	static func setFallbackDeviceBezel(_ value: CGFloat) {
		fallbackBezelValue = value
	}
}
