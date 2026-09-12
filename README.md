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
# Configurar las credenciales privadas antes del seed; ver docs/autenticacion.md.
npm run db:seed
npm run dev
```

Nest corre localmente en `http://127.0.0.1:3001/api/v1`. Docker ejecuta **solo PostgreSQL**. En otra terminal: `cd client`, `npm ci` y `npm run dev`; abrir `http://127.0.0.1:3000`.

## Áreas

- `client`: React por funcionalidades; login, cuentas/tarjetas, movimientos, metas, simulación y asistente conectados a Nest.
- `server`: Nest, Zod y Prisma; Argon2id, sesiones revocables, CSRF, autorización por usuario e historial persistente.
- `mcp`: servidor por stdio lanzado por Nest, con ocho herramientas financieras.
- `docs`: [guía](docs/README.md), [endpoints](docs/endpoints.md), [frontend](docs/frontend.md) y [pendientes del reto](docs/reto-y-pendientes.md).

El acceso es únicamente por login. Se conservan dos usuarios de prueba con sus propias cuentas, las tarjetas que ya tenían asignadas. El historial inicia vacío y el saldo se calcula a partir de los registros propios. No hay registro público. Las credenciales se configuran fuera de Git y el seed no reemplaza contraseñas ni borra datos existentes.

El asistente consume Gemini desde el backend, usa MCP y entrega mensajes A2UI v0.9.1 de un catálogo propio al renderer React. Configurar `GEMINI_API_KEY` en `server/.env`; sin clave devuelve 503. Se verificó desde navegador con Gemini real (gemini-3.1-flash-lite), MCP, A2UI, confirmación, escritura única y restauración de conversación. Ver [validación](docs/verificacion.md).

Los datos iniciales son sintéticos. Registrar un movimiento persiste una anotación financiera; no realiza pagos ni transferencias bancarias.
