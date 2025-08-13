import { ChatHistory } from "../memory";
import { logger } from "../../utils/logger";
import { loadPersona } from "../utils";
import { AIProvider } from "../index"; // Assuming AIProvider is in ai.ts

//-------------------------------------------------------
// Constants
//-------------------------------------------------------
const OLLAMA_MODEL = "llama3"; // Default Ollama model, can be made configurable

//-------------------------------------------------------
// Ollama Implementation
//-------------------------------------------------------
export class OllamaAI implements AIProvider {
    private baseUrl: string;
    private model: string;

    constructor(baseUrl: string, model: string) {
        this.baseUrl = baseUrl;
        this.model = model;
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
        const persona = await loadPersona();
        const messages = history.map(item => ({
            role: item.role,
            content: item.parts.map(part => part.text).join(" "),
        }));

        const response = await this.makeRequest("/api/chat", {
            model: this.model,
            messages: messages,
            system: persona, // Pass persona as system property
            stream: false,
        });
        return response.message.content;
    }

    async countTokens(text: string): Promise<number> {
        // Ollama does not have a direct token counting API like Gemini.
        // This is a rough approximation (average 1 token = 4 characters).
        return Math.ceil(text.length / 4);
    }

    async isSafeContent(text: string): Promise<boolean> {
        // Ollama does not provide built-in safety filtering.
        // For now, we assume content is safe.
        logger.warn("Ollama does not provide built-in safety filtering. Assuming content is safe.");
        return true;
    }
}
