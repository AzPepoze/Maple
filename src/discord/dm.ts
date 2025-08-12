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

		const codeBlockStart = textToSend.indexOf("```");
		const codeBlockEnd = textToSend.indexOf("```", codeBlockStart + 3);

		if (codeBlockStart !== -1 && codeBlockEnd !== -1) {
			const textBefore = textToSend.substring(0, codeBlockStart).trim();
			const codeBlockContent = textToSend.substring(codeBlockStart, codeBlockEnd + 3).trim();
			const textAfter = textToSend.substring(codeBlockEnd + 3).trim();

			// Send text before
			if (textBefore.length > 0) {
				for (let i = 0; i < textBefore.length; i += chunkSize) {
					await message.channel.send(textBefore.substring(i, i + chunkSize));
				}
			}

			// Extract language
			const firstNewlineIndex = codeBlockContent.indexOf("\n");
			let language = "txt"; // Default language
			let codeContent = codeBlockContent;

			if (firstNewlineIndex !== -1) {
				const langPart = codeBlockContent.substring(3, firstNewlineIndex).trim(); // Get "py" from "```py\n"
				if (langPart) {
					language = langPart;
				}
				codeContent = codeBlockContent.substring(firstNewlineIndex + 1); // Get content after first newline
			} else {
				// No newline, so it's just ``` or ```lang without content
				codeContent = codeBlockContent.substring(3); // Remove initial ```
			}

			// Remove trailing ```
			codeContent = codeContent.substring(0, codeContent.lastIndexOf("```")).trim();

			// Send code block
			if (codeContent.length > chunkSize) {
				// Only send as file if over 2000 chars
				const buffer = Buffer.from(codeContent, "utf-8");
				await message.channel.send({
					files: [
						{
							attachment: buffer,
							name: `code_block.${language}`, // Use extracted language
						},
					],
				});
			} else {
				for (let i = 0; i < codeContent.length; i += chunkSize) {
					await message.channel.send(
						`\`\`\`${language}\n${codeContent.substring(i, i + chunkSize)}\n\`\`\``
					);
				}
			}

			// Send text after
			if (textAfter.length > 0) {
				for (let i = 0; i < textAfter.length; i += chunkSize) {
					await message.channel.send(textAfter.substring(i, i + chunkSize));
				}
			}
		} else {
			// Original chunking logic if no code block found
			for (let i = 0; i < textToSend.length; i += chunkSize) {
				await message.channel.send(textToSend.substring(i, i + chunkSize));
			}
		}
		console.log(`Sent response to ${message.author.tag}`);
	} catch (error) {
		console.error(`Error processing message from ${message.author.tag}:`, error);
		await message.reply("Sorry, I encountered an error. Please try again later.");
	}
}
