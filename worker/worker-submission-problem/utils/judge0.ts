import "dotenv/config";

const urlJudge0 = "http://103.185.52.228:2358";

export async function sendToJudge0(code: string, langId: string) {
	const res = await fetch(
		`${urlJudge0}/submissions/?base64_encoded=false&wait=false`,
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				source_code: code,
				language_id: Number(langId),
				stdin: "",
			}),
		}
	);

	const json = await res.json();
	return json.token;
}

export async function waitForResult(token: string) {
	let status = 1;
	let result = null;

	while (status === 1 || status === 2) {
		const res = await fetch(
			`${urlJudge0}/submissions/${token}?base64_encoded=false`
		);
		const data = await res.json();
		result = data;
		status = data.status.id;

		if (status === 1 || status === 2) {
			await new Promise((r) => setTimeout(r, 1000));
		}
	}

	return result;
}

export const waitForResult2 = async (token: string) => {
	let status = "";
	let result = null;

	while (true) {
		const res = await fetch(
			`${urlJudge0}/submissions/${token}?base64_encoded=false`
		);
		const data = await res.json();

		if (!data || !data.status) {
			throw new Error(
				"❌ Tidak ada response atau status tidak valid dari Judge0."
			);
		}

		status = data.status.description;
		result = data;

		if (status === "In Queue" || status === "Processing") {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			continue;
		}

		if (data.stderr) {
			throw new Error(`🚨 Runtime Error:\n${data.stderr}`);
		}

		if (data.compile_output) {
			throw new Error(`🚨 Compilation Error:\n${data.compile_output}`);
		}

		if (!data.stdout) {
			throw new Error("❗ Output kosong atau fungsi tidak ditemukan.");
		}

		return data;
	}
};
