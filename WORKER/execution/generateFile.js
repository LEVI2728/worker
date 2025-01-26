const path = require("path");
const fs = require("fs");
const { v4: uuid } = require("uuid");

const dirCodes = path.join(__dirname, "codes");
// const outputDir = path.join(__dirname, "outputs");

// fs.rmSync(dirCodes, { recursive: true, force: true });
// fs.rmSync(outputDir, { recursive: true, force: true });

if (!fs.existsSync(dirCodes)) {
	fs.mkdirSync(dirCodes, { recursive: true });
}

const generateFile = async (format, content) => {
	if (format === "java") {
		const word = "class";
		const index = content.indexOf(word);
		const length = word.length;

		const result = content.slice(index + (length + 1));

		let classname =
			result.substring(0, result.indexOf(" ")) &&
			result.substring(0, result.indexOf("{"));
		// console.log(classname, classname.length);

		let cn = classname.substring(0, classname.indexOf(" "));
		if (cn.length > 0) {
			const filename = `${cn}.${format}`;
			const filepath = path.join(dirCodes, filename);
			fs.writeFileSync(filepath, content);
			return filepath;
		}

		const filename = `${classname}.${format}`;
		const filepath = path.join(dirCodes, filename);
		fs.writeFileSync(filepath, content);
		return filepath;
	}

	const id = uuid();
	// let filename = `${id}.${format}`;
	let filename = `main.${format}`;

	const filepath = path.join(dirCodes, filename);
	fs.writeFileSync(filepath, content);
	return filepath;
};

module.exports = { generateFile };
