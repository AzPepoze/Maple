import { Message, ChannelType } from "discord.js";
import { getUserHistory, appendToHistory, saveUserHistory } from "../ai/memory";
import { generateText } from "../ai";
import { logger } from "../utils/logger";

export async function handleDirectMessage(message: Message): Promise<void> {
	try {
		if (message.author.bot || !message.channel || message.channel.type !== ChannelType.DM) {
			return;
		}
		await message.channel.sendTyping();
		logger.log(`Received DM from ${message.author.tag}: ${message.content}`);

		const userId = message.author.id;
		const userHistory = await getUserHistory(userId);

		appendToHistory(userHistory, "user", message.content);

		logger.log(`Generating AI response for ${message.author.tag}...`);
		const startTime = process.hrtime.bigint();
		const fullText = await generateText(userHistory);
		const endTime = process.hrtime.bigint();
		const duration = Number(endTime - startTime) / 1_000_000;

		logger.log(`AI response generated for ${message.author.tag} in ${duration.toFixed(2)} ms.`);

		if (fullText) {
			appendToHistory(userHistory, "model", fullText);
			await saveUserHistory(userId, userHistory);
		}

		logger.log(`AI response to ${message.author.tag}: ${fullText}`);

		const textToSend = fullText || "...";
		const chunkSize = 2000;

		const parts = textToSend.split(/(```[\s\S]*?```)/g);

		for (const part of parts) {
			if (!part || part.trim() === "") {
				continue;
			}

			if (part.startsWith("```") && part.endsWith("```")) {
				const codeBlock = part;

				const langMatch = codeBlock.match(/^```(\w*)\n/);
				const language = langMatch && langMatch[1] ? langMatch[1] : "txt";
				const codeContent = codeBlock
					.replace(/^```(\w*)\n?/, "")
					.replace(/```$/, "")
					.trim();

				if (codeBlock.length > chunkSize) {
					const buffer = Buffer.from(codeContent, "utf-8");
					await message.channel.send({
						files: [
							{
								attachment: buffer,
								name: `code.${language}`,
							},
						],
					});
				} else {
					await message.channel.send(codeBlock);
				}
			} else {
				const textPart = part;
				if (textPart.length > 0) {
					for (let i = 0; i < textPart.length; i += chunkSize) {
						await message.channel.send(textPart.substring(i, i + chunkSize));
					}
				}
			}
		}
		logger.log(`Sent response to ${message.author.tag}`);
	} catch (error) {
		logger.error(`Error processing message from ${message.author.tag}:`, error);
		await message.reply("Sorry, I encountered an error. Please try again later.");
	}
}
