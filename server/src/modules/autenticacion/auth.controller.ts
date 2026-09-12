import { Body, Controller, Get, HttpCode, Inject, Post, Req, Res } from "@nestjs/common";
import { parse } from "cookie";
import type { Response } from "express";
import { ENV, Environment } from "../../config/env";
import { ZodValidationPipe } from "../../shared/pipes/zod-validation.pipe";
import { AuthRequest, Public } from "./auth.types";
import { AuthService, sessionCookie } from "./auth.service";
import { loginSchema, registerSchema, Registration } from "./auth.schemas";
@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    @Inject(ENV) private readonly env: Environment,
  ) {}
  private options() {
    return { httpOnly: true, secure: this.env.COOKIE_SECURE, sameSite: "lax" as const, path: "/" };
  }
  @Public() @Post("register") register(
    @Body(new ZodValidationPipe(registerSchema)) body: Registration,
  ) {
    return this.auth.register(body);
  }
  @Public() @Post("login") @HttpCode(200) async login(
    @Body(new ZodValidationPipe(loginSchema)) body: { email: string; password: string },
    @Req() req: AuthRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.login(
      body.email,
      body.password,
      parse(req.headers.cookie ?? "")[sessionCookie],
    );
    res.cookie(sessionCookie, result.token, {
      ...this.options(),
      maxAge: this.env.SESSION_HOURS * 3600000,
    });
    res.setHeader("Cache-Control", "no-store");
    return result.data;
  }
  @Get("session") async session(@Req() req: AuthRequest) {
    const { identity, ...result } = await this.auth.resolve(req.sessionToken!);
    return result;
  }
  @Post("logout") @HttpCode(204) async logout(
    @Req() req: AuthRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.revokeToken(req.sessionToken!);
    res.clearCookie(sessionCookie, this.options());
  }
}
