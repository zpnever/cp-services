export const codeBuilder = (
	userCode: string,
	functionName: string,
	input: string,
	languageId: string
): string => {
	const formatInput = (raw: string): string => {
		try {
			const parsed = JSON.parse(`[${raw}]`);
			return parsed
				.map((val: any) =>
					typeof val === "string" ? `"${val}"` : JSON.stringify(val)
				)
				.join(", ");
		} catch {
			return raw;
		}
	};

	const args = formatInput(input);

	switch (languageId) {
		case "15": // JavaScript
			return `${userCode}\nconsole.log(${functionName}(${args}));`;

		case "19": // Python
			return `${userCode}\nprint(${functionName}(${args}))`;

		case "22": // Ruby
			return `${userCode}\nputs ${functionName}(${args})`;

		case "6": // C
			return `
#include <stdio.h>

${userCode}

int main() {
  printf("%d\\n", ${functionName}(${args}));
  return 0;
}
`.trim();

		case "11": // C++
			return `
#include <iostream>
using namespace std;

${userCode}

int main() {
  cout << ${functionName}(${args}) << endl;
  return 0;
}
`.trim();

		case "14": // Java
			return `
public class Main {
${userCode}

public static void main(String[] args) {
  System.out.println(${functionName}(${args}));
}
}
`.trim();

		case "23": // Rust
			return `
${userCode}

fn main() {
  println!("{}", ${functionName}(${args}));
}
`.trim();

		default:
			return `${userCode} // Unknown language`;
	}
};
