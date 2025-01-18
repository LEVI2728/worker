const pty = require("node-pty");
const path = require("path");
const fs = require("fs");
const shell = "/bin/sh";
const SANDBOX_PATH = "/sandbox";
const { clearDirIfExists } = require("../utils/clearDir");

const activeSessions = {};

const executeGeneral = async (
	jobData,
	command,
	workerPublisher,
	workerSubscriber
) => {
	await new Promise((resolve) => setTimeout(resolve, 50));

	const { code, language, sessionId } = jobData;
	const jobDir = path.join(SANDBOX_PATH, `${sessionId}`);
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

		// Handle execution and user inputs
		await runPtyProcess(
			command,
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
		console.log(err.message);
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

		// Publish outputs to Redis
		ptyProcessInstance.onData(async (data) => {
			await workerPublisher.publish(
				`output:${sessionId}`,
				JSON.stringify({
					type: "output",
					data,
					sessionId,
				})
			);
		});

		ptyProcessInstance.on("exit", (code) => {
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
