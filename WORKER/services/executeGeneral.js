// const pty = require("node-pty");
// const path = require("path");
// const fs = require("fs");
// const os = require("os");
// const shell = os.platform() === "win32" ? "powershell.exe" : "bash";
// const SANDBOX_PATH =
// 	"D:/Akash/MERN/CODEDECODE/code-decode-testing-backup/sandbox";
// const { clearDirIfExists } = require("../utils/clearDir");

// const executeGeneral = async (jobData, command, dockerImage, socket, io) => {
// 	const { code, language } = jobData;
// 	const sessionId = socket.sessionId;
// 	const jobDir = path.join(SANDBOX_PATH, `${sessionId}`);
// 	const codeFilePath = path.join(jobDir, `main.${language}`);

// 	try {
// 		io.to(socket.id).emit("terminal:start", { sessionId });
// 		await fs.promises.mkdir(jobDir, { recursive: true });
// 		await fs.promises.writeFile(codeFilePath, code);

// 		const dockerCommand = `docker run --rm -it \
//       -v ${jobDir}:/app/sandbox \
//       -w /app/sandbox \
//       ${dockerImage} /bin/sh -c "${command}"`;

// 		await runPtyProcess(dockerCommand, jobDir, socket, io, sessionId);

// 		io.to(socket.id).emit("terminal:data", {
// 			sessionId,
// 			data: `\n\n=== Execution Completed Successfully ===`,
// 		});
// 	} catch (err) {
// 		io.to(socket.id).emit("terminal:data", {
// 			sessionId,
// 			data: `\n\n=== ${err.message || "Execution failed"} ===`,
// 		});
// 	} finally {
// 		io.to(socket.id).emit("terminal:exit", { sessionId });
// 		await clearDirIfExists(jobDir);
// 		socket.disconnect(true);
// 	}
// };

// const runPtyProcess = (command, cwd, socket, io, sessionId) => {
// 	return new Promise((resolve, reject) => {
// 		const ptyProcessInstance = pty.spawn(shell, ["-c", command], {
// 			name: "xterm-color",
// 			cwd,
// 			env: process.env,
// 		});

// 		socket.ptyProcess = ptyProcessInstance;

// 		socket.on("terminal:write", (inputData) => {
// 			ptyProcessInstance.write(inputData);
// 		});

// 		ptyProcessInstance.onData((data) => {
// 			io.to(socket.id).emit("terminal:data", { sessionId, data });
// 		});

// 		ptyProcessInstance.on("exit", (code) => {
// 			code === 0
// 				? resolve()
// 				: reject(new Error(`Execution failed with exit code ${code}`));
// 		});
// 	});
// };

// module.exports = { executeGeneral };

const pty = require("node-pty");
const path = require("path");
const fs = require("fs");
const os = require("os");
const shell = os.platform() === "win32" ? "powershell.exe" : "bash";
const SANDBOX_PATH =
	"D:/Akash/MERN/CODEDECODE/code-decode-testing-backup/sandbox";
const { clearDirIfExists } = require("../utils/clearDir");

const activeSessions = {};

