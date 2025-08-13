import * as fs from "fs/promises";
import { logger } from "../utils/logger";
import { PERSONA_PATH } from "../config";

//-------------------------------------------------------//
// Constants
//-------------------------------------------------------//
// PERSONA_PATH is now imported from config.ts

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
