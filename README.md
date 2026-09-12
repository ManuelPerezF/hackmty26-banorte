# Reto Banorte × Tec

Prototipo de banca personal con una interfaz adaptable, educación financiera contextual y exploración de inversiones.

## Frontend

La landing y las páginas de demostración están en `client`, organizadas por funcionalidades. Consultar [la arquitectura y las instrucciones del frontend](client/README.md).

```sh
cd client
npm ci
npm run dev
```

## Backend y PostgreSQL

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

NestJS, Zod y Prisma se ejecutan localmente en `server`. Docker se utiliza únicamente para PostgreSQL; las migraciones y el seed se ejecutan desde el backend local. La API registra ingresos/gastos y consulta historial y saldo de una cuenta ficticia.

## Áreas del proyecto

- `client`: frontend organizado por dominios; actualmente usa `localStorage`.
- `server`: API NestJS modular con Prisma y PostgreSQL.
- `mcp`: guía para implementar las herramientas financieras; todavía sin servidor ejecutable.
- `docs`: [documentación por área, arquitectura y pendientes del reto](docs/README.md).

Frontend y backend todavía no están conectados. LLM, MCP y A2UI siguen pendientes. El acceso es de demostración y no almacena contraseñas.