const executeGeneral = async (
	jobData,
	command,
	dockerImage,
	workerPublisher,
	workerSubscriber
) => {
	await new Promise((resolve) => setTimeout(resolve, 50));

	const { code, language, sessionId } = jobData;
	const jobDir = path.join(SANDBOX_PATH, `${sessionId}`);
	// const codeFilePath = path.join(jobDir, `main.${language}`);
	const codeFilePath = path.join(
		jobDir,
		language === "java" ? "Main.java" : `main.${language}`
	);

	try {
		// Notify client of the start
		await workerPublisher.publish(
			`output:${sessionId}`,
			JSON.stringify({
				type: "start",
				data: "Execution started",
				sessionId,
			})
		);

		// Prepare code for execution
		await fs.promises.mkdir(jobDir, { recursive: true });
		await fs.promises.writeFile(codeFilePath, code);

		const dockerCommand = `docker run --name ${language}_${sessionId} \
			--memory="150m" --cpus="0.5" --rm -it \
      -v ${jobDir}:/app/sandbox \
      -w /app/sandbox \
      ${dockerImage} /bin/sh -c "${command} | head -c 10240"`;

		// Handle execution and user inputs
		await runPtyProcess(
			dockerCommand,
			jobDir,
			sessionId,
			workerPublisher,
			workerSubscriber
		);

		// Notify client of completion
		await workerPublisher.publish(
			`output:${sessionId}`,
			JSON.stringify({
				type: "complete",
				data: `Execution completed successfully`,
				sessionId,
			})
		);
	} catch (err) {
		await workerPublisher.publish(
			`output:${sessionId}`,
			JSON.stringify({
				type: "error",
				data: `${err.message}` || `Execution failed`,
				sessionId,
			})
		);
	} finally {
		// Check session state before cleanup
		await workerPublisher.publish(
			`output:${sessionId}`,
			JSON.stringify({
				type: "exit",
				sessionId,
			})
		);
		await clearDirIfExists(jobDir); // Cleanup sandbox
	}
};

const runPtyProcess = (
	command,
	cwd,
	sessionId,
	workerPublisher,
	workerSubscriber
) => {
	return new Promise((resolve, reject) => {
		const ptyProcessInstance = pty.spawn(shell, ["-c", command], {
			name: "xterm-color",
			cwd,
			env: process.env,
		});

		// Track the session
		activeSessions[sessionId] = {
			ptyProcess: ptyProcessInstance,
			jobDir: cwd,
			inputChannel: `input:${sessionId}`,
			outputChannel: `output:${sessionId}`,
		};

		// Define the specific channel for this session
		const inputChannel = `input:${sessionId}`;
		const disconnectChannel = `disconnect:${sessionId}`;

		// Listener for the input channel
		const onMessage = async (channel, message) => {
			if (channel === disconnectChannel) {
				console.log("gotcha");
				const { sessionId } = JSON.parse(message);
				console.log(`Received disconnect request for session: ${sessionId}`);

				// Cleanup process and resources for the session
				if (activeSessions[sessionId]) {
					const { ptyProcess, jobDir, inputChannel } =
						activeSessions[sessionId];

					// Terminate the running pty process
					if (ptyProcess) {
						ptyProcess.kill();
						console.log(`Killed process for session: ${sessionId}`);
					}

					// Clear the sandbox directory
					if (jobDir) {
						await clearDirIfExists(jobDir);
						console.log(`Cleared sandbox for session: ${sessionId}`);
					}

					// Unsubscribe
					workerSubscriber.unsubscribe(inputChannel);
					workerSubscriber.unsubscribe(disconnectChannel);

					// Remove session from activeSessions
					delete activeSessions[sessionId];
				}
			} else if (channel === inputChannel) {
				const { inputData } = JSON.parse(message);
				ptyProcessInstance.write(inputData);
			}
		};

		// Subscribe to the input channel and add the listener
		workerSubscriber.subscribe(inputChannel);
		workerSubscriber.subscribe(disconnectChannel);
		workerSubscriber.on("message", onMessage);

		let totalBytes = 0; // To track the total size of the output

		// Publish outputs to Redis
		ptyProcessInstance.onData(async (data) => {
			const dataSize = Buffer.byteLength(data, "utf8"); // Calculate the size of the current chunk
			totalBytes += dataSize; // Add to the total size

			if (totalBytes >= 10240) {
				delete activeSessions[sessionId];
				ptyProcessInstance.kill();
				reject(new Error("Execution stopped: Output size exceeded"));
				return;
			}

			await workerPublisher.publish(
				`output:${sessionId}`,
				JSON.stringify({
					type: "output",
					data,
					sessionId,
				})
			);
		});

		ptyProcessInstance.on("exit", async (code) => {
			console.log(code);
			// Cleanup: Remove the listener and unsubscribe from the channel
			workerSubscriber.unsubscribe(inputChannel);
			workerSubscriber.unsubscribe(`disconnect:${sessionId}`);
			workerSubscriber.removeListener("message", onMessage);

			// Cleanup
			delete activeSessions[sessionId];

			// Resolve or reject based on the exit code
			ptyProcessInstance.kill();
			// workerSubscriber.removeAllListeners("");

			code === 0
				? resolve()
				: reject(new Error(`Execution failed with exit code ${code}`));
		});
	});
};

