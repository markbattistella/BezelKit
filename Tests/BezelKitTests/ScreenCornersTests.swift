@testable import BezelKit
import CoreGraphics
import Foundation
import Testing

/// Corner values below were measured on an iPhone Duo (iOS 27.1) with a full-window view using
/// `UICornerConfiguration.corners(radius: .containerConcentric())`.
@Suite
struct ScreenCornersTests {
    private typealias DeviceInfo = Database.Devices.DeviceInfo

    private static let outerSize = CGSize(width: 1398, height: 2034)
    private static let innerSize = CGSize(width: 2007, height: 2853)

    private static let duo: DeviceInfo = decode(
        """
        {"bezel":59,"name":"iPhone Duo","screens":[
          {"name":"Outer","nativeSize":[1398,2034],
           "corners":{"topLeft":8,"topRight":59,"bottomLeft":8,"bottomRight":59}},
          {"name":"Inner","nativeSize":[2007,2853],
           "corners":{"topLeft":55,"topRight":55,"bottomLeft":55,"bottomRight":55}}
        ]}
        """
    )

    private static let plain: DeviceInfo = decode(#"{"bezel":62,"name":"iPhone 17 Pro"}"#)

    private static func decode(_ json: String) -> DeviceInfo {
        try! JSONDecoder().decode(DeviceInfo.self, from: Data(json.utf8))
    }

    private func expectCorners(
        _ corners: BezelCorners,
        _ tl: CGFloat,
        _ tr: CGFloat,
        _ bl: CGFloat,
        _ br: CGFloat,
        sourceLocation: SourceLocation = #_sourceLocation
    ) {
        #expect(
            corners == BezelCorners(topLeft: tl, topRight: tr, bottomLeft: bl, bottomRight: br),
            sourceLocation: sourceLocation
        )
    }

    // MARK: - Outer screen, as measured

    @Test("Outer screen, portrait")
    func outerPortrait() {
        expectCorners(Self.duo.corners(nativeSize: Self.outerSize, orientation: .portrait), 8, 59, 8, 59)
    }

    @Test("Outer screen, landscape left")
    func outerLandscapeLeft() {
        expectCorners(Self.duo.corners(nativeSize: Self.outerSize, orientation: .landscapeLeft), 8, 8, 59, 59)
    }

    @Test("Outer screen, landscape right")
    func outerLandscapeRight() {
        expectCorners(Self.duo.corners(nativeSize: Self.outerSize, orientation: .landscapeRight), 59, 59, 8, 8)
    }

    // MARK: - Inner screen

    @Test("Inner screen is uniform in every orientation")
    func innerIsUniform() {
        for orientation in [DisplayOrientation.portrait, .portraitUpsideDown, .landscapeLeft, .landscapeRight] {
            let corners = Self.duo.corners(nativeSize: Self.innerSize, orientation: orientation)
            expectCorners(corners, 55, 55, 55, 55)
            #expect(corners.isUniform)
        }
    }

    // MARK: - Screen matching

    @Test("A screen reported turned still matches")
    func matchesRegardlessOfReportedRotation() {
        let turned = CGSize(width: Self.outerSize.height, height: Self.outerSize.width)
        expectCorners(Self.duo.corners(nativeSize: turned, orientation: .portrait), 8, 59, 8, 59)
    }

    @Test("An unmatched or unknown screen falls back to the single bezel value")
    func unmatchedFallsBack() {
        expectCorners(
            Self.duo.corners(nativeSize: CGSize(width: 100, height: 200), orientation: .portrait),
            59,
            59,
            59,
            59
        )
        expectCorners(Self.duo.corners(nativeSize: nil, orientation: .landscapeLeft), 59, 59, 59, 59)
    }

    @Test("Devices without per-screen data are uniform in every orientation")
    func plainDeviceIsUniform() {
        for orientation in [DisplayOrientation.portrait, .portraitUpsideDown, .landscapeLeft, .landscapeRight] {
            expectCorners(Self.plain.corners(nativeSize: Self.outerSize, orientation: orientation), 62, 62, 62, 62)
        }
    }

    // MARK: - Rotation

    @Test("Rotating moves every corner and four quarter turns return to the start")
    func rotationIsConsistent() {
        let corners = BezelCorners(topLeft: 1, topRight: 2, bottomLeft: 3, bottomRight: 4)

        #expect(corners.rotated(for: .portrait) == corners)
        #expect(
            corners.rotated(for: .portraitUpsideDown)
                == BezelCorners(topLeft: 4, topRight: 3, bottomLeft: 2, bottomRight: 1)
        )
        #expect(
            corners.rotated(for: .landscapeLeft) == BezelCorners(topLeft: 3, topRight: 1, bottomLeft: 4, bottomRight: 2)
        )
        #expect(
            corners.rotated(for: .landscapeRight)
                == BezelCorners(topLeft: 2, topRight: 4, bottomLeft: 1, bottomRight: 3)
        )

        // Left then right cancels, and two left turns equal upside down.
        #expect(corners.rotated(for: .landscapeLeft).rotated(for: .landscapeRight) == corners)
        #expect(
            corners.rotated(for: .landscapeLeft).rotated(for: .landscapeLeft)
                == corners.rotated(for: .portraitUpsideDown)
        )
    }

    @Test("Largest and uniform")
    func largestAndUniform() {
        #expect(BezelCorners(topLeft: 8, topRight: 59, bottomLeft: 8, bottomRight: 59).largest == 59)
        #expect(!BezelCorners(topLeft: 8, topRight: 59, bottomLeft: 8, bottomRight: 59).isUniform)
        #expect(BezelCorners(uniform: 12).isUniform)
    }

    // MARK: - Shipped data

    @Test("The shipped database carries iPhone Duo's two screens")
    func shippedDuoData() throws {
        let url = try #require(Bundle.module.url(forResource: "bezel.min", withExtension: "json"))
        let database = try JSONDecoder().decode(Database.self, from: Data(contentsOf: url))
        let duo = try #require(database.devices.iPhone["iPhone19,4"])

        #expect(duo.screens?.count == 2)
        expectCorners(duo.corners(nativeSize: Self.outerSize, orientation: .portrait), 8, 59, 8, 59)
        expectCorners(duo.corners(nativeSize: Self.innerSize, orientation: .landscapeLeft), 55, 55, 55, 55)
    }
}
