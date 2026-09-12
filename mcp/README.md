# Servidor MCP financiero

`server.cjs` implementa ocho herramientas del proyecto mediante el SDK oficial y transporte stdio. Nest lo inicia automáticamente por turno con una capacidad breve de autorización; no necesita un puerto ni un contenedor propios.

Primero instalar, generar Prisma y compilar el backend siguiendo [server/README.md](../server/README.md). El proceso usa `server/node_modules` y los esquemas de `server/dist`. No ejecutarlo sin las variables privadas que inyecta el orquestador.

Ver [herramientas, autorización y verificación](../docs/mcp.md).
