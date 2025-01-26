// const { Worker } = require("bullmq");
// const mongoose = require("mongoose");
// const Job = require("./Job");
// const fs = require("fs");
// const dotenv = require("dotenv");
// dotenv.config({ path: "./.env" });

// mongoose
// 	// .connect("mongodb://host.docker.internal:27017/codedecode")
// 	.connect(process.env.MONGO_LOCAL)
// 	.then(console.log("Connected to Mongo"))
// 	.catch((err) => {
// 		console.log(err);
// 	});

// const Redis = require("ioredis");
// const connection = new Redis(
// 	// { host: "host.docker.internal", port: 6379 },
// 	process.env.REDIS_LOCAL_HOST,
// 	{
// 		maxRetriesPerRequest: null,
// 	}
// );

// const { executeCpp } = require("./execution/executeCpp");
// const { executePy } = require("./execution/executePy");
// const { executeJava } = require("./execution/executeJava");
// const { executeJs } = require("./execution/executeJs");
// const { executeGo } = require("./execution/executeGo");

// const worker = new Worker(
// 	"job-queue",
// 	async (job) => {
// 		await jobHandler(job);
// 	},
// 	{
// 		connection,
// 		concurrency: 50,
// 	}
// );

// function cleanUpDir(filePath, outputFilePath) {
// 	if (filePath && fs.existsSync(filePath)) {
// 		fs.rmSync(filePath, { recursive: true, force: true });
// 	}
// 	if (outputFilePath && fs.existsSync(outputFilePath)) {
// 		fs.rmSync(outputFilePath, { recursive: true, force: true });
// 	}
// }

// function stripAnsiCodes(text) {
// 	return text.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, "");
// }

// async function jobHandler(job) {
// 	const jobData = await Job.findById(job.data.id);
// 	if (!jobData) {
// 		throw new Error("No jobs found");
// 	}
// 	let output;
// 	try {
// 		jobData.startedAt = new Date();
// 		switch (jobData.language) {
// 			case "cpp":
// 				output = await executeCpp(jobData);
// 				break;
// 			case "py":
// 				output = await executePy(jobData);
// 				break;
// 			case "java":
// 				output = await executeJava(jobData);
// 				break;
// 			case "go":
// 				output = await executeGo(jobData);
// 				break;
// 			default:
// 				output = await executeJs(jobData);
// 		}

// 		// console.log("Worker OUTPUT:", output);
// 		const newJobData = await Job.findById(jobData._id);

// 		if (!newJobData) {
// 			throw new Error("No jobs found");
// 		}

// 		// cleanUpDir(newJobData.filepath, newJobData.outputfilepath);
// 		newJobData.completedAt = new Date();
// 		newJobData.status = "success";
// 		const cleanOutput = stripAnsiCodes(output); // Clean the output
// 		newJobData.output = JSON.stringify(cleanOutput); // Pretty JSON
// 		await newJobData.save();
// 	} catch (err) {
// 		jobData.completedAt = new Date();
// 		jobData.status = "error";
// 		jobData.output = JSON.stringify(err);
// 		await jobData.save();
// 	}
// 	return true;
// }

// worker.on("completed", (job) => {
// 	// console.log(`${job.id} has completed!`);
// });
// worker.on("failed", (job, err) => {
// 	console.log(`${job.id} has failed with ${err.message}`);
// });

// module.exports = worker;

// process.on("unhandledRejection", (err) => {
// 	console.log("WORKER UNHANDLED: ", err.name, err.message);
// });

// const { Worker } = require("bullmq");
// const mongoose = require("mongoose");
// const Job = require("./Job");
// const fs = require("fs");
// const dotenv = require("dotenv");
// dotenv.config({ path: "./.env" });
// const express = require("express");
// const { Server } = require("socket.io");
// const http = require("http");
// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
// 	cors: { origin: "*" },
// });

// mongoose
// 	// .connect("mongodb://host.docker.internal:27017/codedecode")
// 	.connect(process.env.MONGO_LOCAL)
// 	.then(console.log("Connected to Mongo"))
// 	.catch((err) => {
// 		console.log(err);
// 	});

// const Redis = require("ioredis");
// const connection = new Redis(
// 	// { host: "host.docker.internal", port: 6379 },
// 	process.env.REDIS_LOCAL_HOST,
// 	{
// 		maxRetriesPerRequest: null,
// 	}
// );

// const { executeCpp } = require("./execution/executeCpp");
// const { executePy } = require("./execution/executePy");
// const { executeJava } = require("./execution/executeJava");
// const { executeJs } = require("./execution/executeJs");
// const { executeGo } = require("./execution/executeGo");

// const worker = new Worker(
// 	"job-queue",
// 	async (job) => {
// 		await jobHandler(job);
// 	},
// 	{
// 		connection,
// 		// concurrency: 50,
// 	}
// );

