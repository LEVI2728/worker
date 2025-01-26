// const util = require("util");
// const fs = require("fs");
// const { v4: uuid } = require("uuid");
// const exec = util.promisify(require("child_process").exec);
// const unlinkFile = util.promisify(fs.unlink);

// const doesContainerExist = async (containerId) => {
// 	try {
// 		console.log("Checking if container exists");
// 		const result = await exec(`docker inspect ${containerId}`);
// 		return !!result.stdout; // If output exists, the container exists
// 	} catch {
// 		return false; // Container doesn't exist
// 	}
// };

// const executeGeneral = async (input, command, dockerImage, code, language) => {
// 	const memoryLimit = "150m";
// 	const cpuLimit = "0.5";

// 	let codeFileName;
// 	let inputFileName;

// 	// const fileId = uuid();
// 	const fileId = Math.floor(10000000 + Math.random() * 90000000);
// 	if (language === "java") {
// 		const classNameMatch = code.match(/\bclass\s+([A-Za-z_][A-Za-z0-9_]*)\b/);
// 		if (!classNameMatch) {
// 			return "Invalid Java code: No class definition found.";
// 		}
// 		const className = classNameMatch[1];
// 		codeFileName = `${className}.java`;
// 		// inputFileName = `${fileId}.txt`;
// 		inputFileName = `${className}.txt`;
// 	} else {
// 		// codeFileName = `${fileId}.${language}`;
// 		// inputFileName = `${fileId}.txt`;

// 		codeFileName = `main.${language}`;
// 		inputFileName = `main.txt`;
// 	}

// 	try {
// 		await fs.promises.writeFile(codeFileName, code);
// 		await fs.promises.writeFile(inputFileName, input);

// 		const response = await exec(
// 			`docker run -d -it --memory=${memoryLimit} --cpus=${cpuLimit} ${dockerImage} sh`
// 		);
// 		const containerId = response.stdout.trim().substring(0, 8);

// 		const containerDir = `/app/temp/${fileId}`;
// 		const containerCodePath = `${containerDir}/${codeFileName}`;
// 		const containerInputPath = `${containerDir}/${inputFileName}`;

// 		await exec(
// 			`docker exec ${containerId} mkdir -p ${containerDir} && docker cp ${codeFileName} ${containerId}:${containerDir} && docker cp ${inputFileName} ${containerId}:${containerDir}`
// 		);

// 		// Check if the command timed out
// 		const timeoutPromise = new Promise((_, reject) => {
// 			setTimeout(async () => {
// 				if (await doesContainerExist(containerId)) {
// 					await exec(`docker rm -f ${containerId}`).catch((err) =>
// 						console.log("Failed to remove container during timeout:", err)
// 					);
// 				}
// 				reject(
// 					new Error("Execution timeout: Your code took too long to execute.")
// 				);
// 			}, 10000);
// 		});

// 		let execResponse;
// 		switch (language) {
// 			case "cpp":
// 				execResponse = await exec(
// 					`docker exec -t ${containerId} sh -c "g++ ${containerDir}/${codeFileName} -o ${containerDir}/a && ${containerDir}/a < ${containerDir}/${inputFileName}"`
// 				);
// 				break;
// 			case "py":
// 				execResponse = await exec(
// 					`docker exec -t ${containerId} sh -c "python3 ${containerDir}/${codeFileName} < ${containerDir}/${inputFileName}"`
// 				);
// 				break;
// 			case "java":
// 				execResponse = await exec(
// 					`docker exec -t ${containerId} sh -c "javac ${containerCodePath} && java -cp ${containerDir} ${
// 						codeFileName.split(".")[0]
// 					} < ${containerInputPath}"`
// 				);
// 				break;
// 			case "go":
// 				execResponse = await exec(
// 					`docker exec -t ${containerId} sh -c "go run ${containerDir}/${codeFileName} < ${containerDir}/${inputFileName}"`
// 				);
// 				break;
// 			default:
// 				execResponse = await exec(
// 					`docker exec -t ${containerId} sh -c "node ${containerDir}/${codeFileName} < ${containerDir}/${inputFileName}"`
// 				);
// 		}

// 		// Wait for execution or timeout
// 		await Promise.race([timeoutPromise, execResponse]);

