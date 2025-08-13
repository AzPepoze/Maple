import * as fs from "fs/promises";
import * as path from "path";
import { logger } from "../utils/logger";
import { MEMORY_PATH, MAX_HISTORY_TOKENS } from "../config";
import { currentAI } from "./index";
import { loadSummarizePrompt } from "./utils";

//------------------------------------------------------- 
// Types
//------------------------------------------------------- 
export interface ChatPart {
	text?: string;
	functionResponse?: { name: string; response: { content: string } };
}

export interface ChatContent {
	role: "user" | "model" | "function";
	parts: ChatPart[];
}

export type ChatHistory = ChatContent[];

interface Memory {
	[userId: string]: ChatHistory;
}

//------------------------------------------------------- 
// Internal Memory Functions
//------------------------------------------------------- 
async function loadMemory(): Promise<Memory> {
	try {
		await fs.mkdir(path.dirname(MEMORY_PATH), { recursive: true });
		const data = await fs.readFile(MEMORY_PATH, "utf-8");
		return data ? (JSON.parse(data) as Memory) : {};
	} catch (error: any) {
		if (error.code === "ENOENT") {
			await fs.writeFile(MEMORY_PATH, JSON.stringify({}, null, 2), "utf-8");
			return {};
		}
		logger.error("Error reading or parsing memory.json:", error);
		return {};
	}
}

async function saveMemory(memory: Memory): Promise<void> {
	try {
		await fs.mkdir(path.dirname(MEMORY_PATH), { recursive: true });
		await fs.writeFile(MEMORY_PATH, JSON.stringify(memory, null, 2), "utf-8");
	} catch (error) {
		logger.error("Error saving memory:", error);
	}
}

async function summarizeHistory(history: ChatHistory): Promise<ChatHistory> {
	if (!currentAI) {
		logger.warn("AI provider not initialized. Cannot summarize history.");
		return history;
	}

	logger.info("Summarizing chat history...");
	const historyToSummarize = history.slice(0, -6);
	const fullText = historyToSummarize.map(item => item.parts.map(part => part.text).join(" ")).join("\n");
	const summarizePromptTemplate = await loadSummarizePrompt();
	const prompt = summarizePromptTemplate.replace('{history}', fullText);

	try {
		const summary = await currentAI.generateText([{ role: "user", parts: [{ text: prompt }] }]);
		logger.info("Chat history summarized successfully.");
		return [{ role: "model", parts: [{ text: `(Summarized previous conversation: ${summary})` }] }];
	} catch (error) {
		logger.error("Failed to summarize chat history:", error);
		return history;
	}
}

//------------------------------------------------------- 
// Public History Functions
//------------------------------------------------------- 
export async function getUserHistory(userId: string): Promise<ChatHistory> {
	const memory = await loadMemory();
	return memory[userId] || [];
}

export function appendToHistory(history: ChatHistory, role: "user" | "model", text: string): void {
	history.push({ role, parts: [{ text }] });
}

export async function saveUserHistory(userId: string, history: ChatHistory): Promise<void> {
	const memory = await loadMemory();

	if (currentAI) {
		const historyText = history.map(item => item.parts.map(part => part.text).join(" ")).join(" ");
		const currentTokens = await currentAI.countTokens(historyText);

		if (currentTokens > MAX_HISTORY_TOKENS) {
			logger.info(`History for user ${userId} exceeds ${MAX_HISTORY_TOKENS} tokens (${currentTokens} tokens). Summarizing...`);
			history = await summarizeHistory(history);
		}
	} else {
		logger.warn("AI provider not initialized. Skipping history summarization.");
	}

	memory[userId] = history;
	await saveMemory(memory);
}

