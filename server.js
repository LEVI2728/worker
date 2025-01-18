const express = require("express");
const { Server } = require("socket.io");
const http = require("http");
const Redis = require("ioredis");
const queueProcessor = require("./services/queueProcessor");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
const redis = new Redis();

// WebSocket Handler
io.on("connection", (socket) => {
	const { sessionId } = socket.handshake.query;
	socket.sessionId = sessionId;
	console.log(
		`User connected: sessionId: ${sessionId}, socketId: ${socket.id}`
	);

	socket.on("disconnect", () => {
		console.log(
			`User disconnected: sessionId: ${sessionId}, socketId: ${socket.id}`
		);
	});
});

// Started 3 workers
for (let i = 1; i <= 3; i++) {
	console.log(`STARTED WORKER ${i}`);
	queueProcessor.startProcessingQueue(redis, io);
}

// Server Start
server.listen(8000, () => {
	console.log("Server running on http://localhost:8000");
});
