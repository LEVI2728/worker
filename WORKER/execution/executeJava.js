const path = require("path");
const fs = require("fs");
const { executeGeneral } = require("./executeGeneral");

const executeJava = async (jobData, socket, io) => {
	// const id = path.basename(jobData.filepath).split(".")[0];
	// const command = `g++ /app/source/main.cpp -o /app/source/main.exe && /app/source/main.exe`;
	// const command = `javac /app/source/${id}.java && java -cp /app/source ${id}`;
	// const filepath = "D:\\Akash\\MERN\\CODEDECODE\\code-decode\\execution\\codes"; // Path to the directory
	const command = `javac Main.java && java Main`;
	return executeGeneral(
		jobData.input,
		command,
		"java:v1",
		jobData.code,
		jobData.language,
		socket,
		io
	);
};

// const outputDir = path.join(__dirname, "outputs");
// // D:\Akash\MERN\code-decode\outputs

// if (!fs.existsSync(outputDir)) {
// 	fs.mkdirSync(outputDir, { recursive: true });
// }

// const executeJava = async (jobId) => {
// 	const jobData = await Job.findById(jobId);

// 	const id = path.basename(jobData.filepath).split(".")[0];
// 	const outputPath = path.join(outputDir, `${id}.java`);
// 	// D:\Akash\MERN\code-decode\outputs\Main.java
// 	const command = `javac -d ${outputPath} ${jobData.filepath} && cd ${outputPath} && java ${id}`;

// 	jobData.outputfilepath = outputPath;
// 	jobData.save();

// 	return await executeGeneral(jobData.input, command);
// };

module.exports = { executeJava };
