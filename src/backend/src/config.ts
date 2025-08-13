import * as path from "path";

const BASE_DATA_PATH = path.join(__dirname, "..", "..", "data");

export const PERSONA_PATH = path.join(BASE_DATA_PATH, "persona.md");
export const MEMORY_PATH = path.join(BASE_DATA_PATH, "memory.json");
export const SUMMARIZE_PROMPT_PATH = path.join(BASE_DATA_PATH, "summarize.md");

export const MAX_HISTORY_TOKENS = parseInt(process.env.MAX_HISTORY_TOKENS || '100000', 10);
