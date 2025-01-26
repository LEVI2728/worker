const { v1 } = require("uuid");
const { executeGeneral } = require("./executeGeneral");

const executePy = async (jobData, socket, io) => {
	const filepath = "D:\\Akash\\MERN\\CODEDECODE\\code-decode\\execution\\codes"; // Path to the directory
	// const command = `python3 /app/source/main.py`;
	const command = `python3 main.py`;
	return await executeGeneral(
		jobData.input,
		command,
		"py:v1",
		jobData.code,
		jobData.language,
		socket,
		io
	);
};

module.exports = { executePy };
