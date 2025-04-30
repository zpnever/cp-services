"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisConnection = void 0;
require("dotenv/config");
exports.redisConnection = {
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6380,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
};
