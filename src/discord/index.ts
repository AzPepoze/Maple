import { Client, GatewayIntentBits, Partials, Message } from "discord.js";
import { handleDirectMessage } from "./dm";

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
const client = new Client({
	intents: [GatewayIntentBits.DirectMessages, GatewayIntentBits.MessageContent],
	partials: [Partials.Channel, Partials.Message],
});

//-------------------------------------------------------
// Public Functions
//-------------------------------------------------------
export function startDiscordBot(persona: string) {
	client.once("ready", () => {
		if (client.user) {
			console.log(`Logged in as ${client.user.tag}!`);
			console.log("Bot is ready and waiting for DMs.");
		}
	});

	client.on("messageCreate", async (message: Message) => {
		await handleDirectMessage(message, persona);
	});

	client.login(discordToken).catch((error) => {
		console.error("Failed to log in to Discord:", error);
		console.error("Please ensure your DISCORD_BOT_TOKEN is correct.");
		process.exit(1);
	});
}
