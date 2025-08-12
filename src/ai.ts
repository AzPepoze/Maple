import { ChatHistory } from "./memory";
import { logger } from './logger'; // Import logger
import { loadPersona } from "./ai/utils";
import { GeminiAI } from "./ai/gemini";
import { OllamaAI } from "./ai/ollama";

//-------------------------------------------------------
// Environment Variable Validation
//-------------------------------------------------------
const aiProvider = process.env.AI_PROVIDER || "GEMINI"; // Default to GEMINI
const geminiApiKey = process.env.GEMINI_API_KEY;
const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

if (aiProvider === "GEMINI" && !geminiApiKey) {
	throw new Error("GEMINI_API_KEY is not defined in the .env file when AI_PROVIDER is GEMINI.");
}

if (aiProvider === "OLLAMA" && !ollamaBaseUrl) {
	throw new Error("OLLAMA_BASE_URL is not defined in the .env file when AI_PROVIDER is OLLAMA.");
}

//-------------------------------------------------------
// Interfaces
//-------------------------------------------------------
export interface AIProvider {
    generateText(history: ChatHistory): Promise<string>;
    countTokens(text: string): Promise<number>;
    isSafeContent(text: string): Promise<boolean>;
}

//-------------------------------------------------------
// AI Provider Factory
//-------------------------------------------------------
let currentAI: AIProvider;

if (aiProvider === "GEMINI") {
    currentAI = new GeminiAI(geminiApiKey!);
    logger.info("Using Gemini AI provider.");
} else if (aiProvider === "OLLAMA") {
    currentAI = new OllamaAI(ollamaBaseUrl!, OLLAMA_MODEL);
    logger.info(`Using Ollama AI provider with model: ${OLLAMA_MODEL} at ${ollamaBaseUrl}.`);
} else {
    throw new Error(`Unsupported AI_PROVIDER: ${aiProvider}`);
}

//-------------------------------------------------------
// Public Functions (Exported from currentAI)
//-------------------------------------------------------
export const generateText = (history: ChatHistory) => currentAI.generateText(history);
export const countTokens = (text: string) => currentAI.countTokens(text);
export const isSafeContent = (text: string) => currentAI.isSafeContent(text);