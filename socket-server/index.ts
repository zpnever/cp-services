// index.ts - Secure Socket Server (HTTPS + WSS)
import express from "express";
import { Server } from "socket.io";
import https from "https";
import fs from "fs";
import path from "path";
import cors from "cors";

const app = express();
app.use(cors());

// Ganti ini dengan lokasi sertifikat dari Let's Encrypt
const sslOptions = {
	key: fs.readFileSync("/etc/letsencrypt/live/inacomp.site/privkey.pem"),
	cert: fs.readFileSync("/etc/letsencrypt/live/inacomp.site/fullchain.pem"),
};

const server = https.createServer(sslOptions, app);

const io = new Server(server, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
});

const PORT = 41234;
const activeRooms = new Set();

io.on("connection", (socket) => {
	console.log(`Socket connected: ${socket.id}`);

	socket.on("join-submission-room", ({ userId, problemId }) => {
		const roomId = `${userId}:${problemId}`;
		socket.join(roomId);
		activeRooms.add(roomId);
		console.log(`User ${userId} joined room ${roomId}`);
		console.log(`Active rooms: ${Array.from(activeRooms)}`);
		socket.emit("room-joined", { roomId });
	});

	socket.on("submission-log", ({ roomId, log }) => {
		console.log(`Relaying log to room ${roomId}:`, log);
		io.to(roomId).emit("submission-log", { roomId, log });
	});

	socket.on("submission-result", ({ roomId, status }) => {
		console.log(`Relaying result to room ${roomId}:`, status);
		io.to(roomId).emit("submission-result", { roomId, status });
	});

	socket.on("disconnect", () => {
		console.log(`Socket disconnected: ${socket.id}`);
	});
});

server.listen(PORT, () => {
	console.log(
		`🚀 Secure Socket.IO server running at https://localhost:${PORT}`
	);
});