module.exports = { executeGeneral };

// const pty = require("node-pty");
// const path = require("path");
// const fs = require("fs");
// const os = require("os");
// const shell = os.platform() === "win32" ? "powershell.exe" : "/bin/sh";
// // const shell = "/bin/sh";
// const SANDBOX_PATH =
// 	"D:/Akash/MERN/CODEDECODE/code-decode-testing-backup/sandbox";
// // const SANDBOX_PATH = "/sandbox";
// const { clearDirIfExists } = require("../utils/clearDir");

// const activeSessions = {};

// const executeGeneral = async (
// 	jobData,
// 	command,
// 	workerPublisher,
// 	workerSubscriber
// ) => {
// 	await new Promise((resolve) => setTimeout(resolve, 50));

// 	const { code, language, sessionId } = jobData;
// 	// const command = `ulimit -f 256; ${userCommand}`;
// 	// const hasInfiniteLoop = /while\s*\(\s*true\s*\)|for\s*\(\s*;\s*;\s*\)/.test(
// 	// 	code
// 	// );
// 	// if (hasInfiniteLoop) {
// 	// 	throw new Error("Infinite loop detected in the code");
// 	// }
// 	const jobDir = path.join(SANDBOX_PATH, `${sessionId}`);
// 	const codeFilePath = path.join(
// 		jobDir,
// 		language === "java" ? "Main.java" : `main.${language}`
// 	);

// 	try {
// 		// Notify client of the start
// 		await workerPublisher.publish(
// 			`output:${sessionId}`,
// 			JSON.stringify({
// 				type: "start",
// 				data: "Execution started",
// 				sessionId,
// 			})
// 		);

// 		// Prepare code for execution
// 		await fs.promises.mkdir(jobDir, { recursive: true });
// 		await fs.promises.writeFile(codeFilePath, code);

// 		// Add language-specific ulimit settings
// 		// let ulimitSettings = `
// 		// 	ulimit -t 10;       # Max 10 seconds of CPU time
// 		// 	ulimit -u 20;       # Max 50 processes
// 		// `;

// 		// if (language === "java") {
// 		// 	ulimitSettings += `
// 		// 		ulimit -v 3145728;  # Max 3GB virtual memory for JVM
// 		// 	`;
// 		// } else if (language === "go") {
// 		// 	ulimitSettings += `
// 		// 		ulimit -n 512;     # Max 128 open files for Go builds
// 		// 	`;
// 		// } else {
// 		// 	ulimitSettings += `
// 		// 		ulimit -v 1048576;  # Max 2GB virtual memory for other languages
// 		// 		ulimit -n 64;     # Default max open files
// 		// 	`;
// 		// }

// 		// Construct the full constrained command
// 		// const constrainedCommand = `${ulimitSettings} ${command}`;

// 		// Handle execution and user inputs
// 		await runPtyProcess(
// 			command,
// 			jobDir,
// 			sessionId,
// 			workerPublisher,
// 			workerSubscriber
// 		);

