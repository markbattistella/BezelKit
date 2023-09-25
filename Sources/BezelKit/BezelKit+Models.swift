//
// Project: BezelKit
// Author: Mark Battistella
// Website: https://markbattistella.com
//

import Foundation

/// Represents the structure of the database that contains information about various devices.
internal struct Database: Decodable {
	
	/// Contains information categorized by device types (iPad, iPhone, iPod).
	let devices: Devices
}

/// Represents categorized device information by types such as iPad, iPhone, and iPod.
internal struct Devices: Decodable {
	
	/// A dictionary mapping model identifiers to their respective `DeviceInfo` for iPads.
	let iPad: [String: DeviceInfo]
	
	/// A dictionary mapping model identifiers to their respective `DeviceInfo` for iPhones.
	let iPhone: [String: DeviceInfo]
	
	/// A dictionary mapping model identifiers to their respective `DeviceInfo` for iPods.
	let iPod: [String: DeviceInfo]
}

/// Contains detailed information about a specific device model.
internal struct DeviceInfo: Decodable {
	
	/// The bezel thickness for the device.
	let bezel: Double
	
	/// The name or description of the device model.
	let name: String
}
