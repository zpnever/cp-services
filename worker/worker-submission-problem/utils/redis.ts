import "dotenv/config";

export const redisConnection = {
	host: process.env.REDIS_HOST || "localhost",
	port: Number(process.env.REDIS_PORT) || 6380,
	password: process.env.REDIS_PASSWORD || undefined,
	maxRetriesPerRequest: null,
};
