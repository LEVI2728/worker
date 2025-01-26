const executionHandler = require("./executionHandler");

const QUEUE_NAME = "CodeExecution";

const startProcessingQueue = (redis, io) => {
	(async function processQueue() {
		while (true) {
			console.log("job");
			try {
				const message = await redis.brpop(QUEUE_NAME, 0); // Blocking pop
				const jobData = JSON.parse(message[1]);
				await executionHandler(jobData, io);
			} catch (queueError) {
				console.error("Queue processing error:", queueError);
			}
		}
	})();
};

module.exports = { startProcessingQueue };
