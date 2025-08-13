import "dotenv/config";
import { startDiscordBot, client } from "./discord";
import { logger } from "./utils/logger"; // Import logger
import { startWebServer } from "./server"; // Import web server
import * as fs from 'fs';

//-------------------------------------------------------
// Main Execution
//-------------------------------------------------------
async function main() {
	// Clear log.log at startup
	const logFilePath = 'log.log';
	if (fs.existsSync(logFilePath)) {
		fs.writeFileSync(logFilePath, '');
	}
	logger.log("Starting bot...");
	startDiscordBot();
	const webServerPort = process.env.WEB_SERVER_PORT ? parseInt(process.env.WEB_SERVER_PORT) : 3000;
	startWebServer({ port: webServerPort, discordClient: client }); // Start web server on specified port or 3000
}

main();
