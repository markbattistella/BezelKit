//
// Project: BezelKit
// Author: Mark Battistella
// Website: https://markbattistella.com
//

import Foundation

extension DeviceBezel {

    /// Converts `DecodingError` to the corresponding `DeviceBezelError`.
    ///
    /// This function aids in interpreting and presenting more user-friendly error messages
    /// based on the underlying decoding error.
    ///
    /// - Parameter error: The `DecodingError` to be converted.
    ///
    /// - Returns: The corresponding `DeviceBezelError` based on the provided `DecodingError`.
    static func handleDecodingError(_ error: DecodingError) -> DeviceBezelError {
        switch error {

            case let .dataCorrupted(context):
                // Indicates that data is corrupted or otherwise invalid for the associated type.
                return .dataParsingFailed(context.debugDescription)

            case let .keyNotFound(key, context):
                // Indicates that a required key was not found in the data.
                return .dataParsingFailed("Key '\(key)' not found: \(context.debugDescription)")

            case let .valueNotFound(value, context):
                // Indicates that a required value of a certain type was not found at the expected
                // place in the data.
                return .dataParsingFailed("Value '\(value)' not found: \(context.debugDescription)")

            case let .typeMismatch(type, context):
                // Indicates that encountered data was not of the expected type.
                return .dataParsingFailed("Type '\(type)' mismatch: \(context.debugDescription)")

            @unknown default:
                // Catches any unknown or future error variants of DecodingError.
                return .dataParsingFailed("Unknown DecodingError encountered.")
        }
    }
}
