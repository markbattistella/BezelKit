//
// Project: BezelKit
// Author: Mark Battistella
// Website: https://markbattistella.com
//

import CoreGraphics

/// The corner radii of the display, one per corner, in points.
///
/// Almost every device has four identical corners. Multi-screen devices such as iPhone Duo do
/// not: the outer screen is tight on one edge and round on the other, and the inner screen
/// differs again. The corners are named for what you see on screen, so a value stays on the
/// same side of your interface whatever the layout direction.
public struct BezelCorners: Sendable, Equatable {

  /// The top left corner radius.
  public var topLeft: CGFloat

  /// The top right corner radius.
  public var topRight: CGFloat

  /// The bottom left corner radius.
  public var bottomLeft: CGFloat

  /// The bottom right corner radius.
  public var bottomRight: CGFloat

  /// Creates corners with an individual radius for each.
  public init(topLeft: CGFloat, topRight: CGFloat, bottomLeft: CGFloat, bottomRight: CGFloat) {
    self.topLeft = topLeft
    self.topRight = topRight
    self.bottomLeft = bottomLeft
    self.bottomRight = bottomRight
  }

  /// Creates corners that all share one radius.
  public init(uniform radius: CGFloat) {
    self.init(topLeft: radius, topRight: radius, bottomLeft: radius, bottomRight: radius)
  }

  /// The largest of the four radii. This is what ``CoreGraphics/CGFloat/deviceBezel`` returns.
  public var largest: CGFloat {
    max(topLeft, topRight, bottomLeft, bottomRight)
  }

  /// Whether all four corners share one radius.
  public var isUniform: Bool {
    topLeft == topRight && topRight == bottomLeft && bottomLeft == bottomRight
  }
}

// MARK: - Orientation

/// The way the interface is turned relative to the hardware, independent of UIKit so the
/// resolution logic can run and be tested on any platform.
internal enum DisplayOrientation: Sendable {
  case portrait
  case portraitUpsideDown
  case landscapeLeft
  case landscapeRight
}

extension BezelCorners {

  /// Moves hardware corners, stored with the device held upright, to where they appear in the
  /// interface for the given orientation.
  ///
  /// The radii belong to the glass, so turning the interface moves them rather than changing
  /// them. `landscapeLeft` is the upright device turned a quarter clockwise and
  /// `landscapeRight` a quarter anticlockwise, matching `UIInterfaceOrientation`.
  internal func rotated(for orientation: DisplayOrientation) -> BezelCorners {
    switch orientation {
    case .portrait:
      return self
    case .portraitUpsideDown:
      return BezelCorners(
        topLeft: bottomRight, topRight: bottomLeft, bottomLeft: topRight, bottomRight: topLeft)
    case .landscapeLeft:
      return BezelCorners(
        topLeft: bottomLeft, topRight: topLeft, bottomLeft: bottomRight, bottomRight: topRight)
    case .landscapeRight:
      return BezelCorners(
        topLeft: topRight, topRight: bottomRight, bottomLeft: topLeft, bottomRight: bottomLeft)
    }
  }
}

// MARK: - Resolving a device's corners

extension Database.Devices.DeviceInfo {

  /// The corners for this device on the screen of the given native pixel size.
  ///
  /// Devices without per-screen data, and screens that cannot be matched, resolve to `bezel`
  /// on every corner.
  ///
  /// - Parameters:
  ///   - nativeSize: `UIScreen.nativeBounds.size` of the active screen. Compared by its shorter
  ///   and longer side, so it does not matter whether the system reports it turned.
  ///   - orientation: The current interface orientation.
  internal func corners(nativeSize: CGSize?, orientation: DisplayOrientation) -> BezelCorners {
    let uniform = BezelCorners(uniform: CGFloat(bezel))

    guard let screens, !screens.isEmpty, let nativeSize else { return uniform }

    let target = (min(nativeSize.width, nativeSize.height), max(nativeSize.width, nativeSize.height))
    let match = screens.first { screen in
      guard screen.nativeSize.count == 2 else { return false }
      let size = (min(screen.nativeSize[0], screen.nativeSize[1]), max(screen.nativeSize[0], screen.nativeSize[1]))
      return abs(size.0 - Double(target.0)) < 1 && abs(size.1 - Double(target.1)) < 1
    }

    guard let match else { return uniform }

    let hardware = BezelCorners(
      topLeft: CGFloat(match.corners.topLeft),
      topRight: CGFloat(match.corners.topRight),
      bottomLeft: CGFloat(match.corners.bottomLeft),
      bottomRight: CGFloat(match.corners.bottomRight)
    )
    return hardware.rotated(for: orientation)
  }
}
