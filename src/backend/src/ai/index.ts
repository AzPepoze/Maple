import { ChatHistory } from "./memory";
import { logger } from "../utils/logger";

// This file handles AI-related functionalities.
import { GeminiAI } from "./providers/gemini";
import { LlamaCPP } from "./providers/llama-cpp";
import { AIProvider } from "./aiProvider";

//-------------------------------------------------------
// AI Provider Factory
//-------------------------------------------------------
export let currentAI: AIProvider;

export async function initializeAI() {
	const aiProvider = process.env.AI_PROVIDER || "GEMINI";

	switch (aiProvider) {
		case "GEMINI":
			currentAI = new GeminiAI();
			logger.info("Using Gemini AI provider.");
			break;
		case "LLAMA_CPP":
			currentAI = new LlamaCPP();
			logger.info(`Using Llama CPP AI provider.`);
			break;
		default:
			throw new Error(`Unsupported AI_PROVIDER: ${aiProvider}`);
	}

	await currentAI.init();
}

//-------------------------------------------------------
// Public Functions (Exported from currentAI)
//-------------------------------------------------------
export const generateText = (history: ChatHistory) => currentAI.generateText(history);
export const countTokens = (history: ChatHistory) => currentAI.countTokens(history);
