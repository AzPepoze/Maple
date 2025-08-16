import { GoogleGenAI } from "@google/genai";
import { ChatHistory, ChatContent, ChatPart } from "../memory";
import { loadPersona } from "../utils";
import { AIProvider } from "../index";
import * as externalTools from "../tools";
import { toolDefinitions } from "../tools";

export class GeminiAI implements AIProvider {
	private genAI: GoogleGenAI;
	private primaryModels: string[];
	private currentModelIndex: number = 0;

	constructor(apiKey: string, primaryModels: string[]) {
		this.genAI = new GoogleGenAI({ apiKey });
		this.primaryModels = primaryModels;
		this.currentModelIndex = 0;
	}

	private async _generateContentStream(
		model: string,
		history: ChatHistory,
		persona: string,
		tools?: any[]
	): Promise<any> {
		const contents = history.map((chatContent: ChatContent) => ({
			role: chatContent.role,
			parts: chatContent.parts.map((part: ChatPart) => {
				if (part.text) {
					return { text: part.text };
				} else if (part.inlineData) {
					return { inlineData: part.inlineData };
				} else if (part.functionResponse) {
					return { functionResponse: part.functionResponse };
				}
				return {};
			}),
		}));

		const request: any = {
			model: model,
			config: { systemInstruction: persona },
			contents: contents,
		};
		if (tools) {
			request.tools = tools;
		}

		const responseStream = await this.genAI.models.generateContentStream(request);

		let fullText = "";
		let functionCall: any = null;

		for await (const chunk of responseStream) {
			if (chunk.text) {
				fullText += chunk.text;
			}
			if (
				chunk.candidates &&
				chunk.candidates.length > 0 &&
				chunk.candidates[0].content &&
				chunk.candidates[0].content.parts
			) {
				for (const part of chunk.candidates[0].content.parts) {
					if (part.functionCall) {
						functionCall = part.functionCall;
						break;
					}
				}
			}
		}
		return { fullText, functionCall };
	}

	private async _processGenerateContentResponse(
		model: string,
		history: ChatHistory,
		persona: string,
		toolDefinitions: any[]
	): Promise<string> {
		const { fullText, functionCall } = await this._generateContentStream(
			model,
			history,
			persona,
			toolDefinitions
		);

		if (functionCall) {
			const { name, args } = functionCall;
			let toolResult: string;

			if (name === "searchWeb") {
				toolResult = await externalTools.searchWeb(args.query);
			} else if (name === "fetchWebPage") {
				toolResult = await externalTools.fetchWebPage(args.url);
			} else if (name === "launchMcpServer") {
				toolResult = await externalTools.launchMcpServer(args.serverName);
			} else {
				toolResult = `Error: Unknown tool '${name}'`;
			}

			history.push({
				role: "function",
				parts: [{ functionResponse: { name, response: { content: toolResult } } }],
			});
			return this.generateText(history);
		}
		return fullText;
	}

	async generateText(history: ChatHistory): Promise<string> {
		const persona = await loadPersona();
		let modelToUse: string = this.primaryModels[this.currentModelIndex];

		try {
			const result = await this._processGenerateContentResponse(modelToUse, history, persona, toolDefinitions);
			this.currentModelIndex = 0;
			return result;
		} catch (error) {
			console.error(`Error generating text with model ${modelToUse}:`, error);

			if (this.currentModelIndex < this.primaryModels.length - 1) {
				this.currentModelIndex++;
				const nextPrimaryModel = this.primaryModels[this.currentModelIndex];
				console.warn(
					`Primary model (${modelToUse}) failed. Attempting next primary model (${nextPrimaryModel}).`
				);
				try {
					const result = await this._processGenerateContentResponse(
						nextPrimaryModel,
						history,
						persona,
						toolDefinitions
					);
					this.currentModelIndex = 0;
					return result;
				} catch (nextPrimaryError) {
					console.error(`Next primary model (${nextPrimaryModel}) also failed:`, nextPrimaryError);
					throw nextPrimaryError;
				}
			} else {
				throw error;
			}
		}
	}

	async countTokens(history: ChatHistory): Promise<number> {
		const contents = history.map((chatContent: ChatContent) => ({
			role: chatContent.role,
			parts: chatContent.parts.map((part: ChatPart) => {
				if (part.text) {
					return { text: part.text };
				} else if (part.inlineData) {
					return { inlineData: part.inlineData };
				}
				return {};
			}),
		}));
		const result = await this.genAI.models.countTokens({
			model: this.primaryModels[this.currentModelIndex],
			contents: contents,
		});
		return result.totalTokens ?? 0;
	}

	async isSafeContent(text: string): Promise<boolean> {
		const result = await this.genAI.models.generateContent({
			model: this.primaryModels[this.currentModelIndex],
			contents: [{ role: "user", parts: [{ text: text }] }],
		});
		const safetyRatings = result.promptFeedback?.safetyRatings;

		if (!safetyRatings) {
			return true;
		}

		const isUnsafe = safetyRatings.some(
			(rating) => rating.probability === "HIGH" || rating.probability === "MEDIUM"
		);
		return !isUnsafe;
	}
}
