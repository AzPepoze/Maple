"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleDirectMessage = handleDirectMessage;
const discord_js_1 = require("discord.js");
const memory_1 = require("../memory");
const ai_1 = require("../ai");
async function handleDirectMessage(message, persona) {
    try {
        if (message.author.bot || !message.channel || message.channel.type !== discord_js_1.ChannelType.DM) {
            return;
        }
        await message.channel.sendTyping();
        console.log(`Received DM from ${message.author.tag}: ${message.content}`);
        const userId = message.author.id;
        const userHistory = await (0, memory_1.getUserHistory)(userId);
        (0, memory_1.appendToHistory)(userHistory, "user", message.content);
        const fullText = await (0, ai_1.generateText)(persona, userHistory);
        if (fullText) {
            (0, memory_1.appendToHistory)(userHistory, "model", fullText);
            await (0, memory_1.saveUserHistory)(userId, userHistory);
        }
        await message.channel.send(fullText || "...");
        console.log(`Sent response to ${message.author.tag}`);
    }
    catch (error) {
        console.error(`Error processing message from ${message.author.tag}:`, error);
        await message.reply("Sorry, I encountered an error. Please try again later.");
    }
}
