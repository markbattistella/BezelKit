// swift-tools-version: 5.10

import PackageDescription

let package = Package(
    name: "BezelKit",
    platforms: [
        .iOS(.v12),
        .macOS(.v10_13),
        .macCatalyst(.v13),
        .tvOS(.v12),
        .watchOS(.v4),
        .visionOS(.v1)
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
                .enableExperimentalFeature("StrictConcurrency")
            ]
        )
    ]
)
