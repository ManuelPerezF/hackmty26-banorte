# A2UI: backend y renderer React

El backend genera mensajes A2UI **v0.9.1** usando un catálogo propio identificado por `urn:banorte:a2ui:catalog:1`. La generación, validación y renderer React están implementados. Se verificaron en navegador con MCP real y un plan de modelo controlado; también se validó el ciclo de saldo, formulario y confirmación con Gemini real (Flash-Lite).

No se genera JSX, HTML ni código ejecutable. El LLM propone bloques permitidos; Nest obtiene sus datos y construye un árbol validado con Zod.

## Mensajes y catálogo

Cada snapshot incluye, en orden:

1. `createSurface`: surfaceId y catalogId.
2. `updateComponents`: raíz Column con id root y referencias a componentes.
3. `updateDataModel`: datos del dominio en la ruta `/`.

Todos llevan `version: "v0.9.1"`. El surfaceId es el UUID del turno y la revisión final es 1. Cada turno crea una superficie nueva; al restaurar un snapshot, el cliente debe reconstruir o sustituir esa superficie, no emitir createSurface dos veces sobre una existente.

`GET /assistant/catalog` devuelve JSON Schema del catálogo y requiere sesión. Incluye Column, Text, BanorteBalance, BanorteMovementTable, BanorteSpendingChart, BanorteMovementForm, BanorteConfirmation, BanorteActionResult , BanortePeriodSelector, BanorteCardList, BanorteGoalList y BanorteSavingsSimulator. Los componentes Banorte tienen `data: {path: "/..."}` y, cuando corresponde, `action` como nombre del evento del catálogo. El renderer propio debe implementar ese contrato; no son componentes incluidos automáticamente en el catálogo básico de A2UI.

## Acciones de la aplicación

`POST /assistant/conversations/:id/actions` recibe un evento con surfaceId, revision y valores o actionId. No se presenta como un nuevo tipo oficial de mensaje A2UI: es el adaptador HTTP del catálogo de producto.

| Evento | Efecto |
| --- | --- |
| simulate_savings | Valida supuestos explícitos, calcula por MCP y devuelve nueva superficie sin una llamada LLM adicional |
| change_period | Consulta el nuevo periodo mediante MCP y solicita nueva UI |
| submit_movement_form | Valida y guarda una acción pendiente; muestra confirmación |
| confirm_movement | Ejecuta payload aprobado por MCP y devuelve resultado/saldo/historial |
| cancel_movement | Cancela sin escribir el movimiento |

El servidor comprueba componente disponible, revisión, conversación, propietario, sesión, estado y vencimiento. Una aprobación no reenvía ni modifica el monto guardado. Cada POST usa Idempotency-Key; la escritura usa además el UUID de la acción como clave estable.

## SSE y restauración

`GET /assistant/turns/:id/events` envía eventos `snapshot`, `done` y `error`; heartbeat cada quince segundos. Se revisa el estado una vez por segundo y se emite al cambiar. No hay streaming token por token ni replay de deltas mediante Last-Event-ID. El snapshot persistido también está disponible por GET normal.

El cliente abre EventSource con `{withCredentials: true}`, muestra estado de trabajo y aplica la secuencia de mensajes del snapshot. Al terminar recibe done y cierra. La sesión se revalida durante el stream.

Los mensajes generados se validaron también contra el JSON Schema oficial server-to-client y el catálogo propio con Ajv. Un componente ajeno al catálogo fue rechazado.

## Renderer del frontend

`client/src/modules/asistente` registra los componentes del catálogo, resuelve rutas del data model y valida datos con Zod antes de renderizar. Formularios y confirmaciones envían acciones con cookies, CSRF e idempotencia. La interfaz muestra errores, restaura snapshots y se desmonta al cerrar sesión. Ver [frontend](frontend.md).

Referencia del protocolo: [esquema server-to-client v0.9.1](https://a2ui.org/specification/v0_9_1/server_to_client.json). El alcance actual es el subconjunto de mensajes descrito arriba, con catálogo propio.

## Nuevos bloques financieros

- `cards` → `BanorteCardList`: productos y últimas cuatro cifras devueltos por `list_my_cards`; imágenes locales del catálogo, estado y preferencia real. Sin inventar tarjetas, CVV o límites.
- `goals` → `BanorteGoalList`: lista y monto objetivo de `list_goals`; no presenta objetivos como dinero apartado ni inventa avance.
- `savings` → `BanorteSavingsSimulator`: formulario vacío si faltan supuestos, o resultado de `simulate_savings` con capital, aportación, plazo, tasa y calendario. Los valores se expresan en centavos y la tasa en puntos base. Recalcular crea un nuevo turno determinista por MCP, conservando el escenario anterior deshabilitado. No necesita regenerar texto con Gemini.

Se conserva el identificador del catálogo para restaurar conversaciones existentes. El backend valida entradas del turno y componentes; el cliente valida cada bloque antes de renderizar. Los tres bloques se implementan en `components/financial-blocks.tsx` dentro del dominio Asistente.
