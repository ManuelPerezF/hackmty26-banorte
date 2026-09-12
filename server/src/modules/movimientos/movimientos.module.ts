import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { MovimientosController } from "./controllers/movimientos.controller";
import { MovimientosService } from "./services/movimientos.service";

@Module({
  imports: [DatabaseModule],
  controllers: [MovimientosController],
  providers: [MovimientosService],
  exports: [MovimientosService],
})
export class MovimientosModule {}
