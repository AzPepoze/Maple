import { ChatHistory } from "../memory";
import { logger } from "../../utils/logger";
import { AIProvider } from "../aiProvider";

//-------------------------------------------------------
// Ollama Implementation
//-------------------------------------------------------
export class OllamaAI extends AIProvider {
    private baseUrl: string;
    private model: string;

    constructor() {
        super();
        const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
        const ollamaModel = process.env.OLLAMA_MODEL || "llama2";

        if (!ollamaBaseUrl) {
            throw new Error("OLLAMA_BASE_URL is not defined in the .env file.");
        }

        this.baseUrl = ollamaBaseUrl;
        this.model = ollamaModel;
    }

    private async makeRequest(endpoint: string, body: any): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.statusText}`);
            }
            return response.json();
        } catch (error) {
            logger.error("Ollama request failed:", error);
            throw error;
        }
    }

    async generateText(history: ChatHistory): Promise<string> {
        const messages = history.map(item => ({
            role: item.role,
            content: item.parts.map(part => part.text).join(" "),
        }));

        const response = await this.makeRequest("/api/chat", {
            model: this.model,
            messages: messages,
            system: this.persona,
            stream: false,
        });
        return response.message.content;
    }

    async countTokens(history: ChatHistory): Promise<number> {
        const fullText = history.map(item => item.parts.map(part => part.text).join(" ")).join(" ");
        return Math.ceil(fullText.length / 4);
    }

    async isSafeContent(text: string): Promise<boolean> {
        logger.warn("Ollama does not provide built-in safety filtering. Assuming content is safe.");
        return true;
    }
}
