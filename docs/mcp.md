# MCP financiero

Implementado con `@modelcontextprotocol/sdk`: cliente Nest y servidor `mcp/server.cjs` sobre stdio. Nest inicia un proceso por turno, descubre herramientas, las llama y cierra el proceso al terminar. El servidor reutiliza las dependencias de `server` y los esquemas compilados; primero instalar y compilar el backend.

## Herramientas

| Nombre | Entrada | Alcance |
| --- | --- | --- |
| get_profile | `{}` | Perfil autenticado |
| list_my_cards | `{}` | Dos tarjetas asignadas |
| get_account_summary | `{}` | Saldo e ingresos/gastos |
| list_movements | Filtros y paginación del historial | Cuenta autenticada |
| get_movement | `{id}` | Detalle propio |
| list_movement_categories | `{}` | Catálogo de categorías |
| get_spending_insights | from/to, category, bucket opcionales | Agregados propios |
| register_movement | `{}` | Payload de una acción aprobada en servidor |

Los esquemas Zod compartidos están en `server/src/integrations/mcp/tool-definitions.ts`. El LLM solo recibe las siete herramientas de lectura. Una confirmación válida permite que el orquestador ejecute `register_movement` con la acción previamente persistida; el modelo no puede inventar una aprobación ni cambiar su monto.

## Autorización del proceso

Nest crea una capacidad opaca criptográfica de dos minutos, asociada en memoria a identidad, sesión, herramientas permitidas y acción aprobada opcional. La inyecta al proceso mediante `BANORTE_CAPABILITY`, junto con la URL local. El hijo no recibe la clave Gemini ni la contraseña de PostgreSQL.

El servidor MCP llama `POST /api/v1/internal/tools/:name` con `Authorization: Bearer <capacidad>`. El gateway verifica existencia, caducidad, alcance y sesión activa. El modelo nunca recibe el token. Al cerrar el cliente, Nest revoca la capacidad. No es JWT ni una credencial aceptada por rutas de usuario.

`register_movement` exige una PendingAction executing/completed de esa sesión y perfil. Usa el UUID de la acción como clave idempotente; los reintentos recuperan el mismo movimiento. El resultado vuelve al orquestador y después al modelo para explicar el estado actualizado.

## Operación y prueba

`MCP_ENTRY=../mcp/server.cjs` se resuelve desde `server`. No hace falta iniciar un servidor MCP manualmente ni instalar otra carpeta node_modules. stdout está reservado al protocolo; errores de proceso usan stderr. Timeout de conexión y llamadas: diez segundos, además del límite global del turno.

Se probó descubrimiento de ocho herramientas y llamadas reales por stdio, incluyendo rechazo de escritura con capacidad de lectura y registro confirmado sin duplicados. Las capacidades viven en una sola instancia Nest; un despliegue con varias instancias requerirá rediseñar su almacenamiento/ruteo.
