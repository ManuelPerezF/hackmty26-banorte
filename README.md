# Reto Banorte × Tec

Banca personal con historial propio, educación financiera contextual y una interfaz adaptable a la intención.

## Arranque

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

NestJS corre localmente en `http://127.0.0.1:3001/api/v1`. Docker ejecuta **solo PostgreSQL**. En otra terminal: `cd client`, `npm ci` y `npm run dev`.

## Áreas

- `client`: React por funcionalidades; sus pantallas aún usan datos locales. Falta conectarlas a la autenticación/API y registrar el renderer A2UI.
- `server`: NestJS, Zod y Prisma; registro/login con Argon2id y sesiones, autorización por usuario, tarjetas, movimientos, análisis, metas, simulaciones y asistente persistente con SSE.
- `mcp`: servidor ejecutable por stdio, lanzado automáticamente por Nest para cada turno; ocho herramientas financieras.
- `docs`: [guía del proyecto](docs/README.md), [endpoints](docs/endpoints.md) y [pendientes del reto](docs/reto-y-pendientes.md).

Cada registro crea un perfil, cuenta, dos tarjetas (Clásica y Oro) y nueve movimientos de ejemplo independientes. El login es real; los datos bancarios son sintéticos y los movimientos manuales persisten.

El adaptador Gemini está implementado. Configurar `GEMINI_API_KEY` en `server/.env` para enviar preguntas al asistente. Sin clave devuelve 503; no simula una respuesta del modelo. El backend genera mensajes A2UI v0.9.1 con catálogo propio; falta renderizarlos en el frontend.
