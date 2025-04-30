"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleSubmissionProblem = void 0;
const codeBuilder_1 = require("./utils/codeBuilder");
const db_1 = require("./utils/db");
const judge0_1 = require("./utils/judge0");
const workerSocket_1 = __importDefault(require("./workerSocket"));
const outputNormalizer_1 = require("./utils/outputNormalizer");
const handleSubmissionProblem = async (payload) => {
    const { userId, teamId, contestId, testCases, code, problemId, functionName, languageId, } = payload;
    const roomId = `${userId}:${problemId}`;
    let i = 0;
    console.log("Processing submission for room:", roomId);
    // Emit initial log
    workerSocket_1.default.emit("submission-log", {
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
            workerSocket_1.default.emit("submission-log", {
                roomId,
                log: {
                    message: `Running Test Case ${i + 1}...`,
                    type: "info",
                },
            });
            const finalCode = (0, codeBuilder_1.codeBuilder)(code, functionName, testCase.input, languageId);
            console.log(finalCode);
            const token = await (0, judge0_1.sendToJudge0)(finalCode, languageId);
            const result = await (0, judge0_1.waitForResult)(token);
            const rawOutput = result.stdout?.trim() ?? "";
            const outputError = result.stderr?.trim() ?? "";
            const outputCompiler = result.compile_output?.trim() ?? "";
            const status = result.status?.id;
            if (status === 3) {
                // Normalize the output based on language and expected output format
                const normalizedOutput = (0, outputNormalizer_1.normalizeOutput)(rawOutput, testCase.output, languageId);
                // Use the specialized comparison function
                const outputsMatch = (0, outputNormalizer_1.compareOutputs)(rawOutput, testCase.output, languageId);
                if (!outputsMatch) {
                    workerSocket_1.default.emit("submission-log", {
                        roomId,
                        log: {
                            message: `❌ Test Case ${i + 1} Failed: expected ${testCase.output} but got ${normalizedOutput} (raw output: ${rawOutput})`,
                            type: "error",
                        },
                    });
                    workerSocket_1.default.emit("submission-result", {
                        roomId,
                        status: "failed",
                    });
                    return;
                }
                workerSocket_1.default.emit("submission-log", {
                    roomId,
                    log: {
                        message: `✅ Test Case ${i + 1} Passed`,
                        type: "success",
                    },
                });
                memoryUsage += result.memory;
                executionTime += parseFloat(result.time);
            }
            else {
                if (rawOutput !== "") {
                    workerSocket_1.default.emit("submission-log", {
                        roomId,
                        log: {
                            message: `❌ Error: ${rawOutput} `,
                            type: "error",
                        },
                    });
                }
                else if (outputError !== "") {
                    workerSocket_1.default.emit("submission-log", {
                        roomId,
                        log: {
                            message: `❌ Error: ${outputError} `,
                            type: "error",
                        },
                    });
                }
                else {
                    workerSocket_1.default.emit("submission-log", {
                        roomId,
                        log: {
                            message: `❌ Error: ${outputCompiler} `,
                            type: "error",
                        },
                    });
                }
                workerSocket_1.default.emit("submission-result", {
                    roomId,
                    status: "failed",
                });
                return;
            }
            i++;
        }
        catch (err) {
            console.error("Error processing test case:", err);
            workerSocket_1.default.emit("submission-log", {
                roomId,
                log: {
                    message: `Error in test case ${i + 1}: ${err.message || "Unknown error"}`,
                    type: "error",
                },
            });
            workerSocket_1.default.emit("submission-result", {
                roomId,
                status: "failed",
            });
            return;
        }
    }
    workerSocket_1.default.emit("submission-result", {
        roomId,
        status: "success",
    });
    executionTime = Number((executionTime / testCases.length).toFixed(5));
    memoryUsage = Math.floor(memoryUsage / testCases.length);
    const submissionProblem = await db_1.db.submissionProblem.findFirst({
        where: {
            teamId,
            submissionId: contestId,
            problemId,
        },
    });
    if (submissionProblem) {
        await db_1.db.submissionProblem.delete({
            where: {
                id: submissionProblem.id,
            },
        });
    }
    await db_1.db.submissionProblem.create({
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
exports.handleSubmissionProblem = handleSubmissionProblem;
