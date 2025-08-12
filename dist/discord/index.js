"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startDiscordBot = startDiscordBot;
const discord_js_1 = require("discord.js");
const dm_1 = require("./dm");
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
const client = new discord_js_1.Client({
    intents: [discord_js_1.GatewayIntentBits.DirectMessages, discord_js_1.GatewayIntentBits.MessageContent],
    partials: [discord_js_1.Partials.Channel, discord_js_1.Partials.Message],
});
//-------------------------------------------------------
// Public Functions
//-------------------------------------------------------
function startDiscordBot(persona) {
    client.once("ready", () => {
        if (client.user) {
            console.log(`Logged in as ${client.user.tag}!`);
            console.log("Bot is ready and waiting for DMs.");
        }
    });
    client.on("messageCreate", async (message) => {
        await (0, dm_1.handleDirectMessage)(message, persona);
    });
    client.login(discordToken).catch((error) => {
        console.error("Failed to log in to Discord:", error);
        console.error("Please ensure your DISCORD_BOT_TOKEN is correct.");
        process.exit(1);
    });
}
