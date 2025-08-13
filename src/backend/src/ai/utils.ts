import * as fs from "fs/promises";
import * as path from "path";
import { logger } from "../utils/logger";

//-------------------------------------------------------
// Constants
//-------------------------------------------------------
const PERSONA_PATH = path.join(__dirname, "..", "..", "data", "persona.md");

//-------------------------------------------------------
// Helper Functions
//-------------------------------------------------------
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
