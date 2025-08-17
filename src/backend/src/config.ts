import * as path from "path";

const REPO_PATH = path.join(__dirname, "..", "..");
const DATA_PATH = path.join(REPO_PATH, "data");

export const PERSONA_PATH = path.join(DATA_PATH, "persona.md");
export const MEMORY_PATH = path.join(DATA_PATH, "memory.json");
export const SUMMARIZE_PROMPT_PATH = path.join(DATA_PATH, "summarize.md");

export const MAX_HISTORY_TOKENS = parseInt(process.env.MAX_HISTORY_TOKENS || "20000", 10);

export const MCP_PATH = path.join(REPO_PATH, "mcp.json");
export const MCP_CONFIG = require(MCP_PATH).mcpServers;
