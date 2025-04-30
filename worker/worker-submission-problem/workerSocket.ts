import { io } from "socket.io-client";
import "dotenv/config";

const workerSocket = io(process.env.SOCKET_URL || "wss://inacomp.site", {
	// path: "/ws/",
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

export default workerSocket;
