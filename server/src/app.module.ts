import { AsistenteModule } from "./modules/asistente/asistente.module";
import { AuthModule } from "./modules/autenticacion/auth.module";
import { PerfilModule } from "./modules/perfil/perfil.module";
import { AnalisisModule } from "./modules/analisis/analisis.module";
import { MetasModule } from "./modules/metas/metas.module";
import { SimulacionesModule } from "./modules/simulaciones/simulaciones.module";
import { Module } from "@nestjs/common";
import { ConfigModule } from "./config/config.module";
import { CuentasModule } from "./modules/cuentas/cuentas.module";
import { MovimientosModule } from "./modules/movimientos/movimientos.module";
import { SaludModule } from "./modules/salud/salud.module";

@Module({
  imports: [
    ConfigModule,
    AsistenteModule,
    AuthModule,
    PerfilModule,
    AnalisisModule,
    MetasModule,
    SimulacionesModule,
    CuentasModule,
    MovimientosModule,
    SaludModule,
  ],
})
export class AppModule {}
