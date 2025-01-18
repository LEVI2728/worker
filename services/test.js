const pty = require("node-pty");
const path = require("path");
const os = require("os");
const shell = os.platform() === "win32" ? "powershell.exe" : "bash";
const fs = require("fs");
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
	// Notify the client to reset the terminal
	// io.to(socket.id).emit("session:reset", { sessionId: socket.sessionId });

	const sessionId = socket.sessionId;
	const fileId = sessionId;
	const jobDir = path.join(SANDBOX_PATH, `${fileId}`);
	// const fileExtension = getFileExtension(language);
	const codeFilePath = path.join(jobDir, `main.${language}`);
	const exeFileName = getExecutableName(language);
	const exeFilePath = path.join(jobDir, exeFileName);
	let runProcess = null;

	try {
		await fs.promises.mkdir(jobDir, { recursive: true });
		await fs.promises.writeFile(codeFilePath, code);

		// Compile the code if necessary
		const compileCommand = getCompileCommand(
			language,
			codeFilePath,
			exeFilePath
		);
		if (compileCommand) {
			await runPtyProcess(
				compileCommand,
				jobDir,
				socket,
				io,
				sessionId,
				"compile"
			);
		}

		// Execute the code
		const executeCommand = getExecuteCommand(
			language,
			exeFilePath,
			codeFilePath
		);
		runProcess = await runPtyProcess(
			executeCommand,
			jobDir,
			socket,
			io,
			sessionId,
			"execute"
		);

		// Emit success message
		io.to(socket.id).emit("terminal:data", {
			sessionId,
			data: "\n\n=== Execution Completed Successfully ===",
		});
	} catch (err) {
		// Handle compile/runtime errors
		// console.log(err);
		io.to(socket.id).emit("terminal:data", {
			sessionId,
			data: `\n\n=== ${err.message || "Execution failed"} ===`,
		});
	} finally {
		// Always clear the directory and disconnect the socket
		io.to(socket.id).emit("terminal:exit", { sessionId });
		await clearDirIfExists(jobDir, "FINAL CLEANUP");
		socket.disconnect(true);
	}
};

const getExecutableName = (language) => {
	const executables = {
		cpp: "main.exe",
		java: "Main",
		// go: "main",
	};
	return executables[language] || "script";
};

const getCompileCommand = (language, codeFilePath, exeFilePath) => {
	const compileCommands = {
		cpp: `g++ ${codeFilePath} -o ${exeFilePath}`,
		java: `javac ${codeFilePath}`,
		// go: `go build -o ${exeFilePath} ${codeFilePath}`,
	};
	return compileCommands[language] || null;
};

const getExecuteCommand = (language, exeFilePath, codeFilePath) => {
	const executeCommands = {
		cpp: exeFilePath,
		py: `python3 ${codeFilePath}`,
		java: `java -cp ${path.dirname(codeFilePath)} Main`,
		// go: exeFilePath,
		go: `go run ${codeFilePath}`,
		js: `node ${codeFilePath}`,
	};
	return executeCommands[language] || "";
};

const runPtyProcess = (command, cwd, socket, io, sessionId, stage) => {
	return new Promise((resolve, reject) => {
		const ptyProcessInstance = pty.spawn(shell, ["-c", command], {
			name: "xterm-color",
			cwd,
			env: process.env,
		});

		socket.ptyProcess = ptyProcessInstance;

		socket.on("terminal:write", (inputData) => {
			ptyProcessInstance.write(inputData); // Pass input to the running program
		});

		ptyProcessInstance.onData((data) => {
			// const data = d.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "");
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
