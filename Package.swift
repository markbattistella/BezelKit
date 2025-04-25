// swift-tools-version: 5.10

import PackageDescription

let package = Package(
	name: "BezelKit",
	platforms: [.iOS(.v12)],
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
