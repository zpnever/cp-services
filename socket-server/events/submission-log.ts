import { Socket } from "socket.io";
import { Redis } from "ioredis";

export function handleSubmissionLog(socket: Socket, redis: Redis) {
	socket.on("join-log-room", (roomId: string) => {
		socket.join(roomId);
		console.log(`🧩 Client joined log room: ${roomId}`);
	});
}
