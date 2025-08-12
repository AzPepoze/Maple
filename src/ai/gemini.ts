import { GoogleGenAI } from "@google/genai";
import { ChatHistory } from "../memory";
import { loadPersona } from "./utils";
import { AIProvider } from "../ai"; // Assuming AIProvider is in ai.ts

//-------------------------------------------------------
// Constants
//-------------------------------------------------------
const AI_MODEL = "gemini-1.5-flash";

//-------------------------------------------------------
// Gemini Implementation
//-------------------------------------------------------
export class GeminiAI implements AIProvider {
	private genAI: GoogleGenAI;

	constructor(apiKey: string) {
		this.genAI = new GoogleGenAI({ apiKey });
	}

	async generateText(history: ChatHistory): Promise<string> {
		const persona = await loadPersona();
		const responseStream = await this.genAI.models.generateContentStream({
			model: AI_MODEL,
			config: { systemInstruction: persona },
			contents: history,
		});

		let fullText = "";
		for await (const chunk of responseStream) {
			fullText += chunk.text;
		}
		return fullText;
	}

	async countTokens(text: string): Promise<number> {
		const result = await this.genAI.models.countTokens({
			model: AI_MODEL,
			contents: [{ role: "user", parts: [{ text: text }] }],
		});
		return result.totalTokens ?? 0;
	}

	async isSafeContent(text: string): Promise<boolean> {
		const result = await this.genAI.models.generateContent({
			model: AI_MODEL,
			contents: [{ role: "user", parts: [{ text: text }] }],
		});
		const safetyRatings = result.promptFeedback?.safetyRatings;

		if (!safetyRatings) {
			return true; // No safety ratings, assume safe
		}

		// Check if any safety rating is HIGH or MED
		const isUnsafe = safetyRatings.some(
			rating => rating.probability === "HIGH" || rating.probability === "MEDIUM"
		);
		return !isUnsafe;
	}
}
