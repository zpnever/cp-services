export const codeBuilder = (
	userCode: string,
	functionName: string,
	input: string,
	languageId: string
): string => {
	// Helper function to detect if a value is an array
	const isArray = (value: any): boolean => {
		return (
			Array.isArray(value) ||
			(typeof value === "string" &&
				value.trim().startsWith("[") &&
				value.trim().endsWith("]"))
		);
	};

	// Helper function to detect if a value is an object
	const isObject = (value: any): boolean => {
		return (
			typeof value === "object" &&
			value !== null &&
			!Array.isArray(value) &&
			!(value instanceof Date)
		);
	};

	// Format individual argument based on type and target language
	const formatArgument = (arg: any, languageId: string): string => {
		// Helper function code remains unchanged...
		// Handle null and undefined
		if (arg === null) {
			switch (languageId) {
				case "15":
					return "null"; // JavaScript
				case "19":
					return "None"; // Python
				case "22":
					return "nil"; // Ruby
				case "18":
					return "null"; // PHP
				case "11":
					return "nullptr"; // C++
				case "14":
					return "null"; // Java
				case "23":
					return "None"; // Rust
				default:
					return "null";
			}
		}

		if (arg === undefined) {
			switch (languageId) {
				case "15":
					return "undefined"; // JavaScript
				case "19":
					return "None"; // Python
				case "22":
					return "nil"; // Ruby
				case "18":
					return "null"; // PHP
				default:
					return "null"; // Default for languages without undefined
			}
		}

		// Handle arrays
		if (isArray(arg)) {
			let arrayData = Array.isArray(arg) ? arg : JSON.parse(arg);

			// Empty array handling
			if (arrayData.length === 0) {
				switch (languageId) {
					case "15":
						return "[]"; // JavaScript
					case "19":
						return "[]"; // Python
					case "22":
						return "[]"; // Ruby
					case "18":
						return "array()"; // PHP
					case "11":
						return "{}"; // C++
					case "14":
						return "new int[0]"; // Java
					case "23":
						return "vec![]"; // Rust
					default:
						return "[]";
				}
			}

			// Determine element type - assume homogeneous arrays
			const firstElement = arrayData[0];
			const elementType = typeof firstElement;

			// Format array elements
			const elements = arrayData
				.map((e: any) =>
					typeof e === "string"
						? `"${e.replace(/"/g, '\\"')}"`
						: typeof e === "object"
						? formatArgument(e, languageId)
						: String(e)
				)
				.join(", ");

			switch (languageId) {
				case "15": // JavaScript
					return `[${elements}]`;
				case "19": // Python
					return `[${elements}]`;
				case "22": // Ruby
					return `[${elements}]`;
				case "18": // PHP
					return `array(${elements})`;
				case "11": // C++
					if (elementType === "number") {
						return `{${elements}}`;
					}
					return `std::vector<int>{${elements}}`;
				case "14": // Java
					if (elementType === "number") {
						if (Number.isInteger(firstElement)) {
							return `new int[]{${elements}}`;
						} else {
							return `new double[]{${elements}}`;
						}
					} else if (elementType === "string") {
						return `new String[]{${elements}}`;
					} else if (elementType === "boolean") {
						return `new boolean[]{${elements}}`;
					}
					return `"Array conversion not supported"`;
				case "23": // Rust
					if (elementType === "number") {
						if (Number.isInteger(firstElement)) {
							return `vec![${elements}]`;
						} else {
							return `vec![${elements}]`;
						}
					} else if (elementType === "string") {
						return `vec![${elements}]`;
					} else if (elementType === "boolean") {
						return `vec![${elements}]`;
					}
					return `vec![${elements}]`;
				default:
					return `[${elements}]`;
			}
		}

		// Handle objects
		if (isObject(arg)) {
			switch (languageId) {
				case "15": // JavaScript
					return JSON.stringify(arg);
				case "19": // Python
					// Convert to Python dict syntax
					return JSON.stringify(arg)
						.replace(/"(\w+)":/g, "$1:")
						.replace(/true/g, "True")
						.replace(/false/g, "False")
						.replace(/null/g, "None");
				case "18": // PHP
					// Convert to PHP associative array syntax
					let phpArray = [];
					for (const key in arg) {
						if (Object.prototype.hasOwnProperty.call(arg, key)) {
							const value = arg[key];
							if (typeof value === "string") {
								phpArray.push(`"${key}" => "${value}"`);
							} else if (typeof value === "number") {
								phpArray.push(`"${key}" => ${value}`);
							} else if (typeof value === "boolean") {
								phpArray.push(`"${key}" => ${value ? "true" : "false"}`);
							} else if (value === null) {
								phpArray.push(`"${key}" => null`);
							} else if (isArray(value)) {
								phpArray.push(
									`"${key}" => ${formatArgument(value, languageId)}`
								);
							} else if (isObject(value)) {
								phpArray.push(
									`"${key}" => ${formatArgument(value, languageId)}`
								);
							}
						}
					}
					return `array(${phpArray.join(", ")})`;
				case "22": // Ruby
					// Convert to Ruby hash syntax
					return JSON.stringify(arg)
						.replace(/{/g, "{")
						.replace(/}/g, "}")
						.replace(/"(\w+)":/g, "$1: ")
						.replace(/true/g, "true")
						.replace(/false/g, "false")
						.replace(/null/g, "nil");
				default:
					return `"Object conversion not supported in this language"`;
			}
		}

		// Handle primitive types
		if (typeof arg === "string") {
			return `"${arg.replace(/"/g, '\\"')}"`;
		}

		if (typeof arg === "boolean") {
			switch (languageId) {
				case "15":
					return arg ? "true" : "false"; // JavaScript
				case "19":
					return arg ? "True" : "False"; // Python
				case "22":
					return arg ? "true" : "false"; // Ruby
				case "18":
					return arg ? "true" : "false"; // PHP
				case "11":
					return arg ? "true" : "false"; // C++ with bool
				case "14":
					return arg ? "true" : "false"; // Java
				case "23":
					return arg ? "true" : "false"; // Rust
				default:
					return arg ? "true" : "false";
			}
		}

		// Numbers and default case
		return String(arg);
	};

	// Parse input into array of arguments
	const parseInput = (raw: string): any[] => {
		try {
			return Function(`return [${raw}]`)();
		} catch (e) {
			// If parsing fails, return the raw string as a single argument
			return [raw];
		}
	};

	// Format all arguments
	const parsedArgs = parseInput(input);
	const formattedArgs = parsedArgs
		.map((arg) => formatArgument(arg, languageId))
		.join(", ");

	// Generate language-specific code with consistent output formatting
	switch (languageId) {
		case "15": // JavaScript
			return `// JavaScript with modern features
${userCode}

console.log(${functionName}(${formattedArgs}));`;

		case "19": // Python
			return `# Python with common libraries
import math
import collections
import itertools
import heapq
import re
import functools
import bisect
from typing import List, Dict, Tuple, Set, Optional

${userCode}

print(${functionName}(${formattedArgs}))`;

		case "22": // Ruby
			return `# Ruby with common libraries
require 'set'
require 'json'
require 'prime'
require 'date'

${userCode}

puts ${functionName}(${formattedArgs})`;

		case "18": // PHP
			return `<?php
// PHP with common functions available
${userCode}

echo ${functionName}(${formattedArgs});
?>`;

		case "11": // C++
			return `
#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <array>
#include <algorithm>
#include <cmath>
#include <map>
#include <set>
#include <unordered_map>
#include <unordered_set>
#include <queue>
#include <stack>
#include <deque>
#include <list>
#include <tuple>
#include <numeric>
#include <functional>
#include <utility>
#include <bitset>
#include <iomanip>
#include <climits>
#include <cfloat>
#include <random>
#include <chrono>
#include <type_traits>
using namespace std;

${userCode}

// Helper function to print arrays consistently
template <typename T>
void printArray(const vector<T>& arr) {
    cout << "[";
    for (size_t i = 0; i < arr.size(); i++) {
        cout << arr[i];
        if (i < arr.size() - 1) cout << ",";
    }
    cout << "]";
}

template <typename T, size_t N>
void printArray(const array<T, N>& arr) {
    cout << "[";
    for (size_t i = 0; i < arr.size(); i++) {
        cout << arr[i];
        if (i < arr.size() - 1) cout << ",";
    }
    cout << "]";
}

// Helper function to print raw arrays
template <typename T>
void printArray(const T* arr, size_t size) {
    cout << "[";
    for (size_t i = 0; i < size; i++) {
        cout << arr[i];
        if (i < size - 1) cout << ",";
    }
    cout << "]";
}

// Helper function to format output consistently
template <typename T>
void printOutput(const T& result) {
    // Handle common STL containers
    if constexpr (is_same<T, vector<int>>::value || 
                  is_same<T, vector<double>>::value ||
                  is_same<T, vector<float>>::value ||
                  is_same<T, vector<string>>::value ||
                  is_same<T, vector<bool>>::value) {
        printArray(result);
    }
    else if constexpr (is_same<T, bool>::value) {
        // For boolean values, output true/false as string
        // This will be normalized by the outputNormalizer
        cout << (result ? "true" : "false");
    }
    else {
        cout << result;
    }
}

int main() {
    auto result = ${functionName}(${formattedArgs});
    printOutput(result);
    cout << endl;
    return 0;
}
`.trim();

		case "14": // Java
			return `
import java.util.*;
import java.io.*;
import java.math.*;
import java.text.*;
import java.time.*;
import java.util.stream.*;
import java.util.function.*;
import java.util.regex.*;

public class Main {
${userCode}

    // Helper method to format array output consistently
    private static String formatArray(Object arr) {
        if (arr == null) return "null";
        
        if (arr instanceof int[]) {
            int[] array = (int[])arr;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < array.length; i++) {
                sb.append(array[i]);
                if (i < array.length - 1) sb.append(",");
            }
            sb.append("]");
            return sb.toString();
        }
        else if (arr instanceof double[]) {
            double[] array = (double[])arr;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < array.length; i++) {
                sb.append(array[i]);
                if (i < array.length - 1) sb.append(",");
            }
            sb.append("]");
            return sb.toString();
        }
        else if (arr instanceof String[]) {
            String[] array = (String[])arr;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < array.length; i++) {
                sb.append("\\\"").append(array[i]).append("\\\"");
                if (i < array.length - 1) sb.append(",");
            }
            sb.append("]");
            return sb.toString();
        }
        else if (arr instanceof boolean[]) {
            boolean[] array = (boolean[])arr;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < array.length; i++) {
                sb.append(array[i]);
                if (i < array.length - 1) sb.append(",");
            }
            sb.append("]");
            return sb.toString();
        }
        
        return arr.toString();
    }

    public static void main(String[] args) {
        Object result = ${functionName}(${formattedArgs});
        
        if (result != null && result.getClass().isArray()) {
            System.out.println(formatArray(result));
        } 
        else if (result instanceof Boolean) {
            // For boolean values, output true/false as string
            System.out.println(result);
        }
        else {
            System.out.println(result);
        }
    }
}`.trim();

		case "1": // C
			return `
#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>
#include <string.h>
#include <math.h>
#include <limits.h>
#include <float.h>
#include <ctype.h>
#include <time.h>

${userCode}

// Helper function to print arrays consistently
void printIntArray(int* arr, int size) {
    printf("[");
    for (int i = 0; i < size; i++) {
        printf("%d", arr[i]);
        if (i < size - 1) printf(",");
    }
    printf("]");
}

void printFloatArray(float* arr, int size) {
    printf("[");
    for (int i = 0; i < size; i++) {
        printf("%g", arr[i]);
        if (i < size - 1) printf(",");
    }
    printf("]");
}

int main() {
    // Calling the function with provided arguments
    // Note: For C, we'll need to handle the output based on the return type
    // This is a simplified implementation
    
    // For the most common case of returning a single value
    auto result = ${functionName}(${formattedArgs});
    
    // Handle different return types - this is simplified
    // You'll need to adjust based on the actual return type
    if (sizeof(result) == sizeof(bool)) {
        printf("%s", result ? "true" : "false");
    } else {
        printf("%g", result);  // Works for both int and float/double
    }
    
    printf("\\n");
    return 0;
}`.trim();

		case "23": // Rust
			return `
use std::collections::*;
use std::cmp::{min, max, Ordering};
use std::io::{self, Read, Write};
use std::iter::*;
use std::str::*;
use std::vec::*;
use std::fmt::{self, Display};
use std::ops::*;

${userCode}

fn print_array<T: std::fmt::Display>(arr: &[T]) {
    print!("[");
    for (i, item) in arr.iter().enumerate() {
        print!("{}", item);
        if i < arr.len() - 1 {
            print!(",");
        }
    }
    print!("]");
}

fn main() {
    let result = ${functionName}(${formattedArgs});
    
    // Handle different return types
    // For Vec/arrays
    if let Some(arr) = (&result as &dyn std::any::Any).downcast_ref::<Vec<i32>>() {
        print_array(arr);
    } else if let Some(arr) = (&result as &dyn std::any::Any).downcast_ref::<Vec<f64>>() {
        print_array(arr);
    } else if let Some(arr) = (&result as &dyn std::any::Any).downcast_ref::<Vec<&str>>() {
        print_array(arr);
    } else if let Some(arr) = (&result as &dyn std::any::Any).downcast_ref::<Vec<String>>() {
        print_array(arr);
    } else if let Some(b) = (&result as &dyn std::any::Any).downcast_ref::<bool>() {
        // For boolean values, output true/false as string
        print!("{}", b);
    } else {
        // Default case - use debug format
        print!("{:?}", result);
    }
    
    println!();
}`.trim();

		default:
			return `${userCode}
console.log(${functionName}(${formattedArgs}));`;
	}
};
