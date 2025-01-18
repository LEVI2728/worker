// const { waitForSocket } = require("../utils/socketUtil");
// const LANGUAGE_CONFIG = require("../utils/languageConfig");
// const { executeGeneral } = require("./executeGeneral");

// const executionHandler = async (jobData, io) => {
// 	const { sessionId, language } = jobData;
// 	try {
// 		const socket = await waitForSocket(sessionId, io);

// 		const config = LANGUAGE_CONFIG[language];
// 		if (!config) {
// 			io.to(socket.id).emit("error", `Unsupported language: ${language}`);
// 			return;
// 		}
// 		await executeGeneral(
// 			jobData,
// 			config.command,
// 			config.dockerImage,
// 			socket,
// 			io
// 		);
// 	} catch (error) {
// 		console.log(
// 			`Error processing job for sessionId: ${sessionId}`,
// 			error.message
// 		);
// 	}
// };

// module.exports = executionHandler;

const LANGUAGE_CONFIG = require("../utils/languageConfig");
const { executeGeneral } = require("./executeGeneral");

const executionHandler = async (jobData, workerPublisher, workerSubscriber) => {
	const { sessionId, language } = jobData;

	try {
		const config = LANGUAGE_CONFIG[language];
		if (!config) {
			await workerPublisher.publish(
				`output:${sessionId}`,
				JSON.stringify({
					type: "error",
					message: `Unsupported language: ${language}`,
				})
			);
			return;
		}

		await executeGeneral(
			jobData,
			config.command,
			workerPublisher,
			workerSubscriber
		);
	} catch (error) {
		await workerPublisher.publish(
			`output:${sessionId}`,
			JSON.stringify({
				type: "error",
				message: error.message || "Execution failed",
			})
		);
	}
};

module.exports = executionHandler;
