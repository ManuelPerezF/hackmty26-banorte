# Backend Banorte

NestJS + Zod + Prisma + PostgreSQL. Cuenta y movimientos de demostración, con consultas paginadas e idempotencia en registros.

Desde la raíz, iniciar la base de datos y luego NestJS local:

```sh
docker compose up -d --wait postgres
cd server
cp -n .env.example .env
npm ci
npm run prisma:generate
npm run db:deploy
npm run db:seed
npm run dev
```

API: `http://127.0.0.1:3001/api/v1`. `cp -n` conserva un `.env` existente. No hay Dockerfile del backend.

- [Contrato de API](../docs/backend.md)
- [Desarrollo, Docker y pruebas](../docs/docker.md)
- [Modelo y migraciones](../docs/base-de-datos.md)
- [Arquitectura](../docs/arquitectura.md)
- [Pendientes del reto](../docs/reto-y-pendientes.md)

El frontend aún usa datos locales. No hay autenticación ni integración LLM/MCP/A2UI implementada en este backend.