// 		// Notify client of completion
// 		await workerPublisher.publish(
// 			`output:${sessionId}`,
// 			JSON.stringify({
// 				type: "complete",
// 				data: `Execution completed successfully`,
// 				sessionId,
// 			})
// 		);
// 	} catch (err) {
// 		await workerPublisher.publish(
// 			`output:${sessionId}`,
// 			JSON.stringify({
// 				type: "error",
// 				data: `${err.message}` || `Execution failed`,
// 				sessionId,
// 			})
// 		);
// 	} finally {
// 		// Check session state before cleanup
// 		await workerPublisher.publish(
// 			`output:${sessionId}`,
// 			JSON.stringify({
// 				type: "exit",
// 				sessionId,
// 			})
// 		);

// 		await clearDirIfExists(jobDir); // Cleanup sandbox
// 	}
// };

// const runPtyProcess = (
// 	command,
// 	cwd,
// 	sessionId,
// 	workerPublisher,
// 	workerSubscriber
// ) => {
// 	return new Promise((resolve, reject) => {
// 		const ptyProcessInstance = pty.spawn(shell, ["-c", command], {
// 			name: "xterm-color",
// 			cwd,
// 			env: process.env,
// 		});

// 		// Track the session
// 		activeSessions[sessionId] = {
// 			ptyProcess: ptyProcessInstance,
// 			jobDir: cwd,
// 			inputChannel: `input:${sessionId}`,
// 			outputChannel: `output:${sessionId}`,
// 		};

// 		// Define the specific channel for this session
// 		const inputChannel = `input:${sessionId}`;
// 		const disconnectChannel = `disconnect:${sessionId}`;

// 		// Listener for the input channel
// 		const onMessage = async (channel, message) => {
// 			if (channel === disconnectChannel) {
// 				console.log("gotcha");
// 				const { sessionId } = JSON.parse(message);
// 				console.log(`Received disconnect request for session: ${sessionId}`);

// 				// Cleanup process and resources for the session
// 				if (activeSessions[sessionId]) {
// 					const { ptyProcess, jobDir, inputChannel } =
// 						activeSessions[sessionId];

// 					// Terminate the running pty process
// 					if (ptyProcess) {
// 						ptyProcess.kill();
// 						console.log(`Killed process for session: ${sessionId}`);
// 					}

// 					// Clear the sandbox directory
// 					if (jobDir) {
// 						await clearDirIfExists(jobDir);
// 						console.log(`Cleared sandbox for session: ${sessionId}`);
// 					}

// 					// Unsubscribe
// 					workerSubscriber.unsubscribe(inputChannel);
// 					workerSubscriber.unsubscribe(disconnectChannel);

// 					// Remove session from activeSessions
// 					delete activeSessions[sessionId];
// 				}
// 			} else if (channel === inputChannel) {
// 				const { inputData } = JSON.parse(message);
// 				ptyProcessInstance.write(inputData);
// 			}
// 		};

// 		// Subscribe to the input channel and add the listener
// 		workerSubscriber.subscribe(inputChannel);
// 		workerSubscriber.subscribe(disconnectChannel);
// 		workerSubscriber.on("message", onMessage);

// 		// Publish outputs to Redis
// 		ptyProcessInstance.onData(async (data) => {
// 			await workerPublisher.publish(
// 				`output:${sessionId}`,
// 				JSON.stringify({
// 					type: "output",
// 					data,
// 					sessionId,
// 				})
// 			);
// 		});

// 		ptyProcessInstance.on("exit", (code) => {
// 			// Cleanup: Remove the listener and unsubscribe from the channel
// 			workerSubscriber.unsubscribe(inputChannel);
// 			workerSubscriber.unsubscribe(`disconnect:${sessionId}`);
// 			workerSubscriber.removeListener("message", onMessage);

// 			// Cleanup
// 			delete activeSessions[sessionId];

// 			// Resolve or reject based on the exit code
// 			ptyProcessInstance.kill();
// 			// workerSubscriber.removeAllListeners("");

// 			code === 0
// 				? resolve()
// 				: reject(new Error(`Execution failed with exit code ${code}`));
// 		});
// 	});
// };

// module.exports = { executeGeneral };
