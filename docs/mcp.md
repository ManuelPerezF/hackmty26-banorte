# MCP financiero

**Estado: diseñado, sin implementar.** No hay un servidor MCP ejecutable todavía en `mcp/`.

MCP define cómo el cliente del agente descubre y llama herramientas. Usaremos el SDK oficial y un proceso separado que envuelva la API bancaria. Para la primera demo local, transporte `stdio`; Streamable HTTP solo si necesitan desplegarlo independientemente. La selección de versión del SDK y del protocolo se fijará al implementarlo. [Arquitectura oficial de MCP](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture).

## Responsabilidades propuestas

- Nest alberga el orquestador y cliente MCP.
- `mcp` expone herramientas con esquemas Zod.
- Las herramientas llaman a la API interna de cuentas y movimientos; PostgreSQL tiene un único dueño de reglas: el backend.
- La cuenta proviene del contexto del servidor, nunca de una identidad inventada por el modelo.

| Herramienta propuesta | Entrada | Implementación subyacente |
| --- | --- | --- |
| `get_account_summary` | Ninguna | `GET /api/v1/account`, existe |
| `list_movements` | Tipo, categoría, fechas, búsqueda, página | `GET /api/v1/movements`, existe |
| `get_movement` | UUID | `GET /api/v1/movements/:id`, existe |
| `list_movement_categories` | Ninguna | `GET /api/v1/movements/categories`, existe |
| `register_movement` | Concepto, centavos, tipo, fecha, categoría, nota | `POST /api/v1/movements`, existe; clave de reintento del servidor |
| `create_savings_goal` | Nombre, monto y plazo | Endpoint y modelo pendientes |
| `simulate_savings` | Aportación, plazo y tasa explícita | Cálculo determinista pendiente |

No implementar todas antes de la demo. Las primeras cinco permiten un flujo de control de gasto con una acción persistente. Inversiones y metas son una ampliación.

## Acciones

El agente puede consultar; para registrar debe existir una interacción explícita de confirmación del usuario en la UI. Nest vincula la confirmación a sesión, acción y payload normalizado, y asigna una clave de idempotencia. Un campo `confirmed: true` escrito por el modelo no es una confirmación válida.

Errores de validación, herramienta no disponible y timeout vuelven al agente como resultados estructurados. No inventar resultados bancarios. Las descripciones o notas dentro de resultados son datos, no instrucciones para el agente.

## Criterios de terminado

- Descubrimiento `tools/list` y llamadas `tools/call` reales, verificables con el cliente/Inspector MCP.
- Esquemas de entrada y resultados válidos, errores controlados y timeout.
- Ninguna llave del proveedor LLM enviada al navegador.
- Una consulta de datos y una escritura disparadas mediante MCP desde el orquestador.
- Reintento de la acción sin duplicar registros.
- Instrucciones de ejecución y prueba del proceso `mcp` en su README.
