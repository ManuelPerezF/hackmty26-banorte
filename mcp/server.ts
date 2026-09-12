import { createRequire } from "node:module";
import { resolve } from "node:path";
import type { z } from "zod";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

// Runtime packages and the canonical schemas come from the compiled backend.
// This avoids a second set of domain contracts or a second SDK installation.
const serverRequire = createRequire(resolve(__dirname, "../../server/package.json"));
const { McpServer } = serverRequire(
  "@modelcontextprotocol/sdk/server/mcp.js",
) as typeof import("@modelcontextprotocol/sdk/server/mcp.js");
const { StdioServerTransport } = serverRequire(
  "@modelcontextprotocol/sdk/server/stdio.js",
) as typeof import("@modelcontextprotocol/sdk/server/stdio.js");
type Definition = { description: string; schema: z.ZodObject<z.ZodRawShape> };
type Metadata = { title: string; readOnly: boolean };
const { toolDefinitions, toolMetadata } = serverRequire(
  "./dist/integrations/mcp/tool-definitions.js",
) as {
  toolDefinitions: Record<string, Definition>;
  toolMetadata: Record<string, Metadata>;
};
const server = new McpServer({ name: "banorte-financial-tools", version: "1.1.0" });
function executionContext() {
  const base = new URL(process.env.BANORTE_API_URL ?? "");
  const capability = process.env.BANORTE_CAPABILITY;
  if (
    base.protocol !== "http:" ||
    base.hostname !== "127.0.0.1" ||
    base.pathname !== "/api/v1" ||
    base.search ||
    base.hash ||
    base.username ||
    base.password ||
    !capability
  )
    throw new Error("INVALID_CONTEXT");
  return { base: base.href.replace(/\/$/, ""), capability };
}
function result(data: Record<string, unknown>, isError = false): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(data) }],
    structuredContent: data,
    isError,
  };
}
async function main() {
  const { base, capability } = executionContext();
  for (const [name, tool] of Object.entries(toolDefinitions)) {
    const meta = toolMetadata[name];
    server.registerTool(
      name,
      {
        title: meta.title,
        description: tool.description,
        inputSchema: tool.schema,
        annotations: {
          readOnlyHint: meta.readOnly,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async (input, extra): Promise<CallToolResult> => {
        try {
          const response = await fetch(`${base}/internal/tools/${name}`, {
            method: "POST",
            redirect: "error",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${capability}` },
            body: JSON.stringify(input),
            signal: AbortSignal.any([extra.signal, AbortSignal.timeout(10000)]),
          });
          const data: unknown = await response.json();
          if (!response.ok) {
            const code =
              response.status === 400
                ? "INVALID_INPUT"
                : response.status === 401 || response.status === 403
                  ? "ACCESS_DENIED"
                  : response.status === 404
                    ? "NOT_FOUND"
                    : response.status === 409
                      ? "CONFLICT"
                      : "API_UNAVAILABLE";
            return result(
              {
                error: {
                  code,
                  message:
                    response.status === 400
                      ? "Revisa los argumentos y el esquema de la herramienta."
                      : "No se pudo completar la herramienta en este contexto.",
                  retryable: response.status >= 500,
                },
              },
              true,
            );
          }
          if (!data || typeof data !== "object" || Array.isArray(data))
            return result({ error: { code: "INVALID_RESPONSE", retryable: false } }, true);
          return result(data as Record<string, unknown>);
        } catch {
          return result(
            {
              error: {
                code: extra.signal.aborted ? "CANCELLED" : "API_UNAVAILABLE",
                retryable: !extra.signal.aborted,
              },
            },
            true,
          );
        }
      },
    );
  }
  await server.connect(new StdioServerTransport());
}
void main().catch(() => {
  console.error("No se pudo iniciar MCP. Revisa el build y el contexto local emitido por Nest.");
  process.exitCode = 1;
});
