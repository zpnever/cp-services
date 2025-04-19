// index.ts - Socket.IO WebSocket server
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);

const io = new Server(server, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
	path: "/ws/", // path untuk nginx
});

const PORT = 41234;

const activeRooms = new Set();

io.on("connection", (socket) => {
	console.log(`✅ Socket connected: ${socket.id}`);

	socket.on("join-submission-room", ({ userId, problemId }) => {
		const roomId = `${userId}:${problemId}`;
		socket.join(roomId);
		activeRooms.add(roomId);
		console.log(`👤 User ${userId} joined room ${roomId}`);
		socket.emit("room-joined", { roomId });
	});

	socket.on("submission-log", ({ roomId, log }) => {
		io.to(roomId).emit("submission-log", { roomId, log });
	});

	socket.on("submission-result", ({ roomId, status }) => {
		io.to(roomId).emit("submission-result", { roomId, status });
	});

	socket.on("disconnect", () => {
		console.log(`❌ Socket disconnected: ${socket.id}`);
	});
});

server.listen(PORT, () => {
	console.log(`🚀 Socket.IO server running at http://localhost:${PORT}`);
});
