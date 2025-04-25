//
// Project: BezelKit
// Author: Mark Battistella
// Website: https://markbattistella.com
//

import Foundation

/// A representation of the decoded device bezel database.
///
/// This structure is typically loaded from a JSON file (e.g., `bezel.min.json`) and contains
/// bezel information for various Apple device types.
internal struct Database: Decodable {

    /// A nested container holding device information grouped by type (iPad, iPhone, iPod).
    let devices: Devices

    /// A collection of devices grouped by type.
    internal struct Devices: Decodable {

        /// Dictionary of iPad model identifiers and their associated info.
        let iPad: [String: DeviceInfo]

        /// Dictionary of iPhone model identifiers and their associated info.
        let iPhone: [String: DeviceInfo]

        /// Dictionary of iPod model identifiers and their associated info.
        let iPod: [String: DeviceInfo]

        /// Detailed information about a specific device model.
        internal struct DeviceInfo: Decodable {

            /// The bezel width of the device in points.
            let bezel: Double

            /// A human-readable name of the device (e.g., "iPhone 14 Pro").
            let name: String
        }
    }
}
