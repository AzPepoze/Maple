import { ChatHistory } from "./memory";
import { Client as MCPClient } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { loadPersona } from "./utils";
import { MCP_CONFIG } from "../config";

export abstract class AIProvider {
	public abstract generateText(history: ChatHistory): Promise<string>;
	public abstract countTokens(history: ChatHistory): Promise<number>;
	public abstract isSafeContent(text: string): Promise<boolean>;

	public mcp: MCPClient;
	public transport: StdioClientTransport | null = null;
	protected persona!: string;

	constructor() {
		this.mcp = new MCPClient({ name: "maple-client-cli", version: "1.0.0" });
	}

	public async init(): Promise<void> {
		this.persona = await loadPersona();

		console.log("MCP server config:", MCP_CONFIG);
		for (const [name, usage] of Object.entries(MCP_CONFIG) as [string, any][]) {
			try {
				await this.mcp.connect(new StdioClientTransport(usage));
				console.log(`Connected to ${name}`);
			} catch (error) {
				console.error(`Error connecting to ${name}: ${error}`);
			}
		}
	}
}
