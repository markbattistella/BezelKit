//
//  FetchBezel for BezelKit
//  Created by Mark Battistella
//

import SwiftUI

@main
struct MainApp: App {
	var body: some Scene {
		WindowGroup {
			MainView().onAppear { logMetrics() }
		}
	}

	/// Logs device-specific metrics such as the model name and screen radius to a text file.
	///
	/// This function gathers device metrics including the device model name and the screen's corner radius,
	/// and saves this information in a JSON-formatted string to a file named `output.txt` in the app's document directory.
	///
	/// If the function encounters any errors during the JSON serialization or file writing operations, it logs those errors 
	/// to the console and terminates the operation.
	private func logMetrics() {

		// Retrieve the device model name and screen corner radius.
		let deviceModelName = UIDevice.current.modelName
		let deviceRadius = UIScreen.main.radius

		// Create a dictionary to hold the device metrics.
		let metrics: [String: Any] = [
			"identifiers": deviceModelName,
			"bezel": deviceRadius
		]

		// Serialize the metrics dictionary to JSON data.
		let jsonData: Data
		do {
			jsonData = try JSONSerialization.data(withJSONObject: metrics, options: .prettyPrinted)
		} catch {
			print("Failed to create JSON: \(error)")
			return
		}

		// Convert the JSON data to a string.
		let jsonString = String(data: jsonData, encoding: .utf8)!

		// Create the path where the log file will be saved.
		let path = FileManager
			.default
			.urls(for: .documentDirectory, in: .userDomainMask)[0]
			.appendingPathComponent("output.json")

		// Attempt to write the JSON string to the file at the specified path.
		do {
			try jsonString.write(to: path, atomically: true, encoding: .utf8)
		} catch {
			print("Failed to write logs: \(error)")
		}
	}
}

/// `MainView` provides a detailed view of the device's properties.
///
/// This view presents a list of device-specific details such as the device's name,
/// model name, system version, and more. It utilizes the `TableRowView` to structure
/// and present each pair of title and value.
fileprivate struct MainView: View {
	var body: some View {
		VStack(alignment: .leading) {
			Text("FetchBezel")
				.font(.largeTitle)
				.fontWeight(.heavy)
				.padding(.bottom)
			TableRowView("Name", value: UIDevice.current.name)
			TableRowView("Model Name", value: UIDevice.current.modelName)
			TableRowView("Model", value: UIDevice.current.model)
			TableRowView("System Version", value: UIDevice.current.systemVersion)
			TableRowView("System name", value: UIDevice.current.systemName)
			TableRowView("Localized Model", value: UIDevice.current.localizedModel)
			TableRowView("Debug Description", value: UIDevice.current.debugDescription)
			TableRowView("Description", value: UIDevice.current.description)
		}
		.frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
		.padding()
	}

	/// A helper view function that creates a table row with a title and its associated value.
	///
	/// - Parameters:
	///   - title: The title or label for the row.
	///   - value: The value associated with the title.
	/// - Returns: A `View` representing the table row.
	private func TableRowView(_ title: String, value: String) -> some View {
		VStack(alignment: .leading) {
			Text(title)
				.fontWeight(.bold)
			Text(value)
		}
		.frame(maxWidth: .infinity, alignment: .leading)
		.padding(.bottom)
	}
}

/// An extension to `UIScreen` for retrieving the corner radius of the device's display.
fileprivate extension UIScreen {

	/// The radius of the corners of the device's display.
	/// This value is accessed through Key-Value Coding, using a private key.
	///
	/// - Returns: A `CGFloat` value representing the corner radius.
	///   If the corner radius cannot be accessed, this property returns `0`.
	var radius: CGFloat {
		let radiusKey = "_displayCornerRadius"
		guard let corner = self.value(forKey: radiusKey) as? CGFloat else {
			return 0
		}
		return corner
	}
}

/// An extension to `UIDevice` for retrieving the model name identifier of the device.
fileprivate extension UIDevice {

	/// The model name identifier of the device.
	///
	/// For real devices, this identifier is obtained by calling `uname()` function.
	/// For simulators, the identifier is read from the environment variable `SIMULATOR_MODEL_IDENTIFIER`.
	///
	/// - Returns: A `String` representing the model name identifier of the device.
	var modelName: String {

		#if targetEnvironment(simulator)

		// In the case of a simulator, read the identifier from environment variables
		let identifier = ProcessInfo().environment["SIMULATOR_MODEL_IDENTIFIER"]!

		#else

		// In the case of a real device, get the identifier using `uname()`
		var systemInfo = utsname()
		uname(&systemInfo)
		let machineMirror = Mirror(reflecting: systemInfo.machine)
		let identifier = machineMirror.children.reduce("") { identifier, element in
			guard let value = element.value as? Int8, value != 0 else { return identifier }
			return identifier + String(UnicodeScalar(UInt8(value)))
		}
		#endif

		return identifier
	}
}
