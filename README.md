# Reto Banorte × Tec

Prototipo de banca personal con una interfaz adaptable, educación financiera contextual y exploración de inversiones.

## Frontend

La landing y las páginas de demostración están en `client`, organizadas por funcionalidades. Consultar [la arquitectura y las instrucciones del frontend](client/README.md).

```sh
cd client
npm ci
npm run dev
```

## Áreas del proyecto

- `client`: frontend importado e integrado.
- `server`: espacio reservado para la orquestación del agente y servicios bancarios simulados.
- `mcp`: espacio reservado para el servidor de herramientas MCP.

El frontend actual usa datos ficticios. Las conexiones LLM, MCP y A2UI están pendientes.
