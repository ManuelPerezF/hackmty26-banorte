import {
  Controller,
  Get,
  Module,
  Patch,
  Body,
  Injectable,
  NotFoundException,
  ConflictException,
  Param,
  ParseUUIDPipe,
} from "@nestjs/common";
import { z } from "zod";
import { DatabaseModule } from "../../database/database.module";
import { PrismaService } from "../../database/prisma.service";
import { CurrentUser, Identity, Public } from "../autenticacion/auth.types";
import { ZodValidationPipe } from "../../shared/pipes/zod-validation.pipe";
@Injectable()
export class PerfilService {
  constructor(private readonly db: PrismaService) {}
  async me(i: Identity) {
    const p = await this.db.profile.findUniqueOrThrow({
      where: { id: i.profileId },
      include: { user: { select: { email: true } } },
    });
    return {
      id: p.id,
      displayName: p.displayName,
      email: p.user.email,
      locale: p.locale,
      timezone: p.timezone,
      preferredCardId: p.preferredCardId,
    };
  }
  async cards(i: Identity, id?: string) {
    const p = await this.db.profile.findUniqueOrThrow({ where: { id: i.profileId } });
    const items = await this.db.card.findMany({
      where: { profileId: i.profileId, id },
      include: { product: true },
      orderBy: { createdAt: "asc" },
    });
    return {
      items: items.map((c) => ({
        id: c.id,
        last4: c.last4,
        status: c.status,
        isPreferred: c.id === p.preferredCardId,
        product: c.product,
      })),
    };
  }
  async card(i: Identity, id: string) {
    const result = await this.cards(i, id);
    if (!result.items[0]) throw new NotFoundException();
    return result.items[0];
  }
  async preferences(i: Identity, preferredCardId: string | null) {
    if (preferredCardId) {
      const card = await this.card(i, preferredCardId);
      if (card.status !== "active") throw new ConflictException("Tarjeta inactiva.");
    }
    await this.db.profile.update({ where: { id: i.profileId }, data: { preferredCardId } });
    return { preferredCardId };
  }
  async products() {
    return { items: await this.db.cardProduct.findMany({ orderBy: { key: "asc" } }) };
  }
}
@Controller("me")
class PerfilController {
  constructor(private readonly service: PerfilService) {}
  @Get() me(@CurrentUser() i: Identity) {
    return this.service.me(i);
  }
  @Get("cards") cards(@CurrentUser() i: Identity) {
    return this.service.cards(i);
  }
  @Get("cards/:id") card(@CurrentUser() i: Identity, @Param("id", new ParseUUIDPipe()) id: string) {
    return this.service.card(i, id);
  }
  @Patch("preferences") preferences(
    @CurrentUser() i: Identity,
    @Body(new ZodValidationPipe(z.strictObject({ preferredCardId: z.uuid().nullable() }))) b: {
      preferredCardId: string | null;
    },
  ) {
    return this.service.preferences(i, b.preferredCardId);
  }
}
@Controller("card-products")
class ProductsController {
  constructor(private readonly service: PerfilService) {}
  @Public() @Get() get() {
    return this.service.products();
  }
}
@Module({
  imports: [DatabaseModule],
  providers: [PerfilService],
  controllers: [PerfilController, ProductsController],
  exports: [PerfilService],
})
export class PerfilModule {}