// async function jobHandler(job) {
// 	io.on("connection", (socket) => {
// 		const { sessionId } = socket.handshake.query;
// 		socket.sessionId = sessionId;
// 		console.log(
// 			`A user connected: sessionId: ${sessionId} socketId: ${socket.id}`
// 		);
// 		try {
// 			switch (job.data.id.language) {
// 				case "cpp":
// 					executeCpp(job.data.id, socket, io);
// 					break;

// 				default:
// 					executeJs(jobData);
// 			}
// 		} catch (err) {
// 			console.error("Error in jobHandler:", err);
// 			io.to(socket.id).emit("job:error", {
// 				sessionId: job.data.sessionId,
// 				error: err.message,
// 			});
// 		}
// 	});

// 	return true;
// }

// worker.on("completed", (job) => {
// 	// console.log(`${job.id} has completed!`);
// });
// worker.on("failed", (job, err) => {
// 	console.log(`${job.id} has failed with ${err.message}`);
// });

// // module.exports = worker;

// server.listen(8000, () => {
// 	console.log("Server is running on http://localhost:8000");
// });
// process.on("unhandledRejection", (err) => {
// 	console.log("WORKER UNHANDLED: ", err.name, err.message);
// });

// const express = require("express");
// const { Server } = require("socket.io");
// const http = require("http");
// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
// 	cors: { origin: "*" },
// });

// const { executeCpp } = require("./execution/executeCpp");

// const Redis = require("ioredis");
// const redis = new Redis(); // Connects to the default Redis instance

// io.on("connection", (socket) => {
// 	const { sessionId } = socket.handshake.query;
// 	socket.sessionId = sessionId;
// 	// console.log(
// 	// 	`A user connected: sessionId: ${sessionId} socketId: ${socket.id}`
// 	// );
// 	const subscribeToChannel = (channel) => {
// 		redis.subscribe(channel, (err, count) => {
// 			if (err) {
// 				console.error("Error subscribing to channel:", err);
// 			} else {
// 				console.log(`Subscribed to ${channel}. Now listening for messages...`);
// 			}
// 		});

// 		redis.on("message", (channel, message) => {
// 			console.log("job picked up by worker");
// 			try {
// 				// Parse the JSON message
// 				const messageData = JSON.parse(message);
// 				executeCpp(messageData, socket, io, sessionId);
// 			} catch (error) {
// 				console.error("Error parsing message:", error);
// 			}
// 		});
// 	};

// 	// Example usage
// 	subscribeToChannel("CodeExecution");

// 	socket.on("disconnect", () => {
// 		console.log(
// 			`User disconnected: sessionId:${sessionId} socket:${socket.id}`
// 		);
// 	});
// });

// server.listen(8000, () => {
// 	console.log("Server is running on http://localhost:8000");
// });

// const path = require("path");
// const express = require("express");
// const { Server } = require("socket.io");
// const http = require("http");
// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
// 	cors: { origin: "*" },
// });

// const { executeCpp } = require("./execution/executeCpp");
// const { executePy } = require("./execution/executePy");
// const { executeJava } = require("./execution/executeJava");
// const { executeJs } = require("./execution/executeJs");
// const { executeGo } = require("./execution/executeGo");

// const Redis = require("ioredis");
// const redis = new Redis();
// const QUEUE_NAME = "CodeExecution";

// io.on("connection", (socket) => {
// 	const { sessionId } = socket.handshake.query;
// 	socket.sessionId = sessionId;
// 	console.log(
// 		`A user connected: sessionId: ${sessionId} socketId: ${socket.id}`
// 	);

// 	(async function worker() {
// 		while (true) {
// 			try {
// 				const message = await redis.rpop(QUEUE_NAME);
// 				if (message) {
// 					const data = JSON.parse(message);
// 					// Execute based on the language specified in the message
// 					switch (data.language.toLowerCase()) {
// 						case "cpp":
// 							await executeCpp(data, socket, io);
// 							break;
// 						case "py":
// 							await executePy(data, socket, io);
// 							break;
// 						case "java":
// 							await executeJava(data, socket, io);
// 							break;
// 						case "js":
// 							await executeJs(data, socket, io);
// 							break;
// 						case "go":
// 							await executeGo(data, socket, io);
// 							break;
// 						default:
// 							console.log(`Unsupported language: ${data.language}`);
// 							break;
// 					}
// 				} else {
// 					// No message in the queue, wait before retrying
// 					await new Promise((resolve) => setTimeout(resolve, 1000));
// 				}
// 			} catch (err) {
// 				console.error("Worker error:", err.message);
// 			}
// 		}
// 	})();

// 	const SANDBOX_PATH =
// 		"D:/Akash/MERN/CODEDECODE/code-decode-testing-backup/sandbox/abc";
// 	const jobDir = path.join(SANDBOX_PATH, `${sessionId}`);

// 	socket.on("disconnect", async () => {
// 		console.log(
// 			`User disconnected from main: sessionId:${socket.sessionId} socket:${socket.id}`
// 		);
// 	});
// });

// server.listen(8000, () => {
// 	console.log("Server is running on http://localhost:8000");
// });

