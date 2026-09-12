import { createParamDecorator, ExecutionContext, SetMetadata } from "@nestjs/common";
import type { Request } from "express";
export type Identity = {
  userId: string;
  profileId: string;
  accountId: string;
  sessionId: string;
  timezone: string;
};
export type AuthRequest = Request & { identity: Identity; sessionToken?: string };
export const PUBLIC = "auth:public";
export const Public = () => SetMetadata(PUBLIC, true);
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Identity =>
    ctx.switchToHttp().getRequest<AuthRequest>().identity,
);
