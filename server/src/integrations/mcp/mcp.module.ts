import { comparisonSchema, comparePeriods } from "../../modules/analisis/comparison";
import { KnowledgeModule } from "../../modules/conocimiento/knowledge.module";
import { KnowledgeService } from "../../modules/conocimiento/knowledge.service";
import { knowledgeQuerySchema } from "../../modules/conocimiento/knowledge.schemas";
import { z } from "zod";
import { MetasModule, MetasService, goalQuerySchema } from "../../modules/metas/metas.module";
import { simulate, simulationSchema } from "../../modules/simulaciones/simulaciones.module";
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
import {
  PlaneacionModule,
  PlaneacionService,
  contributionSchema,
} from "../../modules/planeacion/planeacion.module";
import {
  RecompensasModule,
  RecompensasService,
  rewardQuerySchema,
} from "../../modules/recompensas/recompensas.module";
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
    private readonly goals: MetasService,
    private readonly knowledge: KnowledgeService,
    private readonly planning: PlaneacionService,
    private readonly rewards: RecompensasService,
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
    const parse = <S extends z.ZodType>(schema: S): z.output<S> =>
      new ZodValidationPipe(schema).transform(body) as z.output<S>;
    parse(toolDefinitions[name].schema);
    const i = cap.identity;
    switch (name) {
      case "compare_spending_periods": {
        const q = parse(comparisonSchema);
        const [first, second] = await Promise.all([
          this.insights.spending({ ...q.first, category: q.category }, i),
          this.insights.spending({ ...q.second, category: q.category }, i),
        ]);
        return comparePeriods(first, second);
      }
      case "search_financial_knowledge":
        return this.knowledge.search(parse(knowledgeQuerySchema));
      case "get_profile":
        return this.profiles.me(i);
      case "list_my_cards":
        return this.profiles.cards(i);
      case "get_account_summary":
        return this.accounts.summary(i);
      case "list_movements":
        return this.movements.list(parse(movementQuerySchema), i);
      case "get_movement":
        return this.movements.findOne(parse(toolDefinitions.get_movement.schema).id, i);
      case "list_movement_categories":
        return { items: categories };
      case "get_spending_insights":
        return this.insights.spending(parse(insightsSchema), i);
      case "list_goals":
        return this.goals.list(i, parse(goalQuerySchema));
      case "simulate_savings":
        return simulate(parse(simulationSchema));
      case "get_spending_forecast":
        return this.planning.forecast(i);
      case "get_budgets":
        return this.planning.budgets(i);
      case "list_recurrences":
        return this.planning.recurrences(i);
      case "get_financial_health":
        return this.planning.health(i);
      case "get_coach_actions":
        return this.planning.coachActions(i);
      case "get_reward_points":
        return this.rewards.points(i, parse(rewardQuerySchema));
      case "contribute_to_goal": {
        // Igual que register_movement: el modelo no aporta datos, solo dispara
        // la acción que el usuario ya confirmó y que vive en el servidor.
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
        const payload = contributionSchema.parse(action.payload);
        if (action.status === "completed") return action.result;
        const result = await this.planning.contribute(i, payload, action.id);
        await this.db.pendingAction.update({
          where: { id: action.id },
          data: { status: "completed", result },
        });
        return result;
      }
      case "apply_goal_change": {
        if (!cap.actionId) throw new UnauthorizedException();
        return this.goals.applyConfirmed(i, cap.actionId);
      }
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
        movementSchema.parse(action.payload);
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
  imports: [
    DatabaseModule,
    KnowledgeModule,
    PerfilModule,
    CuentasModule,
    MovimientosModule,
    AnalisisModule,
    MetasModule,
    PlaneacionModule,
    RecompensasModule,
  ],
  controllers: [ToolGatewayController],
  providers: [CapabilityService, McpService],
  exports: [McpService],
})
export class McpModule {}
