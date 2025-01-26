const fs = require("fs");

const clearDirIfExists = async (dirPath) => {
	try {
		await fs.promises.access(dirPath);
		await fs.promises.rm(dirPath, { recursive: true, force: true });
	} catch (err) {
		if (err.code !== "ENOENT")
			console.error(`Failed to remove ${dirPath}:`, err.message);
	}
};

module.exports = { clearDirIfExists };
