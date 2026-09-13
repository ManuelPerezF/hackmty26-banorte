# Servidor MCP financiero

`server.ts` implementa catorce herramientas del proyecto mediante el SDK oficial y transporte stdio. Nest lo inicia automáticamente por turno con una capacidad breve de autorización; no necesita un puerto ni un contenedor propios.

Primero instalar, generar Prisma y compilar el backend siguiendo [server/README.md](../server/README.md). El proceso usa `server/node_modules` y los esquemas de `server/dist`. No ejecutarlo sin las variables privadas que inyecta el orquestador.

Ver [herramientas, autorización y verificación](../docs/mcp.md).

## TypeScript

El código fuente es `server.ts`, con tipado estricto. No se mantiene una implementación JavaScript paralela: `dist/server.js` es salida ignorada por Git. Se reutilizan el SDK, Zod y los contratos compilados del backend.

Desde `server/`, `npm run check` valida y construye ambos procesos. Para cambios solo en este ejecutable, `npm run mcp:build`. `MCP_ENTRY=../mcp/dist/server.js` se resuelve desde el directorio del backend.
