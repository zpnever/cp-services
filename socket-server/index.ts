// index.ts - Socket Server
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = createServer(app);
const io = new Server(server, {
	cors: {
		origin: "*",
	},
});

const PORT = 3001;

// Track active rooms for debugging
const activeRooms = new Set();

io.on("connection", (socket) => {
	console.log(`Socket connected: ${socket.id}`);

	// Join room
	socket.on("join-submission-room", ({ userId, problemId }) => {
		const roomId = `${userId}:${problemId}`;
		socket.join(roomId);
		activeRooms.add(roomId);
		console.log(`User ${userId} joined room ${roomId}`);
		console.log(`Active rooms: ${Array.from(activeRooms)}`);

		// Send confirmation back to client
		socket.emit("room-joined", { roomId });
	});

	// Handle log relay (from worker or any source)
	socket.on("submission-log", ({ roomId, log }) => {
		console.log(`Relaying log to room ${roomId}:`, log);
		io.to(roomId).emit("submission-log", { roomId, log });
	});

	socket.on("submission-result", ({ roomId, status }) => {
		console.log(`Relaying result to room ${roomId}:`, status);
		io.to(roomId).emit("submission-result", { roomId, status });
	});

	// // Join team room
	// socket.on("join-team-room", ({ teamId, contestId }) => {
	// 	const roomId = `${teamId}:${contestId}`;
	// 	socket.join(roomId);
	// 	activeRooms.add(roomId);
	// 	console.log(`Team ${teamId} joined room ${roomId}`);
	// 	console.log(`Active rooms: ${Array.from(activeRooms)}`);

	// 	// Send confirmation back
	// 	socket.emit("team-room-joined", { roomId });
	// });

	// // Locked Problem
	// socket.on(
	// 	"locked-problem-update",
	// 	({ teamId, contestId, lockedProblems }) => {
	// 		const roomId = `${teamId}:${contestId}`;
	// 		io.to(roomId).emit("locked-problem-update", { lockedProblems });
	// 	}
	// );

	// // Finish
	// socket.on("finish-status-update", ({ teamId, contestId, finishedUsers }) => {
	// 	const roomId = `${teamId}:${contestId}`;
	// 	io.to(roomId).emit("finish-status-update", { finishedUsers });
	// });

	socket.on("disconnect", () => {
		console.log(`Socket disconnected: ${socket.id}`);
	});
});

server.listen(PORT, () => {
	console.log(`🚀 Socket.IO server running at http://localhost:${PORT}`);
});

// Export the IO instance for direct use in other server files
export { io as serverIO };
