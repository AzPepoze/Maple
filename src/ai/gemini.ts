import { GoogleGenAI } from "@google/genai";
import { ChatHistory } from "../memory";
import { loadPersona } from "./utils";
import { AIProvider } from "../ai"; // Assuming AIProvider is in ai.ts
import * as externalTools from "./tools";
import { toolDefinitions } from "./tools";

export class GeminiAI implements AIProvider {
	private genAI: GoogleGenAI;
	private primaryModels: string[]; // Changed from primaryModel: string
	private currentModelIndex: number = 0; // New: to track current primary model index

	constructor(apiKey: string, primaryModels: string[]) {
		// Changed primaryModel to primaryModels
		this.genAI = new GoogleGenAI({ apiKey });
		this.primaryModels = primaryModels;
		this.currentModelIndex = 0; // Start with the first primary model
	}

	private async _generateContentStream(
		model: string,
		history: ChatHistory,
		persona: string,
		tools?: any[]
	): Promise<any> {
		const request: any = {
			model: model,
			config: { systemInstruction: persona },
			contents: history,
		};
		if (tools) {
			request.tools = tools;
		}

		const responseStream = await this.genAI.models.generateContentStream(request);

		let fullText = "";
		let functionCall: any = null; // To store function call if present

		for await (const chunk of responseStream) {
			if (chunk.text) {
				fullText += chunk.text;
			}
			// Check for function calls within parts of the chunk
			if (
				chunk.candidates &&
				chunk.candidates.length > 0 &&
				chunk.candidates[0].content &&
				chunk.candidates[0].content.parts
			) {
				for (const part of chunk.candidates[0].content.parts) {
					if (part.functionCall) {
						functionCall = part.functionCall;
						break; // Assuming only one function call per chunk for simplicity
					}
				}
			}
		}
		return { fullText, functionCall }; // Return both text and function call
	}

	private async _processGenerateContentResponse(
		model: string,
		history: ChatHistory,
		persona: string,
		toolDefinitions: any[]
	): Promise<string> {
		const { fullText, functionCall } = await this._generateContentStream(model, history, persona, toolDefinitions);

		if (functionCall) {
			const { name, args } = functionCall;
			let toolResult: string;

			// Execute the tool based on its name
			if (name === "searchWeb") {
				toolResult = await externalTools.searchWeb(args.query);
			} else if (name === "fetchWebPage") {
				toolResult = await externalTools.fetchWebPage(args.url);
			} else if (name === "launchMcpServer") {
				toolResult = await externalTools.launchMcpServer(args.serverName);
			} else {
				toolResult = `Error: Unknown tool '${name}'`;
			}

			// Add tool response to history and call generateText again
			history.push({
				role: "function",
				parts: [{ functionResponse: { name, response: { content: toolResult } } }],
			});
			return this.generateText(history); // Recursive call for multi-turn
		}
		return fullText;
	}

	async generateText(history: ChatHistory): Promise<string> {
		const persona = await loadPersona();
		let modelToUse: string = this.primaryModels[this.currentModelIndex];

		try {
			const result = await this._processGenerateContentResponse(modelToUse, history, persona, toolDefinitions);
			this.currentModelIndex = 0; // If successful, reset to the first primary model for next request
			return result;
		} catch (error) {
			console.error(`Error generating text with model ${modelToUse}:`, error);

			// Try next primary model if available
			if (this.currentModelIndex < this.primaryModels.length - 1) {
				this.currentModelIndex++;
				const nextPrimaryModel = this.primaryModels[this.currentModelIndex];
				console.warn(
					`Primary model (${modelToUse}) failed. Attempting next primary model (${nextPrimaryModel}).`
				);
				try {
					const result = await this._processGenerateContentResponse(nextPrimaryModel, history, persona, toolDefinitions);
					this.currentModelIndex = 0; // If successful, reset to the first primary model for next request
					return result;
				} catch (nextPrimaryError) {
					console.error(`Next primary model (${nextPrimaryModel}) also failed:`, nextPrimaryError);
					throw nextPrimaryError; // Re-throw if next primary also failed
				}
			} else {
				throw error; // Re-throw if no more primary models
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
			(rating) => rating.probability === "HIGH" || rating.probability === "MEDIUM"
		);
		return !isUnsafe;
	}
}
