import { GoogleGenAI, Content } from "@google/genai";
import { ChatHistory } from "./memory";

//-------------------------------------------------------
// Environment Variable Validation
//-------------------------------------------------------
const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
	throw new Error("GEMINI_API_KEY is not defined in the .env file.");
}

//-------------------------------------------------------
// Constants
//-------------------------------------------------------
const AI_MODEL = "gemini-2.5-flash";

//-------------------------------------------------------
// Initialization
//-------------------------------------------------------
const genAI = new GoogleGenAI({ apiKey: geminiApiKey });

//-------------------------------------------------------
// Public Functions
//-------------------------------------------------------
export async function generateText(persona: string, history: ChatHistory): Promise<string> {
	const responseStream = await genAI.models.generateContentStream({
		model: AI_MODEL,
		config: {
			systemInstruction: persona,
		},
		contents: history,
	});

	let fullText = "";
	for await (const chunk of responseStream) {
		fullText += chunk.text;
	}

	return fullText;
}
