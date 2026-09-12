import {
  Body,
  Controller,
  Module,
  Param,
  Req,
  SetMetadata,
  UnauthorizedException,
} from "@nestjs/common";
import { Post } from "@nestjs/common";
import type { Request } from "express";
import { DatabaseModule } from "../../database/database.module";
import { PrismaService } from "../../database/prisma.service";
import { PerfilModule, PerfilService } from "../../modules/perfil/perfil.module";
import { CuentasModule } from "../../modules/cuentas/cuentas.module";
import { CuentasService } from "../../modules/cuentas/services/cuentas.service";
import { MovimientosModule } from "../../modules/movimientos/movimientos.module";
import { MovimientosService } from "../../modules/movimientos/services/movimientos.service";
import {
  AnalisisModule,
  AnalisisService,
  insightsSchema,
} from "../../modules/analisis/analisis.module";
import {
  categories,
  movementSchema,
  movementQuerySchema,
} from "../../modules/movimientos/schemas/movimiento.schema";
import { CapabilityService } from "./capability.service";
import { McpService } from "./mcp.service";
import { ToolName, toolDefinitions } from "./tool-definitions";
import { ZodValidationPipe } from "../../shared/pipes/zod-validation.pipe";
@Controller("internal/tools")
class ToolGatewayController {
  constructor(
    private readonly caps: CapabilityService,
    private readonly profiles: PerfilService,
    private readonly accounts: CuentasService,
    private readonly movements: MovimientosService,
    private readonly insights: AnalisisService,
    private readonly db: PrismaService,
  ) {}
  @SetMetadata("auth:mcp", true) @Post(":name") async call(
    @Param("name") name: ToolName,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    const auth = req.headers.authorization;
    const cap = await this.caps.check(
      auth?.startsWith("Bearer ") ? auth.slice(7) : undefined,
      name,
    );
    if (!Object.hasOwn(toolDefinitions, name)) throw new UnauthorizedException();
    const b = new ZodValidationPipe(toolDefinitions[name].schema as any).transform(body) as any;
    const i = cap.identity;
    switch (name) {
      case "get_profile":
        return this.profiles.me(i);
      case "list_my_cards":
        return this.profiles.cards(i);
      case "get_account_summary":
        return this.accounts.summary(i);
      case "list_movements":
        return this.movements.list(movementQuerySchema.parse(b), i);
      case "get_movement":
        return this.movements.findOne(b.id, i);
      case "list_movement_categories":
        return { items: categories };
      case "get_spending_insights":
        return this.insights.spending(insightsSchema.parse(b), i);
      case "register_movement": {
        if (!cap.actionId) throw new UnauthorizedException();
        const action = await this.db.pendingAction.findFirst({
          where: {
            id: cap.actionId,
            sessionId: i.sessionId,
            turn: { conversation: { profileId: i.profileId } },
            status: { in: ["executing", "completed"] },
          },
        });
        if (!action) throw new UnauthorizedException();
        if (action.status === "completed") return action.result;
        const result = await this.movements.create(
          movementSchema.parse(action.payload),
          action.id,
          i,
        );
        await this.db.pendingAction.update({
          where: { id: action.id },
          data: { status: "completed", result },
        });
        return result;
      }
    }
  }
}
@Module({
  imports: [DatabaseModule, PerfilModule, CuentasModule, MovimientosModule, AnalisisModule],
  controllers: [ToolGatewayController],
  providers: [CapabilityService, McpService],
  exports: [McpService],
})
export class McpModule {}
