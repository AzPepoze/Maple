import { GoogleGenAI } from "@google/genai";
import { ChatHistory } from "../memory";
import { loadPersona } from "./utils";
import { AIProvider } from "../ai"; // Assuming AIProvider is in ai.ts

//-------------------------------------------------------
// Constants
//-------------------------------------------------------
export class GeminiAI implements AIProvider {
	private genAI: GoogleGenAI;
	private primaryModel: string;
	private fallbackModel: string;
	private currentModel: string;
	private useFallback: boolean = false; // Flag to indicate if fallback should be used for the next request

	constructor(apiKey: string, primaryModel: string, fallbackModel: string) {
		this.genAI = new GoogleGenAI({ apiKey });
		this.primaryModel = primaryModel;
		this.fallbackModel = fallbackModel;
		this.currentModel = primaryModel; // Start with the primary model
	}

	private async _generateContentStream(model: string, history: ChatHistory, persona: string): Promise<string> {
		const responseStream = await this.genAI.models.generateContentStream({
			model: model,
			config: { systemInstruction: persona },
			contents: history,
		});

		let fullText = "";
		for await (const chunk of responseStream) {
			fullText += chunk.text;
		}
		return fullText;
	}

	async generateText(history: ChatHistory): Promise<string> {
		const persona = await loadPersona();
		let modelToUse = this.currentModel;

		if (this.useFallback) {
			modelToUse = this.fallbackModel;
			this.useFallback = false; // Reset the flag
		}

		try {
			const fullText = await this._generateContentStream(modelToUse, history, persona);
			this.currentModel = this.primaryModel; // If successful, revert to primary model for next request
			return fullText;
		} catch (error) {
			console.error(`Error generating text with model ${modelToUse}:`, error);
			// If primary model failed and fallback model is available, try fallback immediately
			if (modelToUse === this.primaryModel && this.fallbackModel) {
				console.warn(
					`Primary model (${this.primaryModel}) failed. Attempting to use fallback model (${this.fallbackModel}).`
				);
				this.currentModel = this.fallbackModel; // Switch to fallback for this attempt
				try {
					const fullText = await this._generateContentStream(this.fallbackModel, history, persona);
					this.currentModel = this.primaryModel; // If fallback successful, revert to primary for next request
					return fullText;
				} catch (fallbackError) {
					console.error(`Fallback model (${this.fallbackModel}) also failed:`, fallbackError);
					throw fallbackError; // Re-throw if fallback also failed
				}
			} else {
				throw error; // Re-throw if no fallback or fallback was already used and failed
			}
		}
	}

	async countTokens(text: string): Promise<number> {
		const result = await this.genAI.models.countTokens({
			model: this.currentModel, // Changed from AI_MODEL
			contents: [{ role: "user", parts: [{ text: text }] }],
		});
		return result.totalTokens ?? 0;
	}

	async isSafeContent(text: string): Promise<boolean> {
		const result = await this.genAI.models.generateContent({
			model: this.currentModel, // Changed from AI_MODEL
			contents: [{ role: "user", parts: [{ text: text }] }],
		});
		const safetyRatings = result.promptFeedback?.safetyRatings;

		if (!safetyRatings) {
			return true; // No safety ratings, assume safe
		}

		// Check if any safety rating is HIGH or MED
		const isUnsafe = safetyRatings.some(
			(rating) => rating.probability === "HIGH" || rating.probability === "MEDIUM"
		);
		return !isUnsafe;
	}
}
