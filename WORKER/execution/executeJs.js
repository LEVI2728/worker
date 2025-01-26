const { spawn } = require("child_process");
const { executeGeneral } = require("./executeGeneral");

const executeJs = async (jobData, socket, io) => {
	// const command = `node ${filepath}`;
	const filepath = "D:\\Akash\\MERN\\CODEDECODE\\code-decode\\execution\\codes";
	// const command = `node /app/source/main.js`;
	const command = `node main.js`;

	return executeGeneral(
		jobData.input,
		command,
		"node:v1",
		jobData.code,
		jobData.language,
		socket,
		io
	);
	// return new Promise((resolve, reject) => {
	// 	exec(`node ${filepath}`, (err, stdout, stderr) => {
	// 		err && reject({ err, stderr });
	// 		stderr && reject(stderr);
	// 		resolve(stdout);
	// 	});
	// });
};

module.exports = { executeJs };
