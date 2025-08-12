import { GoogleGenAI } from "@google/genai";
import { ChatHistory } from "../memory";
import { loadPersona } from "./utils";
import { AIProvider } from "../ai"; // Assuming AIProvider is in ai.ts

//-------------------------------------------------------
// Constants
//-------------------------------------------------------
export class GeminiAI implements AIProvider {
	private genAI: GoogleGenAI;
	private primaryModels: string[]; // Changed from primaryModel: string
	private fallbackModel: string;
	private currentModelIndex: number = 0; // New: to track current primary model index
	private useFallback: boolean = false; // Flag to indicate if fallback should be used for the next request

	constructor(apiKey: string, primaryModels: string[], fallbackModel: string) { // Changed primaryModel to primaryModels
		this.genAI = new GoogleGenAI({ apiKey });
		this.primaryModels = primaryModels;
		this.fallbackModel = fallbackModel;
		this.currentModelIndex = 0; // Start with the first primary model
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
		let modelToUse: string;

		if (this.useFallback) {
			modelToUse = this.fallbackModel;
			this.useFallback = false; // Reset the flag
		} else {
			modelToUse = this.primaryModels[this.currentModelIndex];
		}

		try {
			const fullText = await this._generateContentStream(modelToUse, history, persona);
			this.currentModelIndex = 0; // If successful, reset to the first primary model for next request
			return fullText;
		} catch (error) {
			console.error(`Error generating text with model ${modelToUse}:`, error);

			// Try next primary model if available
			if (!this.useFallback && this.currentModelIndex < this.primaryModels.length - 1) {
				this.currentModelIndex++;
				const nextPrimaryModel = this.primaryModels[this.currentModelIndex];
				console.warn(`Primary model (${modelToUse}) failed. Attempting next primary model (${nextPrimaryModel}).`);
				// Retry with the next primary model immediately
				try {
					const fullText = await this._generateContentStream(nextPrimaryModel, history, persona);
					this.currentModelIndex = 0; // If successful, reset to the first primary model for next request
					return fullText;
				} catch (nextPrimaryError) {
					console.error(`Next primary model (${nextPrimaryModel}) also failed:`, nextPrimaryError);
					// If next primary model also fails, proceed to fallback logic
				}
			}

			// If all primary models failed or no more primary models, try fallback model
			if (this.fallbackModel) {
				console.warn(`All primary models failed or no more primary models. Attempting to use fallback model (${this.fallbackModel}).`);
				this.useFallback = true; // Set flag to use fallback for the next request
				try {
					const fullText = await this._generateContentStream(this.fallbackModel, history, persona);
					this.currentModelIndex = 0; // If fallback successful, reset to the first primary model for next request
					this.useFallback = false; // Reset fallback flag
					return fullText;
				} catch (fallbackError) {
					console.error(`Fallback model (${this.fallbackModel}) also failed:`, fallbackError);
					throw fallbackError; // Re-throw if fallback also failed
				}
			} else {
				throw error; // Re-throw if no fallback model
			}
		}
	}

	async countTokens(text: string): Promise<number> {
		const result = await this.genAI.models.countTokens({
			model: this.primaryModels[this.currentModelIndex], // Changed to use current primary model
			contents: [{ role: "user", parts: [{ text: text }] }],
		});
		return result.totalTokens ?? 0;
	}

		async isSafeContent(text: string): Promise<boolean> {
		const result = await this.genAI.models.generateContent({
			model: this.primaryModels[this.currentModelIndex], // Changed to use current primary model
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
