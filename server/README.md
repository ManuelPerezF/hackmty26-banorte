# Backend Banorte

NestJS + Zod + Prisma + PostgreSQL. Registro/login real, datos aislados por usuario y orquestación de asistente con MCP y A2UI.

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

Crear usuarios con `POST /auth/register` y luego iniciar sesión. Opcionalmente configurar `BOOTSTRAP_EMAIL` y `BOOTSTRAP_PASSWORD` antes del seed para habilitar el propietario del historial original. El seed no cambia la contraseña de un usuario ya habilitado. Nunca versionar `.env`.

Configurar `GEMINI_API_KEY` para el asistente. MCP utiliza las dependencias y el código compilado de este backend; `npm run dev` compila antes de arrancar. Para ejecutar sin watch: `npm run build && npm start`.

- [Backend y verificación](../docs/backend.md)
- [Endpoints y ejemplos](../docs/endpoints.md)
- [Autenticación](../docs/autenticacion.md)
- [Base de datos](../docs/base-de-datos.md)
- [Docker y variables](../docs/docker.md)
- [MCP](../docs/mcp.md), [LLM](../docs/llm.md), [A2UI](../docs/a2ui.md)

`npm run check` valida TypeScript y compilación. Se verificaron flujos HTTP y MCP con scripts temporales; no se recreó la carpeta `server/test` eliminada por decisión del usuario. El frontend aún no consume esta API.