// 		return execResponse.stderr ? execResponse.stderr : execResponse.stdout;
// 	} catch (err) {
// 		console.log("EXECUTEGENERAL", err.message);
// 		let errorMessage = "";
// 		if (
// 			err.message &&
// 			[
// 				"Execution timeout",
// 				"Command failed",
// 				"Connection error",
// 				"Network failure",
// 			].some((str) => err.message.includes(str))
// 		) {
// 			errorMessage = "Execution timeout: Your code took too long to execute.";
// 		}

// 		if (err.cmd) {
// 			const containerId = err.cmd.trim().substring(15, 23);
// 			if (await doesContainerExist(containerId))
// 				await exec(`docker rm -f ${containerId}`).catch((err) =>
// 					console.log("Failed to remove container after error", err)
// 				);
// 		}

// 		return err.stdout || errorMessage || "Execution failed";
// 	} finally {
// 		await unlinkFile(codeFileName).catch(() =>
// 			console.log(`Failed to remove .${language} file`)
// 		);
// 		await unlinkFile(inputFileName).catch(() =>
// 			console.log("Failed to remove .txt file")
// 		);
// 	}
// };

// module.exports = { executeGeneral };

// const util = require("util");
// const fs = require("fs");
// const exec = util.promisify(require("child_process").exec);
// const SANDBOX_PATH = "/sandbox";

// const executeGeneral = async (input, command, dockerImage, code, language) => {
// 	const fileId = Math.floor(10000000 + Math.random() * 90000000);
// 	const jobDir = `${SANDBOX_PATH}/${fileId}`;
// 	let codeFileName, inputFileName;

// 	if (language === "java") {
// 		const classNameMatch = code.match(/\bclass\s+([A-Za-z_][A-Za-z0-9_]*)\b/);
// 		if (!classNameMatch) {
// 			return "Invalid Java code: No class definition found.";
// 		}
// 		const className = classNameMatch[1];
// 		codeFileName = `${className}.java`;
// 		inputFileName = `main.txt`;
// 	} else {
// 		codeFileName = `main.${language}`;
// 		inputFileName = `main.txt`;
// 	}

// 	const codeFilePath = `${jobDir}/${codeFileName}`;
// 	const inputFilePath = `${jobDir}/${inputFileName}`;

// 	try {
// 		// Create a unique job directory
// 		await fs.promises
// 			.mkdir(jobDir, { recursive: true })
// 			.catch((err) => console.log("Couldn't create a sandbox directory", err));

// 		// Write code to file
// 		await fs.promises
// 			.writeFile(codeFilePath, code)
// 			.catch((err) => console.log("Couldn't create code file", err));

// 		// Only create the input file if input is provided
// 		if (input) {
// 			await fs.promises
// 				.writeFile(inputFilePath, input)
// 				.catch((err) => console.log("Couldn't create input file", err));
// 		}

// 		const execWithSandbox = async (command) => {
// 			return await exec(command, { cwd: jobDir });
// 		};

// 		const inputCommand = input ? `< ${inputFileName}` : "";

// 		// Race execution with timeout
// 		const timeoutPromise = new Promise((_, reject) => {
// 			setTimeout(() => {
// 				reject(
// 					new Error("Execution timeout: Your code took too long to execute.")
// 				);
// 			}, 10000);
// 		});

// 		let execResponse;
// 		const executionPromise = (async () => {
// 			switch (language) {
// 				case "cpp":
// 					return await execWithSandbox(
// 						`g++ ${codeFileName} -o a && a ${inputCommand}`
// 					);
// 				case "py":
// 					return await execWithSandbox(
// 						`python3 ${codeFileName} ${inputCommand}`
// 					);
// 				case "java":
// 					return await execWithSandbox(
// 						`javac ${codeFileName} && java ${
// 							codeFileName.split(".")[0]
// 						} ${inputCommand}`
// 					);
// 				case "go":
// 					return await execWithSandbox(
// 						`go run ${codeFileName} ${inputCommand}`
// 					);
// 				default:
// 					return await execWithSandbox(`node ${codeFileName} ${inputCommand}`);
// 			}
// 		})();

// 		// Wait for either execution or timeout
// 		execResponse = await Promise.race([timeoutPromise, executionPromise]);
// 		console.log(execResponse);

