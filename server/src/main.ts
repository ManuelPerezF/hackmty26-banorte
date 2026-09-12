import "reflect-metadata";
import "dotenv/config";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { ENV, Environment } from "./config/env";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const env = app.get<Environment>(ENV);
  app.setGlobalPrefix("api/v1");
  app.use(helmet());
  app.use((_req: unknown, res: import("express").Response, next: () => void) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  app.useBodyParser("json", { limit: "32kb" });
  app.enableCors({
    origin: env.CORS_ORIGINS,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Idempotency-Key", "X-CSRF-Token"],
  });
  app.enableShutdownHooks();
  await app.listen(env.PORT, env.HOST);
  Logger.log(`API en http://${env.HOST}:${env.PORT}/api/v1`, "Bootstrap");
}
void bootstrap().catch(() => {
  Logger.error(
    "No se pudo iniciar la API. Revisa la configuración y PostgreSQL.",
    undefined,
    "Bootstrap",
  );
  process.exitCode = 1;
});
