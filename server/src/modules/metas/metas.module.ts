import {
  Body,
  ConflictException,
  Controller,
  Get,
  Headers,
  Injectable,
  Module,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  BadRequestException,
} from "@nestjs/common";
import { z } from "zod";
import { DatabaseModule } from "../../database/database.module";
import { PrismaService } from "../../database/prisma.service";
import { Prisma, Goal } from "../../generated/prisma/client";
import { CurrentUser, Identity } from "../autenticacion/auth.types";
import { dateSchema, todayInTimezone } from "../movimientos/schemas/movimiento.schema";
import { key, pagination, sameJson } from "../../shared/requests";
import { safeCents } from "../../shared/money";
import { ZodValidationPipe } from "../../shared/pipes/zod-validation.pipe";
const createSchema = z.strictObject({
  name: z.string().trim().min(1).max(80),
  targetCents: z.number().int().positive().max(99999999999),
  deadline: dateSchema.nullable().default(null),
});
const patchSchema = z
  .strictObject({
    name: createSchema.shape.name.optional(),
    targetCents: createSchema.shape.targetCents.optional(),
    deadline: dateSchema.nullable().optional(),
    status: z.enum(["active", "archived"]).optional(),
  })
  .refine((x) => Object.keys(x).length > 0);
export const goalQuerySchema = pagination.extend({
  status: z.enum(["active", "archived"]).default("active"),
});
const serialize = (g: Goal) => ({
  id: g.id,
  name: g.name,
  targetCents: safeCents(g.targetCents),
  deadline: g.deadline?.toISOString().slice(0, 10) ?? null,
  status: g.status,
  createdAt: g.createdAt.getTime(),
  updatedAt: g.updatedAt.getTime(),
});
@Injectable()
export class MetasService {
  constructor(private readonly db: PrismaService) {}
  async list(i: Identity, q: z.infer<typeof goalQuerySchema>) {
    const where = { profileId: i.profileId, status: q.status };
    const [items, total] = await this.db.$transaction(
      [
        this.db.goal.findMany({
          where,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          skip: (q.page - 1) * q.pageSize,
          take: q.pageSize,
        }),
        this.db.goal.count({ where }),
      ],
      { isolationLevel: "RepeatableRead" },
    );
    return { items: items.map(serialize), total, page: q.page, pageSize: q.pageSize };
  }
  async create(i: Identity, b: z.infer<typeof createSchema>, requestKey: string) {
    if (b.deadline && b.deadline < todayInTimezone(i.timezone))
      throw new BadRequestException("Plazo anterior a hoy.");
    try {
      return serialize(
        await this.db.goal.create({
          data: {
            ...b,
            deadline: b.deadline ? new Date(b.deadline) : null,
            targetCents: BigInt(b.targetCents),
            profileId: i.profileId,
            requestKey,
            originalInput: b,
          },
        }),
      );
    } catch (e) {
      if (!(e instanceof Prisma.PrismaClientKnownRequestError) || e.code !== "P2002") throw e;
      const old = await this.db.goal.findUniqueOrThrow({
        where: { profileId_requestKey: { profileId: i.profileId, requestKey } },
      });
      if (!sameJson(old.originalInput, b))
        throw new ConflictException("Clave usada con otros datos.");
      return serialize(old);
    }
  }
  async patch(i: Identity, id: string, b: z.infer<typeof patchSchema>) {
    if (b.deadline && b.deadline < todayInTimezone(i.timezone))
      throw new BadRequestException("Plazo anterior a hoy.");
    const found = await this.db.goal.findFirst({ where: { id, profileId: i.profileId } });
    if (!found) throw new NotFoundException();
    return serialize(
      await this.db.goal.update({
        where: { id },
        data: {
          ...b,
          targetCents: b.targetCents === undefined ? undefined : BigInt(b.targetCents),
          deadline: b.deadline === undefined ? undefined : b.deadline ? new Date(b.deadline) : null,
        },
      }),
    );
  }
}
@Controller("goals")
class MetasController {
  constructor(private readonly service: MetasService) {}
  @Get() list(
    @CurrentUser() i: Identity,
    @Query(new ZodValidationPipe(goalQuerySchema)) q: z.infer<typeof goalQuerySchema>,
  ) {
    return this.service.list(i, q);
  }
  @Post() create(
    @CurrentUser() i: Identity,
    @Body(new ZodValidationPipe(createSchema)) b: z.infer<typeof createSchema>,
    @Headers("idempotency-key") k: unknown,
  ) {
    return this.service.create(i, b, key(k));
  }
  @Patch(":id") patch(
    @CurrentUser() i: Identity,
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body(new ZodValidationPipe(patchSchema)) b: z.infer<typeof patchSchema>,
  ) {
    return this.service.patch(i, id, b);
  }
}
@Module({
  imports: [DatabaseModule],
  providers: [MetasService],
  exports: [MetasService],
  controllers: [MetasController],
})
export class MetasModule {}