// 		return execResponse.stdout || execResponse.stderr;
// 	} catch (err) {
// 		console.log("EXECUTEGENERAL", err);
// 		let errorMessage = "";
// 		if (err.message.includes("Execution timeout")) {
// 			errorMessage = "Execution timeout: Your code took too long to execute.";
// 		}
// 		return err.stdout || err.stderr || errorMessage || "Execution failed";
// 	} finally {
// 		// Cleanup job directory
// 		await fs.promises
// 			.rm(jobDir, { recursive: true, force: true })
// 			.catch(() => console.log(`Failed to remove job directory: ${jobDir}`));
// 	}
// };

// module.exports = { executeGeneral };

// const pty = require("node-pty");
// const path = require("path");
// const os = require("os");
// const shell = os.platform() === "win32" ? "powershell.exe" : "bash";
// const fs = require("fs");
// const SANDBOX_PATH =
// 	"D:/Akash/MERN/CODEDECODE/code-decode-testing-backup/sandbox";

// const executeGeneral = async (
// 	input,
// 	command,
// 	dockerImage,
// 	code,
// 	language,
// 	socket,
// 	io
// ) => {
// 	const sessionId = socket.sessionId;
// 	// const fileId = Math.floor(10000000 + Math.random() * 90000000);
// 	const fileId = sessionId;
// 	const jobDir = path.join(SANDBOX_PATH, `${fileId}`);
// 	const codeFilePath = path.join(jobDir, `main.${language}`);
// 	const exeFileName = "main.exe";
// 	const exeFilePath = path.join(jobDir, exeFileName);
// 	let runProcess = null;
// 	let ptyProcess = null;

// 	try {
// 		await fs.promises.mkdir(jobDir, { recursive: true });
// 		await fs.promises.writeFile(codeFilePath, code);

// 		// Compile the C++ code
// 		const compileCommand = `g++ ${codeFilePath} -o ${exeFileName}`;
// 		ptyProcess = pty.spawn(shell, ["-c", compileCommand], {
// 			name: "xterm-color",
// 			cwd: jobDir,
// 			env: process.env,
// 		});

// 		// Handle compilation output
// 		ptyProcess.onData((data) => {
// 			// console.log("Compilation Output: ", data);
// 			io.to(socket.id).emit("terminal:data", {
// 				sessionId,
// 				data,
// 			});
// 		});

// 		ptyProcess.on("exit", async (code) => {
// 			if (code === 0) {
// 				// console.log("Compilation successful, running the executable...");

// 				// Run the compiled executable
// 				runProcess = pty.spawn(exeFilePath, [], {
// 					name: "xterm-color",
// 					cwd: jobDir,
// 					env: process.env,
// 				});

// 				runProcess.onData((data) => {
// 					io.to(socket.id).emit("terminal:data", {
// 						sessionId,
// 						data,
// 					});
// 				});

// 				socket.on("terminal:write", (inputData) => {
// 					runProcess.write(inputData); // Pass input to the running program
// 				});

// 				runProcess.on("exit", (code) => {
// 					let output = "";
// 					if (code === 0) {
// 						// output = `\n\n===  Program exited with code ${code}  ===`;
// 						output = `\n\n===  Execution Successful  ===`;
// 					} else {
// 						output = `\n\n===  Runtime Error ===`;
// 					}
// 					io.to(socket.id).emit("terminal:data", {
// 						sessionId,
// 						data: output,
// 					});
// 					io.to(socket.id).emit("terminal:exit", { sessionId });
// 					clearDirIfExists(jobDir, "RUNPROCESS EXIT");
// 				});
// 			} else {
// 				io.to(socket.id).emit("terminal:data", {
// 					sessionId,
// 					data: `\n\n===  Execution failed  ===`,
// 				});
// 				socket.disconnect(true);
// 				clearDirIfExists(jobDir, "PTYPROCESS CODE1");
// 			}
// 		});
// 	} catch (err) {
// 		console.error("Error in executeGeneral:", err);
// 		io.to(socket.id).emit("terminal:data", {
// 			sessionId,
// 			data: `Error: ${err.message || "Execution failed"}`,
// 		});
// 		socket.on("disconnect", () => {
// 			console.log(
// 				`User disconnected: sessionId:${socket.sessionId} socket:${socket.id}`
// 			);
// 		});
// 		clearDirIfExists(jobDir, "CATCH BLOCK");
// 	}
// };

