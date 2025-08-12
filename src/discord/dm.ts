import { Message, ChannelType } from "discord.js";
import { getUserHistory, appendToHistory, saveUserHistory } from "../memory";
import { generateText } from "../ai";

export async function handleDirectMessage(message: Message, persona: string): Promise<void> {
	try {
		if (message.author.bot || !message.channel || message.channel.type !== ChannelType.DM) {
			return;
		}
		await message.channel.sendTyping();
		console.log(`Received DM from ${message.author.tag}: ${message.content}`);

		const userId = message.author.id;
		const userHistory = await getUserHistory(userId);

		appendToHistory(userHistory, "user", message.content);

		const fullText = await generateText(persona, userHistory);

		if (fullText) {
			appendToHistory(userHistory, "model", fullText);
			await saveUserHistory(userId, userHistory);
		}

		const textToSend = fullText || "...";
		const chunkSize = 2000;
		for (let i = 0; i < textToSend.length; i += chunkSize) {
			await message.channel.send(textToSend.substring(i, i + chunkSize));
		}
		console.log(`Sent response to ${message.author.tag}`);
	} catch (error) {
		console.error(`Error processing message from ${message.author.tag}:`, error);
		await message.reply("Sorry, I encountered an error. Please try again later.");
	}
}
