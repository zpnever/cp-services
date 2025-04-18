import { io } from "socket.io-client";

const workerSocket = io("wss://inacomp.site/ws", {
	reconnection: true,
	reconnectionAttempts: Infinity,
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
