import { GenerateContentParameters, GoogleGenAI, mcpToTool } from "@google/genai";
import { ChatContent, ChatHistory, ChatPart } from "../memory";
import { AIProvider } from "../aiProvider";
import { logger } from "../../utils/logger";

export class GeminiAI extends AIProvider {
	private genAI: GoogleGenAI;
	private primaryModels: string[];
	private currentModelIndex: number = 0;
	private modelFailureCounts: Map<string, number>;
	private ignoredModels: Map<string, number>;
	private readonly IGNORE_DURATION_MS = 5 * 60 * 1000;
	private readonly MAX_FAILURES = 5;

	constructor() {
		super();
		const geminiApiKey = process.env.GEMINI_API_KEY;
		const geminiModel = process.env.GEMINI_MODEL ? process.env.GEMINI_MODEL.split(",") : ["gemini-2.5-flash"];

		if (!geminiApiKey) {
			throw new Error("GEMINI_API_KEY is not defined in the .env file.");
		}

		this.genAI = new GoogleGenAI({ apiKey: geminiApiKey });
		this.primaryModels = geminiModel;
		this.currentModelIndex = 0;
		this.modelFailureCounts = new Map<string, number>();
		this.ignoredModels = new Map<string, number>();
	}

	public _mapChatHistoryToContents(history: ChatHistory) {
		return history.map((chatContent: ChatContent) => ({
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
	}

	private async _generateContentStream(model: string, history: ChatHistory): Promise<any> {
		const contents = this._mapChatHistoryToContents(history);

		const request: GenerateContentParameters = {
			model: model,
			config: { systemInstruction: this.persona, tools: [] },
			contents: contents,
		};
		if (this.mcps.length > 0) {
			logger.log("Attaching MCP tools to Gemini request.");

			for (const mcp of this.mcps) {
				request.config?.tools?.push(mcpToTool(mcp.server));
			}
		}

		const responseStream = await this.genAI.models.generateContentStream(request);

		let fullText = "";
		let toolCalls = [];

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
						toolCalls.push(part.functionCall);
					}
				}
			}
		}
		return { fullText, toolCalls };
	}

	private async _processGenerateContentResponse(model: string, history: ChatHistory): Promise<string> {
		const { fullText, toolCalls } = await this._generateContentStream(model, history);

		logger.log(toolCalls);

		if (toolCalls.length > 0) {
			for (const tool of toolCalls) {
				let result;
				for (const mcp of this.mcps) {
					if (mcp.tools.find((thisTool: any) => thisTool.name === tool.name)) {
						result = await mcp.server.callTool({
							name: tool.name,
							arguments: tool.args,
						});
						logger.debug("MCP Tool Call Result:", JSON.stringify(result, null, 2));
						break;
					}
				}
				if (!result) {
					logger.error(`No MCP found for tool ${tool.name}`);
					continue;
				}

				logger.log(`Tool ${tool.name} returned:`, result.content);
				history.push({
					role: "function",
					parts: [
						{
							functionResponse: {
								name: tool.name,
								response: { content: result.content as string },
							},
						},
					],
				});
			}
			return this.generateText(history);
		}
		return fullText;
	}

	async generateText(history: ChatHistory): Promise<string> {
		const now = Date.now();
		for (const [modelName, reEnableTime] of this.ignoredModels.entries()) {
			if (now >= reEnableTime) {
				this.ignoredModels.delete(modelName);
				this.modelFailureCounts.delete(modelName);
				logger.warn(`Model ${modelName} re-enabled after being ignored.`);
			}
		}

		const availableModels = this.primaryModels.filter((model) => !this.ignoredModels.has(model));

		if (availableModels.length === 0) {
			throw new Error("No models available to generate text (all are ignored).");
		}

		const MAX_RETRIES = 3;
		let currentRetries = 0;

		for (let i = 0; i < availableModels.length; i++) {
			const modelToUse = availableModels[i];
			try {
				const result = await this._processGenerateContentResponse(modelToUse, history);
				this.modelFailureCounts.clear();
				this.currentModelIndex = 0;
				return result;
			} catch (error: any) {
				logger.error(`Error generating text with model ${modelToUse}:`, error);

				if (error.message && error.message.includes("You exceeded your current quota")) {
					const reEnableTime = now + this.IGNORE_DURATION_MS;
					this.ignoredModels.set(modelToUse, reEnableTime);
					logger.error(
						`Model ${modelToUse} exceeded quota and will be ignored until ${new Date(
							reEnableTime
						).toLocaleTimeString()}.`
					);
					continue;
				}

				if (error.status && error.status >= 500 && error.status < 600 && currentRetries < MAX_RETRIES) {
					currentRetries++;
					logger.warn(
						`Retrying model ${modelToUse} due to 500-level error. Retry attempt: ${currentRetries}`
					);
					i--;
					continue;
				}

				currentRetries = 0;

				const currentFailures = (this.modelFailureCounts.get(modelToUse) || 0) + 1;
				this.modelFailureCounts.set(modelToUse, currentFailures);

				if (currentFailures >= this.MAX_FAILURES) {
					const reEnableTime = now + this.IGNORE_DURATION_MS;
					this.ignoredModels.set(modelToUse, reEnableTime);
					logger.error(
						`Model ${modelToUse} failed ${
							this.MAX_FAILURES
						} times consecutively and will be ignored until ${new Date(
							reEnableTime
						).toLocaleTimeString()}.`
					);
				}

				if (i === availableModels.length - 1) {
					throw error;
				}
			}
		}
		throw new Error("No models available to generate text.");
	}

	async countTokens(history: ChatHistory): Promise<number> {
		const contents = this._mapChatHistoryToContents(history);
		const result = await this.genAI.models.countTokens({
			model: this.primaryModels[this.currentModelIndex],
			contents: contents,
		});
		return result.totalTokens ?? 0;
	}
}
