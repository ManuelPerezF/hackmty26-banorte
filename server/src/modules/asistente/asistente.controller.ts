import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import { CurrentUser, Identity } from "../autenticacion/auth.types";
import { ZodValidationPipe } from "../../shared/pipes/zod-validation.pipe";
import { key, pagination } from "../../shared/requests";
import { AsistenteService } from "./asistente.service";
import { actionSchema, AgentAction, conversationSchema, messageSchema } from "./asistente.schemas";
import { catalog } from "../../ui-protocol/a2ui";
@Controller("assistant")
export class AsistenteController {
  constructor(private readonly service: AsistenteService) {}
  @Get("catalog") catalog() {
    return catalog;
  }
  @Post("conversations") create(
    @CurrentUser() i: Identity,
    @Body(new ZodValidationPipe(conversationSchema)) b: { title: string },
    @Headers("idempotency-key") k: unknown,
  ) {
    return this.service.create(i, b.title, key(k));
  }
  @Get("conversations") list(
    @CurrentUser() i: Identity,
    @Query(new ZodValidationPipe(pagination)) q: { page: number; pageSize: number },
  ) {
    return this.service.list(i, q);
  }
  @Get("conversations/:id") detail(
    @CurrentUser() i: Identity,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Query(new ZodValidationPipe(pagination)) q: { page: number; pageSize: number },
  ) {
    return this.service.detail(i, id, q);
  }
  @Post("conversations/:id/messages") @HttpCode(202) send(
    @CurrentUser() i: Identity,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(messageSchema)) b: { content: string; mode: "coach" | "analyst" },
    @Headers("idempotency-key") k: unknown,
  ) {
    return this.service.send(i, id, b.content, key(k), b.mode);
  }
  @Post("conversations/:id/actions") @HttpCode(202) action(
    @CurrentUser() i: Identity,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(actionSchema)) b: AgentAction,
    @Headers("idempotency-key") k: unknown,
  ) {
    return this.service.action(i, id, b, key(k));
  }
  @Get("turns/:id") snapshot(
    @CurrentUser() i: Identity,
    @Param("id", new ParseUUIDPipe()) id: string,
  ) {
    return this.service.snapshot(i, id);
  }
  @Get("turns/:id/events") async events(
    @CurrentUser() i: Identity,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Res() res: Response,
  ) {
    await this.service.snapshot(i, id);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    await this.service.stream(i, id, res);
  }
}
