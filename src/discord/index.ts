import { Client, GatewayIntentBits, Partials, Message } from "discord.js";
import { handleDirectMessage } from "./dm";
import { logger } from '../logger'; // Import logger

//-------------------------------------------------------
// Environment Variable Validation
//-------------------------------------------------------
const discordToken = process.env.DISCORD_BOT_TOKEN;
if (!discordToken) {
	throw new Error("DISCORD_BOT_TOKEN is not defined in the .env file.");
}

//-------------------------------------------------------
// Initialization
//-------------------------------------------------------
export const client = new Client({
	intents: [GatewayIntentBits.DirectMessages, GatewayIntentBits.MessageContent],
	partials: [Partials.Channel, Partials.Message],
});

//-------------------------------------------------------
// Public Functions
//-------------------------------------------------------
export function startDiscordBot() {
	client.once("ready", () => {
		if (client.user) {
			logger.log(`Logged in as ${client.user.tag}!`);
			logger.log("Bot is ready and waiting for DMs.");
		}
	});

	client.on("messageCreate", async (message: Message) => {
		await handleDirectMessage(message);
	});

	client.login(discordToken).catch((error) => {
		logger.error("Failed to log in to Discord:", error);
		logger.error("Please ensure your DISCORD_BOT_TOKEN is correct.");
		process.exit(1);
	});
}
