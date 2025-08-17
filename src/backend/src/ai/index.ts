import { ChatHistory } from "./memory";
import { logger } from "../utils/logger";

// This file handles AI-related functionalities.

import { GeminiAI } from "./providers/gemini";
import { OllamaAI } from "./providers/ollama";
import { AIProvider } from "./aiProvider";

//-------------------------------------------------------
// AI Provider Factory
//-------------------------------------------------------
export let currentAI: AIProvider;

export async function initializeAI() {
	const aiProvider = process.env.AI_PROVIDER || "GEMINI"; // Default to GEMINI

	if (aiProvider === "GEMINI") {
		currentAI = new GeminiAI();
		logger.info("Using Gemini AI provider.");
	} else if (aiProvider === "OLLAMA") {
		currentAI = new OllamaAI();
		logger.info(`Using Ollama AI provider.`);
	} else {
		throw new Error(`Unsupported AI_PROVIDER: ${aiProvider}`);
	}

	await currentAI.init();
}

//-------------------------------------------------------
// Public Functions (Exported from currentAI)
//-------------------------------------------------------
export const generateText = (history: ChatHistory) => currentAI.generateText(history);
export const countTokens = (history: ChatHistory) => currentAI.countTokens(history);
export const isSafeContent = (text: string) => currentAI.isSafeContent(text);