import { logger } from "../../utils/logger";
import { AIProvider } from "../aiProvider";
import { ChatHistory } from "../memory";

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

	async generateText(history: ChatHistory): Promise<string> {
		const response = await fetch(`${this.llamaCPPURL}/v1/chat/completions`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				messages: this._mapChatHistoryToContents(history),
				stream: true,
			}),
		});

		if (response.ok && response.body) {
			const reader = response.body.getReader();
			const decoder = new TextDecoder();

			let fullResponse = "";

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value, { stream: true });

				logger.info(chunk.slice(6));

				try {
					const content = JSON.parse(chunk.slice(6)).content;
					fullResponse += content;
				} catch (error) {
					logger.error("Can't get content from response.", error);
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
