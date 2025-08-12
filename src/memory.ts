import * as fs from "fs/promises";
import * as path from "path";

//-------------------------------------------------------
// Constants
//-------------------------------------------------------
const MEMORY_PATH = path.join("data", "memory.json");

//-------------------------------------------------------
// Types
//-------------------------------------------------------
export interface ChatPart {
	text: string;
}

export interface ChatContent {
	role: "user" | "model";
	parts: ChatPart[];
}

export type ChatHistory = ChatContent[];

interface Memory {
	[userId: string]: ChatHistory;
}

//-------------------------------------------------------
// Internal Memory Functions
//-------------------------------------------------------
async function loadMemory(): Promise<Memory> {
	try {
		await fs.mkdir(path.dirname(MEMORY_PATH), { recursive: true });
		const data = await fs.readFile(MEMORY_PATH, "utf-8");
		return data ? (JSON.parse(data) as Memory) : {};
	} catch (error: any) {
		if (error.code === "ENOENT") {
			await fs.writeFile(MEMORY_PATH, JSON.stringify({}, null, 2), "utf-8");
			return {};
		}
		console.error("Error reading or parsing memory.json:", error);
		return {};
	}
}

async function saveMemory(memory: Memory): Promise<void> {
	try {
		await fs.mkdir(path.dirname(MEMORY_PATH), { recursive: true });
		await fs.writeFile(MEMORY_PATH, JSON.stringify(memory, null, 2), "utf-8");
	} catch (error) {
		console.error("Error saving memory:", error);
	}
}

//-------------------------------------------------------
// Public History Functions
//-------------------------------------------------------
export async function getUserHistory(userId: string): Promise<ChatHistory> {
	const memory = await loadMemory();
	return memory[userId] || [];
}

export function appendToHistory(history: ChatHistory, role: "user" | "model", text: string): void {
	history.push({ role, parts: [{ text }] });
}

export async function saveUserHistory(userId: string, history: ChatHistory): Promise<void> {
	const memory = await loadMemory();
	memory[userId] = history;
	await saveMemory(memory);
}
