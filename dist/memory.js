"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserHistory = getUserHistory;
exports.appendToHistory = appendToHistory;
exports.saveUserHistory = saveUserHistory;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
//-------------------------------------------------------
// Constants
//-------------------------------------------------------
const MEMORY_PATH = path.join("cache", "memory.json");
//-------------------------------------------------------
// Internal Memory Functions
//-------------------------------------------------------
async function loadMemory() {
    try {
        await fs.mkdir(path.dirname(MEMORY_PATH), { recursive: true });
        const data = await fs.readFile(MEMORY_PATH, "utf-8");
        return data ? JSON.parse(data) : {};
    }
    catch (error) {
        if (error.code === "ENOENT") {
            return {};
        }
        console.error("Error reading or parsing memory.json:", error);
        return {};
    }
}
async function saveMemory(memory) {
    try {
        await fs.mkdir(path.dirname(MEMORY_PATH), { recursive: true });
        await fs.writeFile(MEMORY_PATH, JSON.stringify(memory, null, 2), "utf-8");
    }
    catch (error) {
        console.error("Error saving memory:", error);
    }
}
//-------------------------------------------------------
// Public History Functions
//-------------------------------------------------------
async function getUserHistory(userId) {
    const memory = await loadMemory();
    return memory[userId] || [];
}
function appendToHistory(history, role, text) {
    history.push({ role, parts: [{ text }] });
}
async function saveUserHistory(userId, history) {
    const memory = await loadMemory();
    memory[userId] = history;
    await saveMemory(memory);
}
