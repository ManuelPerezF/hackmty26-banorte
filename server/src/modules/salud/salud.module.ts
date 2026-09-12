import { Public } from "../autenticacion/auth.types";
import { Controller, Get, Module, ServiceUnavailableException } from "@nestjs/common";
import { DatabaseModule } from "../../database/database.module";
import { PrismaService } from "../../database/prisma.service";

@Public()
@Controller("health")
class SaludController {
  constructor(private readonly prisma: PrismaService) {}
  @Get() live() {
    return { status: "ok", service: "banorte-api" };
  }
  @Get("ready") async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: "ok", database: "up" };
    } catch {
      throw new ServiceUnavailableException({ status: "unavailable", database: "down" });
    }
  }
}

@Module({ imports: [DatabaseModule], controllers: [SaludController] })
export class SaludModule {}
