# Backend Banorte

NestJS + Zod + Prisma + PostgreSQL. Login real, datos aislados por usuario y orquestación de asistente con MCP y A2UI.

```sh
# Desde la raíz
docker compose up -d --wait postgres
cd server
cp -n .env.example .env
npm ci
npm run prisma:generate
npm run db:deploy
npm run db:seed
npm run dev
```

API: `http://127.0.0.1:3001/api/v1`. `cp -n` conserva la configuración existente. Solo la base de datos usa Docker.

Los perfiles nuevos empiezan en cero, sin movimientos ni tarjetas precargadas. El registro público está deshabilitado. En una base nueva, configurar `BOOTSTRAP_EMAIL`/`BOOTSTRAP_PASSWORD` y `SECOND_TEST_EMAIL`/`SECOND_TEST_PASSWORD` antes del seed para aprovisionar dos cuentas. Si ya hay dos usuarios, el seed los conserva; no cambia credenciales ni elimina historial. Nunca versionar `.env`.

Gemini es el proveedor del chat y de RAG: configura `LLM_PROVIDER=gemini`, `GEMINI_API_KEY` y `LLM_MODEL`. El chat no cambia a otro proveedor por defecto. MCP utiliza las dependencias y el código compilado de este backend; `npm run dev` compila antes de arrancar. Para ejecutar sin watch: `npm run build && npm start`.

- [Backend y verificación](../docs/backend.md)
- [Endpoints y ejemplos](../docs/endpoints.md)
- [Autenticación](../docs/autenticacion.md)
- [Base de datos](../docs/base-de-datos.md)
- [Docker y variables](../docs/docker.md)
- [MCP](../docs/mcp.md), [LLM](../docs/llm.md), [A2UI](../docs/a2ui.md)

`npm run check` valida TypeScript y compilación. Se verificaron flujos HTTP y MCP con scripts temporales; no se recreó la carpeta `server/test` eliminada por decisión del usuario. El frontend consume esta API, incluido SSE y el catálogo A2UI. Ver [integración](../docs/frontend.md).
