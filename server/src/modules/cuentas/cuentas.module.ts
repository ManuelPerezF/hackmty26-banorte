import { Module } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { CuentasController } from "./controllers/cuentas.controller";
import { CuentasService } from "./services/cuentas.service";

@Module({
  imports: [DatabaseModule],
  controllers: [CuentasController],
  providers: [CuentasService],
  exports: [CuentasService],
})
export class CuentasModule {}
