import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { CuentasModule } from './modules/cuentas/cuentas.module';
import { MovimientosModule } from './modules/movimientos/movimientos.module';
import { SaludModule } from './modules/salud/salud.module';

@Module({ imports: [ConfigModule, CuentasModule, MovimientosModule, SaludModule] })
export class AppModule {}
