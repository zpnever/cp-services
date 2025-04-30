"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_client_1 = require("socket.io-client");
require("dotenv/config");
const workerSocket = (0, socket_io_client_1.io)(process.env.SOCKET_URL || "wss://cp.inacomp.site", {
    path: "/ws/",
    reconnection: true,
    reconnectionAttempts: Infinity,
    transports: ["websocket"],
});
workerSocket.on("connect", () => {
    console.log(`Worker socket connected with ID: ${workerSocket.id}`);
});
workerSocket.on("disconnect", () => {
    console.log("Worker socket disconnected, will attempt to reconnect");
});
workerSocket.on("connect_error", (error) => {
    console.error("Worker socket connection error:", error);
});
exports.default = workerSocket;
