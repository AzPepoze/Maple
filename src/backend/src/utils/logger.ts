import * as fs from "fs";

const LOG_FILE = "log.log";

function emitLog(level: string, message: string, ...args: any[]) {
	const timestamp = new Date().toISOString();
	const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

	fs.appendFileSync(LOG_FILE, logMessage + "\n");

	if (level === "log") {
		console.log(logMessage, ...args);
	} else if (level === "info") {
		console.info(logMessage, ...args);
	} else if (level === "warn") {
		console.warn(logMessage, ...args);
	} else if (level === "error") {
		console.error(logMessage, ...args);
	} else if (level === "debug") {
		console.debug(logMessage, ...args);
	}
}

export const logger = {
	log: (message: string, ...args: any[]) => emitLog("log", message, ...args),
	info: (message: string, ...args: any[]) => emitLog("info", message, ...args),
	warn: (message: string, ...args: any[]) => emitLog("warn", message, ...args),
	error: (message: string, ...args: any[]) => emitLog("error", message, ...args),
	debug: (message: string, ...args: any[]) => emitLog("debug", message, ...args),
};
