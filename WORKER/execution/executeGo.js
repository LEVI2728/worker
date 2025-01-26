const { executeGeneral } = require("./executeGeneral");

const executeGo = async (jobData, socket, io) => {
	// const command = `go run ${filepath}`;
	const filepath = "D:\\Akash\\MERN\\CODEDECODE\\code-decode\\execution\\codes"; // Path to the directory
	// const command = `go run /app/source/main.go`;
	const command = `go run main.go`;
	return executeGeneral(
		jobData.input,
		command,
		"go:v1",
		jobData.code,
		jobData.language,
		socket,
		io
	);
};

module.exports = { executeGo };
