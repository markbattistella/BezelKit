// swift-tools-version: 6.0

import PackageDescription

let package = Package(
    name: "BezelKit",
    platforms: [
        .iOS(.v15),
        .macOS(.v12),
        .macCatalyst(.v15),
        .tvOS(.v15),
        .watchOS(.v9),
        .visionOS(.v1),
    ],
    products: [
        .library(
            name: "BezelKit",
            targets: ["BezelKit"]
        )
    ],
    dependencies: [],
    targets: [
        .target(
            name: "BezelKit",
            exclude: ["../../Generator"],
            resources: [.process("Resources/bezel.min.json")],
            swiftSettings: [
                .swiftLanguageMode(.v6)
            ]
        ),
        .testTarget(
            name: "BezelKitTests",
            dependencies: ["BezelKit"],
            swiftSettings: [
                .swiftLanguageMode(.v6)
            ]
        ),
    ],
    swiftLanguageModes: [.v6]
)
