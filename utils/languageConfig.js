const LANGUAGE_CONFIG = {
	cpp: {
		command: `g++ main.cpp -o main && ./main`,
		dockerImage: `cpp:v1`,
	},
	py: {
		command: `python3 main.py`,
		dockerImage: `py:v1`,
	},
	java: {
		command: `javac Main.java && java Main`,
		dockerImage: `java:v1`,
	},
	go: {
		command: `go run main.go`,
		dockerImage: `go:v2`,
	},
	js: {
		command: `node main.js`,
		dockerImage: `node:v1`,
	},
};

module.exports = LANGUAGE_CONFIG;
