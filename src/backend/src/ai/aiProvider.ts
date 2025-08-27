import { ChatHistory } from "./memory";
import { Client as MCPClient } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { loadPersona } from "./utils";
import { MCP_CONFIG } from "../config";
import { logger } from "../utils/logger";

export abstract class AIProvider {
	public abstract generateText(history: ChatHistory): Promise<string>;
	public abstract countTokens(history: ChatHistory): Promise<number>;

	public mcps: { server: MCPClient; tools: any }[] = [];
	protected persona!: string;

	constructor() {}

	public async init(): Promise<void> {
		this.persona = await loadPersona();

		logger.log("MCP server config:", MCP_CONFIG);
		for (const [name, usage] of Object.entries(MCP_CONFIG) as [string, any][]) {
			try {
				const mcpServer = new MCPClient({ name: "maple-client-cli", version: "1.0.0" });
				await mcpServer.connect(new StdioClientTransport(usage));
				const tools = (await mcpServer.listTools()).tools;
				this.mcps.push({ server: mcpServer, tools });
				logger.log(
					`Connected to ${name}`,
					JSON.stringify(
						tools.map((tool: any) => tool.name),
						null,
						2
					)
				);
			} catch (error) {
				logger.error(`Error connecting to ${name}: ${error}`);
			}
		}
	}
}
