import { codeBuilder } from "./utils/codeBuilder";
import { db } from "./utils/db";
import { sendToJudge0, waitForResult } from "./utils/judge0";
import workerSocket from "./workerSocket";
import { compareOutputs, normalizeOutput } from "./utils/outputNormalizer";

export type TestCase = {
	input: string;
	output: string;
};

export type SubmissionPayload = {
	teamId: string;
	contestId: string;
	code: string;
	functionName: string;
	languageId: string;
	problemId: string;
	userId: string;
	testCases: TestCase[];
};

export const handleSubmissionProblem = async (payload: SubmissionPayload) => {
	const {
		userId,
		teamId,
		contestId,
		testCases,
		code,
		problemId,
		functionName,
		languageId,
	} = payload;

	const roomId = `${userId}:${problemId}`;
	let i = 0;

	console.log("Processing submission for room:", roomId);

	// Emit initial log
	workerSocket.emit("submission-log", {
		roomId,
		log: {
			message: `Starting test execution...`,
			type: "info",
		},
	});

	let executionTime = 0;
	let memoryUsage = 0;

	for (const testCase of testCases) {
		try {
			workerSocket.emit("submission-log", {
				roomId,
				log: {
					message: `Running Test Case ${i + 1}...`,
					type: "info",
				},
			});

			const finalCode = codeBuilder(
				code,
				functionName,
				testCase.input,
				languageId
			);

			const token = await sendToJudge0(finalCode, languageId);
			const result: any = await waitForResult(token);

			const rawOutput = result.stdout?.trim() ?? "";
			const outputError = result.stderr?.trim() ?? "";
			const outputCompiler = result.compile_output?.trim() ?? "";
			const status = result.status?.id;

			if (status === 3) {
				// Normalize the output based on language and expected output format
				const normalizedOutput = normalizeOutput(
					rawOutput,
					testCase.output,
					languageId
				);

				// Use the specialized comparison function
				const outputsMatch = compareOutputs(
					rawOutput,
					testCase.output,
					languageId
				);

				if (!outputsMatch) {
					workerSocket.emit("submission-log", {
						roomId,
						log: {
							message: `❌ Test Case ${i + 1} Failed: expected ${
								testCase.output
							} but got ${normalizedOutput} (raw output: ${rawOutput})`,
							type: "error",
						},
					});

					workerSocket.emit("submission-result", {
						roomId,
						status: "failed",
					});
					return;
				}

				workerSocket.emit("submission-log", {
					roomId,
					log: {
						message: `✅ Test Case ${i + 1} Passed`,
						type: "success",
					},
				});

				memoryUsage += result.memory;
				executionTime += parseFloat(result.time);
			} else {
				if (rawOutput !== "") {
					workerSocket.emit("submission-log", {
						roomId,
						log: {
							message: `❌ Error: ${rawOutput} `,
							type: "error",
						},
					});
				} else if (outputError !== "") {
					workerSocket.emit("submission-log", {
						roomId,
						log: {
							message: `❌ Error: ${outputError} `,
							type: "error",
						},
					});
				} else {
					workerSocket.emit("submission-log", {
						roomId,
						log: {
							message: `❌ Error: ${outputCompiler} `,
							type: "error",
						},
					});
				}

				workerSocket.emit("submission-result", {
					roomId,
					status: "failed",
				});
				return;
			}

			i++;
		} catch (err: any) {
			console.error("Error processing test case:", err);
			workerSocket.emit("submission-log", {
				roomId,
				log: {
					message: `Error in test case ${i + 1}: ${
						err.message || "Unknown error"
					}`,
					type: "error",
				},
			});

			workerSocket.emit("submission-result", {
				roomId,
				status: "failed",
			});
			return;
		}
	}

	workerSocket.emit("submission-result", {
		roomId,
		status: "success",
	});

	executionTime = Number((executionTime / testCases.length).toFixed(5));
	memoryUsage = Math.floor(memoryUsage / testCases.length);

	const submissionProblem = await db.submissionProblem.findFirst({
		where: {
			teamId,
			submissionId: contestId,
			problemId,
		},
	});

	if (submissionProblem) {
		await db.submissionProblem.delete({
			where: {
				id: submissionProblem.id,
			},
		});
	}

	await db.submissionProblem.create({
		data: {
			teamId,
			submissionId: contestId,
			problemId,
			userId,
			languageId: parseInt(languageId),
			success: true,
			code,
			executionTime,
			memory: memoryUsage,
		},
	});
};
