import * as fs from "fs/promises";
import { logger } from "../utils/logger";
import { PERSONA_PATH, SUMMARIZE_PROMPT_PATH } from "../config";

//-------------------------------------------------------//
// Helper Functions
//-------------------------------------------------------//
export async function loadPersona(): Promise<string> {
	try {
		return await fs.readFile(PERSONA_PATH, "utf-8");
	} catch (error: any) {
		if (error.code === "ENOENT") {
			logger.error(`FATAL: Persona file not found at '${PERSONA_PATH}'.`);
		} else {
			logger.error("Failed to read persona file:", error);
		}
		process.exit(1);
	}
}

export async function loadSummarizePrompt(): Promise<string> {
	try {
		return await fs.readFile(SUMMARIZE_PROMPT_PATH, "utf-8");
	} catch (error: any) {
		if (error.code === "ENOENT") {
			logger.error(`FATAL: Summarize prompt file not found at '${SUMMARIZE_PROMPT_PATH}'.`);
		} else {
			logger.error("Failed to read summarize prompt file:", error);
		}
		process.exit(1);
	}
}