// async function clearDirIfExists(jobDir, where) {
// 	try {
// 		await fs.promises.access(jobDir);
// 		await fs.promises.rm(jobDir, { recursive: true, force: true });
// 		console.log(`Job directory ${jobDir} removed from ${where}`);
// 	} catch (err) {
// 		if (err.code !== "ENOENT") {
// 			// Check if the error is specifically "no such file or directory"
// 			console.error(`Failed to remove ${jobDir}: from ${where}`, err.message);
// 		}
// 	}
// }

// module.exports = { executeGeneral };

// const pty = require("node-pty");
// const path = require("path");
// const os = require("os");
// const shell = os.platform() === "win32" ? "powershell.exe" : "bash";
// const fs = require("fs");
// const SANDBOX_PATH =
// 	"D:/Akash/MERN/CODEDECODE/code-decode-testing-backup/sandbox";

// const executeGeneral = async (
// 	input,
// 	command,
// 	dockerImage,
// 	code,
// 	language,
// 	socket,
// 	io
// ) => {
// 	// Notify the client to reset the terminal
// 	// io.to(socket.id).emit("session:reset", { sessionId: socket.sessionId });

// 	const sessionId = socket.sessionId;
// 	const fileId = sessionId;
// 	const jobDir = path.join(SANDBOX_PATH, `${fileId}`);
// 	// const fileExtension = getFileExtension(language);
// 	const codeFilePath = path.join(jobDir, `main.${language}`);
// 	const exeFileName = getExecutableName(language);
// 	const exeFilePath = path.join(jobDir, exeFileName);
// 	let runProcess = null;

// 	try {
// 		await fs.promises.mkdir(jobDir, { recursive: true });
// 		await fs.promises.writeFile(codeFilePath, code);

// 		// Compile the code if necessary
// 		const compileCommand = getCompileCommand(
// 			language,
// 			codeFilePath,
// 			exeFilePath
// 		);
// 		if (compileCommand) {
// 			await runPtyProcess(
// 				compileCommand,
// 				jobDir,
// 				socket,
// 				io,
// 				sessionId,
// 				"compile"
// 			);
// 		}

// 		// Execute the code
// 		const executeCommand = getExecuteCommand(
// 			language,
// 			exeFilePath,
// 			codeFilePath
// 		);
// 		runProcess = await runPtyProcess(
// 			executeCommand,
// 			jobDir,
// 			socket,
// 			io,
// 			sessionId,
// 			"execute"
// 		);

// 		// Emit success message
// 		io.to(socket.id).emit("terminal:data", {
// 			sessionId,
// 			data: "\n\n=== Execution Completed Successfully ===",
// 		});
// 	} catch (err) {
// 		// Handle compile/runtime errors
// 		// console.log(err);
// 		io.to(socket.id).emit("terminal:data", {
// 			sessionId,
// 			data: `\n\n=== ${err.message || "Execution failed"} ===`,
// 		});
// 	} finally {
// 		// Always clear the directory and disconnect the socket
// 		io.to(socket.id).emit("terminal:exit", { sessionId });
// 		await clearDirIfExists(jobDir, "FINAL CLEANUP");
// 		socket.disconnect(true);
// 	}
// };

// const getExecutableName = (language) => {
// 	const executables = {
// 		cpp: "main.exe",
// 		java: "Main",
// 		// go: "main",
// 	};
// 	return executables[language] || "script";
// };

// const getCompileCommand = (language, codeFilePath, exeFilePath) => {
// 	const compileCommands = {
// 		cpp: `g++ ${codeFilePath} -o ${exeFilePath}`,
// 		java: `javac ${codeFilePath}`,
// 		// go: `go build -o ${exeFilePath} ${codeFilePath}`,
// 	};
// 	return compileCommands[language] || null;
// };

// const getExecuteCommand = (language, exeFilePath, codeFilePath) => {
// 	const executeCommands = {
// 		cpp: exeFilePath,
// 		py: `python3 ${codeFilePath}`,
// 		java: `java -cp ${path.dirname(codeFilePath)} Main`,
// 		// go: exeFilePath,
// 		go: `go run ${codeFilePath}`,
// 		js: `node ${codeFilePath}`,
// 	};
// 	return executeCommands[language] || "";
// };

// const runPtyProcess = (command, cwd, socket, io, sessionId, stage) => {
// 	return new Promise((resolve, reject) => {
// 		const ptyProcessInstance = pty.spawn(shell, ["-c", command], {
// 			name: "xterm-color",
// 			cwd,
// 			env: process.env,
// 		});

