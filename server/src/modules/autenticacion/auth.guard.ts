import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { parse } from "cookie";
import { timingSafeEqual } from "node:crypto";
import { ENV, Environment } from "../../config/env";
import { AuthRequest, PUBLIC } from "./auth.types";
import { AuthService, sessionCookie } from "./auth.service";
@Injectable()
export class AuthGuard implements CanActivate {
  private limits = new Map<string, { count: number; expires: number }>();
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
    @Inject(ENV) private readonly env: Environment,
  ) {}
  private limit(key: string, max: number) {
    const now = Date.now();
    for (const [k, v] of this.limits) if (v.expires <= now) this.limits.delete(k);
    if (this.limits.size >= 10000 && !this.limits.has(key))
      throw new HttpException({ code: "RATE_LIMITED", message: "Intenta más tarde." }, 429);
    const item = this.limits.get(key) ?? { count: 0, expires: now + 60000 };
    item.count++;
    this.limits.set(key, item);
    if (item.count > max)
      throw new HttpException(
        { code: "RATE_LIMITED", message: "Demasiadas solicitudes. Intenta en un minuto." },
        429,
      );
  }
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<AuthRequest>();
    // Only the dedicated MCP gateway bypasses browser cookies; its controller validates a scoped capability.
    if (
      this.reflector.getAllAndOverride<boolean>("auth:mcp", [
        context.getHandler(),
        context.getClass(),
      ])
    )
      return true;
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    const mutation = !["GET", "HEAD", "OPTIONS"].includes(req.method);
    if (mutation) {
      if (!req.headers.origin || !this.env.CORS_ORIGINS.includes(req.headers.origin))
        throw new ForbiddenException({ code: "ORIGIN_FORBIDDEN", message: "Origen no permitido." });
      if (!req.is("application/json") && !req.path.endsWith("/auth/logout"))
        throw new HttpException("Usa Content-Type application/json.", 415);
    }
    if (isPublic) {
      if (mutation) {
        this.limit(`ip:${req.ip}`, 20);
        const email =
          typeof req.body?.email === "string"
            ? req.body.email.trim().toLowerCase().slice(0, 254)
            : "";
        this.limit(`email:${email}`, 10);
      }
      return true;
    }
    let token: string | undefined;
    try {
      token = parse(req.headers.cookie ?? "")[sessionCookie];
    } catch {
      throw new UnauthorizedException();
    }
    if (!token)
      throw new UnauthorizedException({
        code: "UNAUTHENTICATED",
        message: "Inicia sesión para continuar.",
      });
    const result = await this.auth.resolve(token);
    req.identity = result.identity;
    req.sessionToken = token;
    this.limit(`user:${result.identity.userId}`, 180);
    if (mutation) {
      const csrf = req.headers["x-csrf-token"];
      if (
        typeof csrf !== "string" ||
        Buffer.byteLength(csrf) !== Buffer.byteLength(result.csrfToken) ||
        !timingSafeEqual(Buffer.from(csrf), Buffer.from(result.csrfToken))
      )
        throw new ForbiddenException({
          code: "CSRF_INVALID",
          message: "Actualiza tu sesión e inténtalo de nuevo.",
        });
    }
    return true;
  }
}
