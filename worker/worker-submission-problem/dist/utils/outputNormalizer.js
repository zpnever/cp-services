"use strict";
// outputNormalizer.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareOutputs = exports.normalizeOutput = void 0;
/**
 * Normalizes output from different programming languages to match expected output format
 */
const normalizeOutput = (output, expectedOutput, languageId) => {
    // Trim any whitespace/newlines
    output = output.trim();
    expectedOutput = expectedOutput.trim();
    // Normalize arrays
    if (expectedOutput.startsWith("[") && expectedOutput.endsWith("]")) {
        return normalizeArrayOutput(output, expectedOutput, languageId);
    }
    // Normalize booleans
    if (expectedOutput.toLowerCase() === "true" ||
        expectedOutput.toLowerCase() === "false") {
        return normalizeBooleanOutput(output, expectedOutput, languageId);
    }
    // Normalize floats
    if (!isNaN(parseFloat(expectedOutput)) && expectedOutput.includes(".")) {
        return normalizeFloatOutput(output, expectedOutput, languageId);
    }
    // Default case: return as is
    return output;
};
exports.normalizeOutput = normalizeOutput;
/**
 * Normalizes array output from different languages
 */
const normalizeArrayOutput = (output, expectedOutput, languageId) => {
    // Define language specific handling
    switch (languageId) {
        case "11": // C++
        case "1": // C
            // Might be space separated values, try to convert to array notation
            if (!output.includes("[") && !output.includes("{")) {
                const values = output.split(/\s+/).filter(Boolean);
                return `[${values.join(",")}]`;
            }
            // Handle C++ vector output format: { 1, 2, 3 }
            if (output.includes("{") && output.includes("}")) {
                return output
                    .replace(/[{}]/g, (match) => (match === "{" ? "[" : "]"))
                    .replace(/\s+/g, "");
            }
            break;
        case "14": // Java
            // Handle Java Arrays.toString() format: [1, 2, 3]
            if (output.includes("[") && output.includes("]")) {
                return output.replace(/\s+/g, "");
            }
            // Handle memory address output: [I@7ad041f3
            if (output.match(/\[.\@[a-f0-9]+/i)) {
                return "[]"; // Cannot determine actual content
            }
            break;
        case "18": // PHP
            // Handle PHP array to string conversion
            if (output.toLowerCase().includes("array")) {
                // Try to extract values if in print_r format
                const matches = output.match(/\d+\s*=>\s*([^,\n]+)/g);
                if (matches) {
                    const values = matches.map((m) => m.replace(/\d+\s*=>\s*/, "").trim());
                    return `[${values.join(",")}]`;
                }
            }
            break;
    }
    // Try to standardize array format by removing spaces
    if (output.includes("[") && output.includes("]")) {
        return output.replace(/\s+/g, "");
    }
    // If we can't normalize, return as is
    return output;
};
/**
 * Normalizes boolean output from different languages
 */
const normalizeBooleanOutput = (output, expectedOutput, languageId) => {
    const normalizedExpected = expectedOutput.toLowerCase();
    const isExpectedTrue = normalizedExpected === "true";
    // Handle language specific boolean representations
    switch (languageId) {
        case "11": // C++
        case "1": // C
            // C/C++ represent true as 1, false as 0
            if (output === "1")
                return "true";
            if (output === "0")
                return "false";
            break;
        case "19": // Python
            // Python uses capitalized True/False
            if (output.toLowerCase() === "true")
                return "true";
            if (output.toLowerCase() === "false")
                return "false";
            break;
        case "18": // PHP
            // PHP outputs "1" for true, "" (empty) for false
            if (output === "1")
                return "true";
            if (output === "" || output === "0")
                return "false";
            break;
    }
    // Default case - normalize to lowercase
    return output.toLowerCase();
};
/**
 * Normalizes floating point output from different languages
 */
const normalizeFloatOutput = (output, expectedOutput, languageId) => {
    // Get expected precision (number of digits after decimal point)
    const expectedDecimalParts = expectedOutput.split(".");
    const expectedPrecision = expectedDecimalParts.length > 1 ? expectedDecimalParts[1].length : 0;
    try {
        // Parse output as float
        const outputFloat = parseFloat(output);
        // Format to match expected precision
        return outputFloat.toFixed(expectedPrecision);
    }
    catch (e) {
        // If parsing fails, return original output
        return output;
    }
};
/**
 * Compares output with expected output considering language specificities
 */
const compareOutputs = (output, expectedOutput, languageId) => {
    const normalizedOutput = (0, exports.normalizeOutput)(output, expectedOutput, languageId);
    // For arrays, perform deeper comparison
    if (expectedOutput.startsWith("[") && expectedOutput.endsWith("]")) {
        try {
            // Parse arrays and compare their contents
            const expectedArray = JSON.parse(expectedOutput);
            const outputArray = JSON.parse(normalizedOutput);
            if (Array.isArray(expectedArray) && Array.isArray(outputArray)) {
                if (expectedArray.length !== outputArray.length)
                    return false;
                for (let i = 0; i < expectedArray.length; i++) {
                    // Handle primitive values
                    if (expectedArray[i] !== outputArray[i])
                        return false;
                }
                return true;
            }
        }
        catch (e) {
            // If parsing fails, fall back to string comparison
        }
    }
    // For simple values, direct comparison after normalization
    return normalizedOutput === expectedOutput;
};
exports.compareOutputs = compareOutputs;
