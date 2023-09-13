// swift-tools-version: 5.4

import PackageDescription

let package = Package(
    name: "BezelKit",
	platforms: [.iOS(.v11)],
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
			resources: [
				.copy("Resources/bezel.min.json")
			]
		)
	]
)
