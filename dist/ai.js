"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateText = generateText;
const genai_1 = require("@google/genai");
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
const genAI = new genai_1.GoogleGenAI({ apiKey: geminiApiKey });
//-------------------------------------------------------
// Public Functions
//-------------------------------------------------------
async function generateText(persona, history) {
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
