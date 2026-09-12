# MCP financiero

Implementado con `@modelcontextprotocol/sdk`: cliente Nest y servidor TypeScript `mcp/server.ts` (compilado a `mcp/dist/server.js`) sobre stdio. Nest inicia un proceso por turno, descubre herramientas, las llama y cierra el proceso al terminar. El servidor reutiliza las dependencias de `server` y los esquemas compilados; primero instalar y compilar el backend.

## Herramientas

| Nombre | Entrada | Alcance |
| --- | --- | --- |
| get_profile | `{}` | Perfil autenticado |
| list_my_cards | `{}` | Tarjetas asignadas al perfil, o lista vacía |
| get_account_summary | `{}` | Saldo e ingresos/gastos |
| list_movements | Filtros y paginación del historial | Cuenta autenticada |
| get_movement | `{id}` | Detalle propio |
| list_movement_categories | `{}` | Catálogo de categorías |
| get_spending_insights | from/to, category, bucket opcionales | Agregados propios |
| list_goals | status, page y pageSize | Metas propias, sin inventar progreso |
| simulate_savings | initialCents, monthlyContributionCents, months, annualRateBps | Cálculo determinista sin escribir dinero |
| compare_spending_periods | first y second con from/to; category opcional | Dos periodos propios, diferencia de gastos y porcentaje calculado; null si base cero |
| search_financial_knowledge | query, product opcional, limit 1–5, includeHistorical | Folletos y guías con fragmento, página y vigencia; lectura mediante RAG |
| register_movement | `{}` | Payload de una acción aprobada en servidor |

Los esquemas Zod compartidos están en `server/src/integrations/mcp/tool-definitions.ts`. El LLM solo recibe las once herramientas de lectura y cálculo. Una confirmación válida permite que el orquestador ejecute `register_movement` con la acción previamente persistida; el modelo no puede inventar una aprobación ni cambiar su monto.

## Autorización del proceso

Nest crea una capacidad opaca criptográfica de dos minutos, asociada en memoria a identidad, sesión, herramientas permitidas y acción aprobada opcional. La inyecta al proceso mediante `BANORTE_CAPABILITY`, junto con la URL local. El hijo no recibe la clave Gemini ni la contraseña de PostgreSQL.

El servidor MCP llama `POST /api/v1/internal/tools/:name` con `Authorization: Bearer <capacidad>`. El gateway verifica existencia, caducidad, alcance y sesión activa. El modelo nunca recibe el token. Al cerrar el cliente, Nest revoca la capacidad. No es JWT ni una credencial aceptada por rutas de usuario.

`register_movement` exige una PendingAction executing/completed de esa sesión y perfil. Usa el UUID de la acción como clave idempotente; los reintentos recuperan el mismo movimiento. El resultado vuelve al orquestador y después al modelo para explicar el estado actualizado.

## Operación y prueba

`MCP_ENTRY=../mcp/dist/server.js` se resuelve desde `server`. No hace falta iniciar un servidor MCP manualmente ni instalar otra carpeta node_modules. stdout está reservado al protocolo; errores de proceso usan stderr. Timeout de conexión y llamadas: diez segundos, además del límite global del turno.

Se probó descubrimiento de doce herramientas y llamadas reales por stdio, incluyendo rechazo de escritura con capacidad de lectura y registro confirmado sin duplicados. Las capacidades viven en una sola instancia Nest; un despliegue con varias instancias requerirá rediseñar su almacenamiento/ruteo.

## Contratos y errores

Las doce herramientas tienen título, descripción de unidades/filtros y anotaciones MCP (`readOnlyHint`, `idempotentHint`, `destructiveHint`, `openWorldHint`). Estas anotaciones describen la operación; la autorización se comprueba en el gateway, independientemente de ellas.

Cada resultado incluye `structuredContent` y una copia JSON en contenido textual para clientes compatibles. Nest consume primero el resultado estructurado. Los fallos de ejecución usan `isError` y códigos `INVALID_INPUT`, `ACCESS_DENIED`, `NOT_FOUND`, `CONFLICT`, `API_UNAVAILABLE`, `INVALID_RESPONSE` o `CANCELLED`. Los argumentos inválidos también pueden rechazarse directamente por el SDK. No se devuelven trazas ni cuerpos privados del backend.

El proceso solo acepta una URL HTTP loopback de Nest, no sigue redirecciones y combina la cancelación del cliente con un timeout de diez segundos. No tiene acceso directo a PostgreSQL.

Desde `server/`: `npm run check` verifica tipos y compila tanto Nest como MCP. `npm run mcp:build` recompila solo el ejecutable; después de cambiar esquemas de dominio, recompilar también Nest. `npm run dev` compila MCP al arrancar; si cambias `mcp/server.ts` durante desarrollo, vuelve a ejecutar `npm run mcp:build`.

Referencia: [herramientas y resultados estructurados en MCP](https://modelcontextprotocol.io/specification/2025-11-25/server/tools).