// Refactored Code Execution Implementation

// const express = require("express");
// const { Server } = require("socket.io");
// const http = require("http");
// const Redis = require("ioredis");

// // Execution Handlers
// const { executeCpp } = require("./execution/executeCpp");
// const { executePy } = require("./execution/executePy");
// const { executeJava } = require("./execution/executeJava");
// const { executeJs } = require("./execution/executeJs");
// const { executeGo } = require("./execution/executeGo");

// const SANDBOX_PATH =
// 	"D:/Akash/MERN/CODEDECODE/code-decode-testing-backup/sandbox";
// const QUEUE_NAME = "CodeExecution";

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, { cors: { origin: "*" } });
// const redis = new Redis();

// // WebSocket Handler
// io.on("connection", (socket) => {
// 	const { sessionId } = socket.handshake.query;
// 	socket.sessionId = sessionId;
// 	console.log(
// 		`User connected: sessionId: ${sessionId}, socketId: ${socket.id}`
// 	);

// 	socket.on("disconnect", () => {
// 		console.log(
// 			`User disconnected: sessionId: ${sessionId}, socketId: ${socket.id}`
// 		);
// 	});
// });

// // Worker Loop
// (async function processQueue() {
// 	while (true) {
// 		try {
// 			const message = await redis.brpop(QUEUE_NAME, 0); // Blocking pop
// 			const data = JSON.parse(message[1]);
// 			const { sessionId, language } = data;

// 			try {
// 				// Wait for the client to connect
// 				const socket = await waitForSocket(sessionId);

// 				// Execute based on language
// 				switch (language.toLowerCase()) {
// 					case "cpp":
// 						await executeCpp(data, socket, io);
// 						break;
// 					case "py":
// 						await executePy(data, socket, io);
// 						break;
// 					case "java":
// 						await executeJava(data, socket, io);
// 						break;
// 					case "js":
// 						await executeJs(data, socket, io);
// 						break;
// 					case "go":
// 						await executeGo(data, socket, io);
// 						break;
// 					default:
// 						io.to(socket.id).emit("error", `Unsupported language: ${language}`);
// 				}
// 			} catch (error) {
// 				console.error(
// 					`Error processing job for sessionId: ${sessionId}`,
// 					error.message
// 				);
// 			}
// 		} catch (queueError) {
// 			console.error("Queue processing error:", queueError);
// 		}
// 	}
// })();

// async function waitForSocket(sessionId, timeout = 10000) {
// 	const pollInterval = 100; // Check every 100ms
// 	const start = Date.now();

// 	while (Date.now() - start < timeout) {
// 		const socket = findSocketBySessionId(sessionId, io);
// 		if (socket) {
// 			return socket;
// 		}
// 		await new Promise((resolve) => setTimeout(resolve, pollInterval));
// 	}

// 	throw new Error(
// 		`Socket connection not established for sessionId: ${sessionId}`
// 	);
// }

// // Utility: Find socket by sessionId
// function findSocketBySessionId(sessionId, io) {
// 	const sockets = io.sockets.sockets;
// 	for (const socketId of sockets.keys()) {
// 		const socket = sockets.get(socketId);
// 		if (socket.sessionId === sessionId) return socket;
// 	}
// 	return null;
// }

// // Server Start
// server.listen(8000, () => {
// 	console.log("Server running on http://localhost:8000");
// });

const redisOptions = {
	host: "host.docker.internal",
	port: 6379,
};
const redisURL = `redis://default:F0qx6ANIjXUFYAGocaBoYXYBUUW6Oilm@redis-19403.c212.ap-south-1-1.ec2.cloud.redislabs.com:19403`;
const mblogRedisURL = `redis://default:beynsV1on4VachJBq5SKBOqJboJrReIE@redis-19724.crce179.ap-south-1-1.ec2.redns.redis-cloud.com:19724`;
const redisURLAK = `redis://default:k90lXqx31zXDhflMss8MaOzceoSuk0Xq@redis-11047.c264.ap-south-1-1.ec2.redns.redis-cloud.com:11047`;

const Redis = require("ioredis");
const redis = new Redis(redisURLAK);
const workerSubscriber = new Redis(redisURL); // For subscribing to user inputs
const workerPublisher = new Redis(mblogRedisURL); // For publishing outputs
const executionHandler = require("./services/executionHandler");

const QUEUE_NAME = "CodeExecution";

let i = 1;
(async function processQueue() {
	while (true) {
		try {
			// console.log("picking job", i);
			const message = await redis.brpop(QUEUE_NAME, 0); // Blocking pop
			if (message) {
				// console.log("job picked", i);
				i++;
			} else {
				console.log("No message available in the queue");
			}
			const jobData = JSON.parse(message[1]);
			// Pass Redis publishers and subscribers to the executionHandler
			await executionHandler(jobData, workerPublisher, workerSubscriber);
		} catch (queueError) {
			console.error("Queue processing error:", queueError);
		}
	}
})();
