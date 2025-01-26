const path = require("path");
const { executeGeneral } = require("./executeGeneral");

const executeCpp = async (jobData, socket, io) => {
	// const id = path.basename(jobData.filepath).split(".")[0];
	// const command = `g++ /app/source/${id}.cpp -o /app/source/${id}.exe && ./app/source/${id}.exe`;
	// const command = `g++ /app/source/main.cpp -o /app/source/main.exe && /app/source/main.exe`;
	const filepath = "D:\\Akash\\MERN\\CODEDECODE\\code-decode\\execution\\codes"; // Path to the directory
	const command = `g++ main.cpp -o main && ./main`;
	return executeGeneral(
		jobData.input,
		command,
		"cpp:v1",
		jobData.code,
		jobData.language,
		socket,
		io
	);
};

// const outputDir = path.join(__dirname, "outputs");

// if (!fs.existsSync(outputDir)) {
// 	fs.mkdirSync(outputDir, { recursive: true });
// }

// const executeCpp = async (jobId) => {
// 	const jobData = await Job.findById(jobId);

// 	const id = path.basename(jobData.filepath).split(".")[0];
// 	let command = "";
// 	let outputPath = "";
// 	if (process.platform == "win32" || process.platform == "win64") {
// 		outputPath = path.join(outputDir, `${id}.exe`);
// 		command = `g++ ${jobData.filepath} -o ${outputPath} && cd ${outputDir} && ${id}.exe`;
// 	} else {
// 		outputPath = path.join(outputDir, `${id}.out`);
// 		command = `g++ ${jobData.filepath} -o ${outputPath} && cd ${outputDir} && ./${id}.out`;
// 	}

// 	// const outputPath = path.join(outputDir, `${id}.out`);
// 	// command = `g++ ${jobData.filepath} -o ${outputPath} && cd ${outputDir} && ./${id}.out`;

// 	jobData.outputfilepath = outputPath;
// 	jobData.save();
// 	return await executeGeneral(jobData.input, command);
// };

module.exports = { executeCpp };
