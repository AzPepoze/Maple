import { logger } from "../../utils/logger";
import { AIProvider } from "../aiProvider";
import { ChatContent, ChatHistory, ChatPart } from "../memory";

export class LlamaCPP extends AIProvider {
	private llamaCPPURL: string;

	constructor() {
		super();
		if (process.env.LLAMA_CPP_URL) {
			this.llamaCPPURL = process.env.LLAMA_CPP_URL;
		} else {
			logger.info("LLAMA_CPP_URL environment variable is not set. Using default. (http://localhost:8000)");
			this.llamaCPPURL = "http://localhost:8000";
		}
	}

	public _mapChatHistoryToContents(history: ChatHistory): {
		role: string;
		content: string;
	}[] {
		return history.map((chatContent: ChatContent) => ({
			role: chatContent.role,
			content: chatContent.parts
				.map((part: ChatPart) => {
					if (part.text) {
						return part.text;
					}
					return "";
				})
				.join(" "),
		}));
	}

	async generateText(history: ChatHistory): Promise<string> {
		const messages = [
			{
				role: "system",
				content: this.persona,
			},
			...this._mapChatHistoryToContents(history),
		];
		logger.info(JSON.stringify(messages, null, 2));

		const response = await fetch(`${this.llamaCPPURL}/v1/chat/completions`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				messages,
				stream: true,
			}),
		});

		if (response.ok && response.body) {
			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let fullResponse = "";
			let buffer = "";

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				buffer += decoder.decode(value, { stream: true });

				const lines = buffer.split("\n");
				buffer = lines.pop() || "";

				for (const line of lines) {
					const trimmedLine = line.trim();
					if (trimmedLine.startsWith("data: ")) {
						const dataContent = trimmedLine.substring(6);

						if (dataContent === "[DONE]") {
							break;
						}

						try {
							const json = JSON.parse(dataContent);
							const content = json.choices[0]?.delta?.content;
							if (content) {
								fullResponse += content;
							}
						} catch (error) {
							logger.error("Failed to parse JSON from stream line:", dataContent, error);
						}
					}
				}
			}

			logger.info(fullResponse);
			return fullResponse;
		} else {
			logger.debug("LlamaCPP response not ok:", response.statusText);
			throw new Error(`Request failed with status ${response.status}`);
		}
	}

	async countTokens(history: ChatHistory): Promise<number> {
		// const context = history.getContext();
		// // Call to LlamaCPP's token counting API
		// return llamaCPPAPI.countTokens(context);
		return 0;
	}
}
