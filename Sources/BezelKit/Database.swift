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
internal struct Database: Decodable, Sendable {
    /// A nested container holding device information grouped by type (iPad, iPhone, iPod).
    let devices: Devices

    /// A collection of devices grouped by type.
    internal struct Devices: Decodable, Sendable {
        /// Dictionary of iPad model identifiers and their associated info.
        let iPad: [String: DeviceInfo]

        /// Dictionary of iPhone model identifiers and their associated info.
        let iPhone: [String: DeviceInfo]

        /// Dictionary of iPod model identifiers and their associated info.
        let iPod: [String: DeviceInfo]

        /// Detailed information about a specific device model.
        internal struct DeviceInfo: Decodable, Sendable {
            /// The bezel width of the device in points.
            let bezel: Double

            /// A human-readable name of the device (e.g., "iPhone 14 Pro").
            let name: String

            /// Per-screen corner radii, present only on devices whose screens differ, such as
            /// iPhone Duo. Absent everywhere else, where `bezel` describes all four corners.
            let screens: [Screen]?

            /// The corner radii of one screen, with the device held upright.
            internal struct Screen: Decodable, Sendable {
                /// A human-readable label such as `Outer`. Informational only.
                let name: String?

                /// `UIScreen.nativeBounds` size in pixels, used to tell which screen is active.
                let nativeSize: [Double]

                /// The physical corner radii in points.
                let corners: Corners

                internal struct Corners: Decodable, Sendable {
                    let topLeft: Double
                    let topRight: Double
                    let bottomLeft: Double
                    let bottomRight: Double
                }
            }
        }
    }
}
