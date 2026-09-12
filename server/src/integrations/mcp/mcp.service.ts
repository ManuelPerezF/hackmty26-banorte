import { Inject, Injectable } from "@nestjs/common";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { resolve } from "node:path";
import { ENV, Environment } from "../../config/env";
import { Identity } from "../../modules/autenticacion/auth.types";
import { CapabilityService } from "./capability.service";
import { ToolName } from "./tool-definitions";
@Injectable()
export class McpService {
  constructor(
    private readonly capabilities: CapabilityService,
    @Inject(ENV) private readonly env: Environment,
  ) {}
  async withClient<T>(
    identity: Identity,
    names: ToolName[],
    actionId: string | undefined,
    work: (client: Client) => Promise<T>,
  ): Promise<T> {
    const token = this.capabilities.issue(identity, names, actionId);
    const client = new Client({ name: "banorte-agent", version: "1.0.0" });
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [resolve(this.env.MCP_ENTRY)],
      env: {
        PATH: process.env.PATH ?? "",
        BANORTE_API_URL: `http://127.0.0.1:${this.env.PORT}/api/v1`,
        BANORTE_CAPABILITY: token,
      },
      stderr: "pipe",
    });
    try {
      await client.connect(transport, { timeout: 10000 });
      return await work(client);
    } finally {
      this.capabilities.revoke(token);
      await client.close().catch(() => {});
    }
  }
}
