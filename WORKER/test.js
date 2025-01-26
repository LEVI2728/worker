const pty = require("node-pty");

const testPty = (index) => {
	const shell = "powershell.exe";
	const ptyProcess = pty.spawn(shell, ["-c", "echo Hello World"], {
		name: "xterm-color",
		cwd: process.cwd(),
		env: process.env,
	});

	console.log(`Process ${index} started with PID: ${ptyProcess.pid}`);

	ptyProcess.onData((data) => {
		console.log(`Output from process ${index}: ${data}`);
	});

	ptyProcess.on("exit", (code) => {
		console.log(`Process ${index} exited with code: ${code}`);
	});
};

for (let i = 0; i < 10; i++) {
	setTimeout(() => testPty(i), i * 1000); // Run sequentially
}
