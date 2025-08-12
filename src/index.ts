import "dotenv/config";
import * as fs from "fs/promises";
import * as path from "path";
import { startDiscordBot } from "./discord";

//-------------------------------------------------------
// Constants
//-------------------------------------------------------
const PERSONA_PATH = path.join(__dirname, "..", "data", "persona.md");

//-------------------------------------------------------
// Main Execution
//-------------------------------------------------------
async function loadPersona(): Promise<string> {
	try {
		console.log(`Loading persona from: ${PERSONA_PATH}`);
		const personaContent = await fs.readFile(PERSONA_PATH, "utf-8");
		console.log("Persona loaded successfully.");
		return personaContent;
	} catch (error: any) {
		if (error.code === "ENOENT") {
			console.error(`FATAL: Persona file not found at '${PERSONA_PATH}'.`);
			console.error("Please create the file and directory structure.");
		} else {
			console.error("Failed to read persona file:", error);
		}
		process.exit(1);
	}
}

async function main() {
	const persona = await loadPersona();
	startDiscordBot(persona);
}

main();