// 		socket.ptyProcess = ptyProcessInstance;

// 		socket.on("terminal:write", (inputData) => {
// 			ptyProcessInstance.write(inputData); // Pass input to the running program
// 		});

// 		ptyProcessInstance.onData((data) => {
// 			// const data = d.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "");
// 			io.to(socket.id).emit("terminal:data", {
// 				sessionId,
// 				data,
// 			});
// 		});

// 		ptyProcessInstance.on("exit", (code) => {
// 			if (code === 0) {
// 				resolve();
// 			} else {
// 				reject(
// 					new Error(
// 						`${
// 							stage === "compile" ? "Compilation" : "Execution"
// 						} failed with exit code ${code}`
// 					)
// 				);
// 			}
// 		});
// 	});
// };

// async function clearDirIfExists(jobDir, where) {
// 	try {
// 		await fs.promises.access(jobDir);
// 		await fs.promises.rm(jobDir, { recursive: true, force: true });
// 		console.log(`Job directory ${jobDir} removed from ${where}`);
// 	} catch (err) {
// 		if (err.code !== "ENOENT") {
// 			console.error(`Failed to remove ${jobDir}: from ${where}`, err.message);
// 		}
// 	}
// }

// module.exports = { executeGeneral };

const pty = require("node-pty");
const path = require("path");
const os = require("os");
const fs = require("fs");

const shell = os.platform() === "win32" ? "powershell.exe" : "bash";
const SANDBOX_PATH =
	"D:/Akash/MERN/CODEDECODE/code-decode-testing-backup/sandbox";

const executeGeneral = async (
	input,
	command,
	dockerImage,
	code,
	language,
	socket,
	io
) => {
	const sessionId = socket.sessionId;
	const jobDir = path.join(SANDBOX_PATH, `${sessionId}`);
	const codeFilePath = path.join(jobDir, `main.${language}`);

	try {
		// Prepare job directory and write code file
		await fs.promises.mkdir(jobDir, { recursive: true });
		await fs.promises.writeFile(codeFilePath, code);

		// Define Docker command for execution
		const dockerCommand = `docker run --rm -it \
    -v ${jobDir}:/app/sandbox \
    -w /app/sandbox \
    ${dockerImage} /bin/sh -c "${command}"`;

		// Run Docker command
		await runPtyProcess(
			dockerCommand,
			jobDir,
			socket,
			io,
			sessionId,
			"execute"
		);

		// Notify successful execution
		io.to(socket.id).emit("terminal:data", {
			sessionId,
			data: `\n\n=== Execution Completed Successfully ===`,
		});
	} catch (err) {
		// Handle errors during execution
		io.to(socket.id).emit("terminal:data", {
			sessionId,
			data: `\n\n=== ${err.message || "Execution failed"} ===`,
		});
	} finally {
		// Clean up and disconnect
		io.to(socket.id).emit("terminal:exit", { sessionId });
		await clearDirIfExists(jobDir, "FINAL CLEANUP");
		socket.disconnect(true);
	}
};

// Helper function to run Docker process with node-pty
const runPtyProcess = (command, cwd, socket, io, sessionId, stage) => {
	return new Promise((resolve, reject) => {
		const ptyProcessInstance = pty.spawn(shell, ["-c", command], {
			name: "xterm-color",
			cwd,
			env: process.env,
		});

		// Bind WebSocket for real-time terminal updates
		socket.ptyProcess = ptyProcessInstance;

		socket.on("terminal:write", (inputData) => {
			ptyProcessInstance.write(inputData); // Send input to Docker container
		});

		ptyProcessInstance.onData((data) => {
			io.to(socket.id).emit("terminal:data", {
				sessionId,
				data,
			});
		});

		ptyProcessInstance.on("exit", (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(
					new Error(
						`${
							stage === "compile" ? "Compilation" : "Execution"
						} failed with exit code ${code}`
					)
				);
			}
		});
	});
};

// Utility to clear job directory
async function clearDirIfExists(jobDir, where) {
	try {
		await fs.promises.access(jobDir);
		await fs.promises.rm(jobDir, { recursive: true, force: true });
		console.log(`Job directory ${jobDir} removed from ${where}`);
	} catch (err) {
		if (err.code !== "ENOENT") {
			console.error(`Failed to remove ${jobDir}: from ${where}`, err.message);
		}
	}
}

module.exports = { executeGeneral };
