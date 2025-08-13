import * as path from "path";

// Determine the base directory for data files.
// In a production Docker environment, if config.js is in /app/dist/backend/,
// we need to go up two levels (../../) to reach /app/, then navigate to data/.
const BASE_DATA_PATH = path.join(__dirname, "..", "..", "data");

export const PERSONA_PATH = path.join(BASE_DATA_PATH, "persona.md");
export const MEMORY_PATH = path.join(BASE_DATA_PATH, "memory.json");
