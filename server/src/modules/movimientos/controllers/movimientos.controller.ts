import { CurrentUser, Identity } from "../../autenticacion/auth.types";
import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post, Query } from "@nestjs/common";
import { ZodValidationPipe } from "../../../shared/pipes/zod-validation.pipe";
import {
  CreateMovement,
  idempotencySchema,
  MovementQuery,
  movementQuerySchema,
  movementSchema,
  categories,
} from "../schemas/movimiento.schema";
import { MovimientosService } from "../services/movimientos.service";

@Controller("movements")
export class MovimientosController {
  constructor(private readonly movements: MovimientosService) {}
  @Get("categories") categories() {
    return { items: categories };
  }
  @Get() list(
    @Query(new ZodValidationPipe(movementQuerySchema)) query: MovementQuery,
    @CurrentUser() identity: Identity,
  ) {
    return this.movements.list(query, identity);
  }
  @Get(":id") detail(
    @Param("id", new ParseUUIDPipe()) id: string,
    @CurrentUser() identity: Identity,
  ) {
    return this.movements.findOne(id, identity);
  }
  @Post() create(
    @Body(new ZodValidationPipe(movementSchema)) body: CreateMovement,
    @Headers("idempotency-key") key: unknown,
    @CurrentUser() identity: Identity,
  ) {
    return this.movements.create(
      body,
      new ZodValidationPipe(idempotencySchema).transform(key),
      identity,
    );
  }
}
