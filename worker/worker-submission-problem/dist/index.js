"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const processor_1 = require("./processor");
const redis_1 = require("./utils/redis");
const submissionProblemWorker = new bullmq_1.Worker("submissionProblem", async (job) => {
    return await (0, processor_1.handleSubmissionProblem)(job.data);
}, {
    connection: redis_1.redisConnection,
    // concurrency: 10 BUAT PRODUCTION
});
submissionProblemWorker.on("completed", (job) => {
    console.log(`Job ${job.id} completed successfully`);
});
submissionProblemWorker.on("failed", (job, error) => {
    console.error(`Job ${job?.id} failed:`, error);
});
console.log("🎯 Submission worker started");
