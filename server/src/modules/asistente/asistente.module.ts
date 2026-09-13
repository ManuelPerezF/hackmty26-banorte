import { MetasModule } from "../metas/metas.module";
import { PlaneacionModule } from "../planeacion/planeacion.module";
import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { McpModule } from "../../integrations/mcp/mcp.module";
import { LlmService } from "../../integrations/llm/llm.service";
import { AsistenteService } from "./asistente.service";
import { AsistenteController } from "./asistente.controller";
@Module({
  imports: [DatabaseModule, McpModule, MetasModule, PlaneacionModule],
  providers: [LlmService, AsistenteService],
  controllers: [AsistenteController],
})
export class AsistenteModule {}
