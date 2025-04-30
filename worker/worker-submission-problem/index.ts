import { Worker } from "bullmq";
import { handleSubmissionProblem } from "./processor";
import { redisConnection } from "./utils/redis";

const submissionProblemWorker = new Worker(
	"submissionProblem",
	async (job) => {
		return await handleSubmissionProblem(job.data);
	},
	{
		connection: redisConnection,
		// concurrency: 10 BUAT PRODUCTION
	}
);

submissionProblemWorker.on("completed", (job) => {
	console.log(`Job ${job.id} completed successfully`);
});

submissionProblemWorker.on("failed", (job, error) => {
	console.error(`Job ${job?.id} failed:`, error);
});

console.log("🎯 Submission worker started");
