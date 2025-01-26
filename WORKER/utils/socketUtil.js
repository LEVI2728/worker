const waitForSocket = async (sessionId, io, timeout = 10000) => {
	const pollInterval = 100;
	const start = Date.now();

	while (Date.now() - start < timeout) {
		const socket = findSocketBySessionId(sessionId, io);
		if (socket) return socket;
		await new Promise((resolve) => setTimeout(resolve, pollInterval));
	}

	throw new Error(
		`Socket connection not established for sessionId: ${sessionId}`
	);
};

const findSocketBySessionId = (sessionId, io) => {
	for (const socket of io.sockets.sockets.values()) {
		if (socket.sessionId === sessionId) return socket;
	}
	return null;
};

module.exports = { waitForSocket };
