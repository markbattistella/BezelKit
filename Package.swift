// swift-tools-version: 5.4

import PackageDescription

let package = Package(
    name: "BezelKit",
	platforms: [
		.iOS(.v11),
		.watchOS(.v4)
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
			exclude: ["../Generator"],
			resources: [.copy("Resources/bezel-data-min.json")]
		)
	]
)
