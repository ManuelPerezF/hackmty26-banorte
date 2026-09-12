const { createRequire } = require("node:module");
const { resolve } = require("node:path");
const serverRequire = createRequire(resolve(__dirname, "../server/package.json"));
const { McpServer } = serverRequire("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = serverRequire("@modelcontextprotocol/sdk/server/stdio.js");
const { toolDefinitions } = serverRequire("./dist/integrations/mcp/tool-definitions.js");
const server = new McpServer({ name: "banorte-financial-tools", version: "1.0.0" });
const base = process.env.BANORTE_API_URL;
const capability = process.env.BANORTE_CAPABILITY;
if (!base || !capability) {
  console.error("MCP requiere un contexto de ejecución emitido por NestJS.");
  process.exit(1);
}
for (const [name, tool] of Object.entries(toolDefinitions))
  server.registerTool(
    name,
    { description: tool.description, inputSchema: tool.schema },
    async (input) => {
      try {
        const response = await fetch(`${base}/internal/tools/${name}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${capability}` },
          body: JSON.stringify(input),
          signal: AbortSignal.timeout(10000),
        });
        const result = await response.json();
        return { content: [{ type: "text", text: JSON.stringify(result) }], isError: !response.ok };
      } catch {
        return {
          content: [{ type: "text", text: JSON.stringify({ error: "API_UNAVAILABLE" }) }],
          isError: true,
        };
      }
    },
  );
server.connect(new StdioServerTransport()).catch(() => {
  console.error("No se pudo iniciar MCP.");
  process.exitCode = 1;
});
