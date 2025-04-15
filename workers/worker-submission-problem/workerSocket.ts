import { io } from "socket.io-client";

// Create a single, persistent worker socket client
// const workerSocket = io("http://localhost:3001", {
// 	reconnection: true,
// 	reconnectionAttempts: Infinity,
// });
const workerSocket = io("http://103.87.66.7:3001", {
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
