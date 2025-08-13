declare const default_api: any;

export const searchWeb = async (query: string): Promise<string> => {
    try {
        const result = await default_api.google_web_search(query);
        return JSON.stringify(result);
    } catch (error: any) {
        return `Error searching web: ${error.message}`;
    }
};

export const fetchWebPage = async (url: string): Promise<string> => {
    try {
        const result = await default_api.web_fetch(url);
        return JSON.stringify(result);
    } catch (error: any) {
        return `Error fetching web page: ${error.message}`;
    }
};

export const launchMcpServer = async (serverName: string): Promise<string> => { // Added serverName parameter
    try {
        const mcpConfigContent = await default_api.read_file({ absolute_path: "/home/azpepoze/GoogleDrive/Project/Tools/Maple/mcp.json" });
        const mcpConfig = JSON.parse(mcpConfigContent.read_file_response.output);
        const serverConfig = mcpConfig.mcpServers[serverName]; // Dynamic access

        if (!serverConfig || !serverConfig.command || !serverConfig.args) {
            throw new Error(`MCP server configuration for '${serverName}' not found or incomplete in mcp.json.`);
        }

        const command = `${serverConfig.command} ${serverConfig.args.join(' ')} &`; // Run in background
        const description = `Launching MCP server '${serverName}' in the background.`;

        const result = await default_api.run_shell_command({ command, description });
        return JSON.stringify(result);
    } catch (error: any) {
        return `Error launching MCP server '${serverName}': ${error.message}`;
    }
};

export const toolDefinitions = [
    {
        function_declarations: [
            {
                name: "searchWeb",
                description: "Searches the web for a given query.",
                parameters: {
                    type: "object",
                    properties: {
                        query: {
                            type: "string",
                            description: "The search query.",
                        },
                    },
                    required: ["query"],
                },
            },
        ],
    },
    {
        function_declarations: [
            {
                name: "fetchWebPage",
                description: "Fetches the content of a web page.",
                parameters: {
                    type: "object",
                    properties: {
                        url: {
                            type: "string",
                            description: "The URL of the web page to fetch.",
                        },
                    },
                    required: ["url"],
                },
            },
        ],
    },
    {
        function_declarations: [
            {
                name: "launchMcpServer",
                description: "Launches a specified MCP server.",
                parameters: {
                    type: "object",
                    properties: {
                        serverName: {
                            type: "string",
                            description: "The name of the MCP server to launch (e.g., 'playwright').",
                        },
                    },
                    required: ["serverName"],
                },
            },
        ],
    },
];