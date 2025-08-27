import "dotenv/config";
import { startDiscordBot, client } from "./discord";
import { logger } from "./utils/logger";
import { startWebServer } from "./server";
import * as fs from "fs";
import { initializeAI } from "./ai";

//-------------------------------------------------------
// Main Execution
//-------------------------------------------------------
async function main() {
	const logFilePath = "log.log";
	if (fs.existsSync(logFilePath)) {
		fs.writeFileSync(logFilePath, "");
	}
	logger.log("Starting bot...");
	initializeAI();
	startDiscordBot();
	const webServerPort = process.env.WEB_SERVER_PORT ? parseInt(process.env.WEB_SERVER_PORT) : 3000;
	startWebServer({ port: webServerPort, discordClient: client });
}

main();
