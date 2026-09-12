import { Injectable, UnauthorizedException } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import { AuthService } from "../../modules/autenticacion/auth.service";
import { Identity } from "../../modules/autenticacion/auth.types";
import { ToolName } from "./tool-definitions";
export type Capability = {
  identity: Identity;
  tools: ToolName[];
  actionId?: string;
  expires: number;
};
@Injectable()
export class CapabilityService {
  private tokens = new Map<string, Capability>();
  constructor(private readonly auth: AuthService) {}
  issue(identity: Identity, tools: ToolName[], actionId?: string) {
    const now = Date.now();
    for (const [k, c] of this.tokens) if (c.expires < now) this.tokens.delete(k);
    const token = randomBytes(32).toString("base64url");
    this.tokens.set(token, { identity, tools, actionId, expires: now + 120000 });
    return token;
  }
  revoke(token: string) {
    this.tokens.delete(token);
  }
  async check(token: string | undefined, tool: string) {
    const c = token ? this.tokens.get(token) : undefined;
    if (!c || c.expires < Date.now() || !c.tools.includes(tool as ToolName))
      throw new UnauthorizedException();
    const live = await this.auth.bySessionId(c.identity.sessionId);
    return { ...c, identity: live.identity };
  }
}
