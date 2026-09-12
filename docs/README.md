# Documentación del proyecto

Prototipo de banca personal para el reto Banorte × Tec. La experiencia propuesta permite entender los gastos, registrar movimientos y recibir educación financiera mediante una interfaz que se adapta a la intención. Inversiones se limita inicialmente a simulaciones educativas.

## Mapa

| Documento | Contenido |
| --- | --- |
| [Arquitectura](arquitectura.md) | Responsabilidades, flujo actual y objetivo, decisiones |
| [Frontend](frontend.md) | Pantallas, módulos y conexión pendiente con la API |
| [Backend](backend.md) | NestJS, Zod, endpoints y ejemplos de solicitudes |
| [Base de datos](base-de-datos.md) | Prisma, modelo, dinero, migraciones y seed |
| [Docker y desarrollo](docker.md) | Arranque, variables, pruebas y diagnóstico |
| [MCP](mcp.md) | Herramientas propuestas y conexión con el agente |
| [LLM](llm.md) | Orquestación, contexto, decisiones y evaluación |
| [A2UI](a2ui.md) | Contrato visual, renderer y regreso de eventos |
| [Seguridad para el hackathon](seguridad.md) | Decisión sobre login, contraseñas y despliegue |
| [Reto y pendientes](reto-y-pendientes.md) | Requisitos de la diapositiva, rúbrica, backlog y entregables |

## Estado real

- Frontend implementado con datos de demostración y movimientos en `localStorage`.
- Backend NestJS implementado con cuentas y movimientos en PostgreSQL, validación Zod y Prisma.
- Docker Compose ejecuta únicamente PostgreSQL. NestJS, migraciones y seed se ejecutan localmente.
- Frontend y backend **todavía no están conectados**. Sus registros son independientes.
- LLM, servidor MCP propio y renderer A2UI **pendientes**. La carpeta `mcp` contiene solamente una guía.
- La pantalla de acceso abre una demo; no autentica usuarios ni envía contraseñas al backend.

## Primer arranque

Desde la raíz:

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

En otra terminal, desde `client`, ejecutar `npm ci` y `npm run dev`. Backend en `http://127.0.0.1:3001/api/v1`; frontend en `http://127.0.0.1:3000`. Consultar [Docker](docker.md) para desarrollo con recarga del backend y [pendientes](reto-y-pendientes.md) para el siguiente flujo que debe completarse.
