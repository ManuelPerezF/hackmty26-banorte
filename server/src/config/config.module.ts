import { Global, Module } from '@nestjs/common';
import { ENV, parseEnvironment } from './env';

@Global()
@Module({ providers: [{ provide: ENV, useFactory: () => parseEnvironment(process.env) }], exports: [ENV] })
export class ConfigModule {}
