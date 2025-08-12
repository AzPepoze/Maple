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
require("dotenv/config");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const discord_1 = require("./discord");
//-------------------------------------------------------
// Constants
//-------------------------------------------------------
const PERSONA_PATH = path.join(__dirname, "..", "data", "persona.md");
//-------------------------------------------------------
// Main Execution
//-------------------------------------------------------
async function loadPersona() {
    try {
        console.log(`Loading persona from: ${PERSONA_PATH}`);
        const personaContent = await fs.readFile(PERSONA_PATH, "utf-8");
        console.log("Persona loaded successfully.");
        return personaContent;
    }
    catch (error) {
        if (error.code === "ENOENT") {
            console.error(`FATAL: Persona file not found at '${PERSONA_PATH}'.`);
            console.error("Please create the file and directory structure.");
        }
        else {
            console.error("Failed to read persona file:", error);
        }
        process.exit(1);
    }
}
async function main() {
    const persona = await loadPersona();
    (0, discord_1.startDiscordBot)(persona);
}
main();
