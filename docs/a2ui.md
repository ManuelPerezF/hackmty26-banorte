# A2UI: backend y renderer React

El backend genera mensajes A2UI **v0.9.1** usando un catálogo propio identificado por `urn:banorte:a2ui:catalog:1`. La generación, validación y renderer React están implementados. Se verificaron en navegador con MCP real y un plan de modelo controlado; también se validó el ciclo de saldo, formulario y confirmación con Gemini real (Flash-Lite).

No se genera JSX, HTML ni código ejecutable. El LLM propone bloques permitidos; Nest obtiene sus datos y construye un árbol validado con Zod.

## Mensajes y catálogo

Cada snapshot incluye, en orden:

1. `createSurface`: surfaceId y catalogId.
2. `updateComponents`: raíz Column con id root y referencias a componentes.
3. `updateDataModel`: datos del dominio en la ruta `/`.

Todos llevan `version: "v0.9.1"`. El surfaceId es el UUID del turno y la revisión final es 1. Cada turno crea una superficie nueva; al restaurar un snapshot, el cliente debe reconstruir o sustituir esa superficie, no emitir createSurface dos veces sobre una existente.

`GET /assistant/catalog` devuelve JSON Schema del catálogo y requiere sesión. Incluye Column, Text, BanorteBalance, BanorteMovementTable, BanorteSpendingChart, BanorteMovementForm, BanorteConfirmation, BanorteActionResult, BanortePeriodSelector, BanorteCardList, BanorteGoalList, BanorteGoalConfirmation, BanorteSavingsSimulator, BanorteSources, BanortePeriodComparison y BanorteKnowledgeFacts. Los componentes Banorte tienen `data: {path: "/..."}` y, cuando corresponde, `action` como nombre del evento del catálogo. El renderer propio debe implementar ese contrato; no son componentes incluidos automáticamente en el catálogo básico de A2UI.

## Acciones de la aplicación

`POST /assistant/conversations/:id/actions` recibe un evento con surfaceId, revision y valores o actionId. No se presenta como un nuevo tipo oficial de mensaje A2UI: es el adaptador HTTP del catálogo de producto.

| Evento | Efecto |
| --- | --- |
| simulate_savings | Valida supuestos explícitos, calcula por MCP y devuelve nueva superficie sin una llamada LLM adicional |
| change_period | Recalcula gráfica y movimientos mediante MCP, conservando la categoría seleccionada y sustituyendo la respuesta visible |
| select_category | Abre movimientos de una categoría de la gráfica, con paginación y limpieza del filtro |
| list_goals | Cambia entre metas activas/archivadas o página, en la misma respuesta |
| prepare_goal | Valida crear/editar/archivar/recuperar y persiste una confirmación, sin cambiar la meta |
| confirm_goal | Ejecuta por MCP exactamente el cambio guardado en la confirmación |
| cancel_goal | Cancela la confirmación sin modificar la meta |
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
- `savings` → `BanorteSavingsSimulator`: formulario vacío si faltan supuestos, o resultado de `simulate_savings` con capital, aportación, plazo, tasa y calendario. Los valores se expresan en centavos y la tasa en puntos base. Recalcular crea un turno de auditoría determinista por MCP y sustituye el contenido de la misma respuesta visible. El snapshot anterior se conserva en el backend. No necesita regenerar texto con Gemini.

Se conserva el identificador del catálogo para restaurar conversaciones existentes. El backend valida entradas del turno y componentes; el cliente valida cada bloque antes de renderizar. Los tres bloques se implementan en `components/financial-blocks.tsx` dentro del dominio Asistente.

## Fuentes RAG

`BanorteSources` se añade automáticamente al consultar `search_financial_knowledge`. No depende de un bloque inventado por el modelo. `/sources.items` contiene fragmentos recuperados, documento, página PDF, producto, vigencia y marcador S1/S2. Los marcadores se asignan por turno y se deduplican entre llamadas. El renderer ofrece acordeones accesibles, texto original y un enlace autenticado al PDF; construye la URL con el UUID validado, nunca con un enlace generado por Gemini. Sin resultados o con error de recuperación, el servidor muestra un mensaje de evidencia insuficiente. Ver [RAG](rag.md).

## Adaptación del plan

`movementDraft` prellena campos de un movimiento sin escribir. `comparison` muestra el resultado de `compare_spending_periods` mediante `BanortePeriodComparison`: dos periodos, gasto, diferencia, porcentaje nullable y advertencia de duración distinta. `knowledgeQuotes` propone hasta cinco citas literales; el backend exige que cada cita esté dentro del fragmento recuperado (tolerando únicamente diferencias de espacios/saltos de línea y devolviendo siempre el texto original) y que su marcador exista en el turno antes de emitir `BanorteKnowledgeFacts`.

El cliente compara los nombres del catálogo con sus capacidades. Un mensaje incompatible muestra una instrucción de actualizar y recuperar la conversación, sin exponer JSON de validación. Las conversaciones existentes conservan su catálogo y se validan al recuperarlas. El despliegue debe actualizar backend y frontend juntos; una pestaña con código antiguo necesita recargarse.

Cuando el borrador no trae una tarjeta válida, el formulario requiere elegir explícitamente cuenta o tarjeta antes de enviarlo. La tabla documental exige citas en la salida del LLM cuando hubo evidencia, pero renderiza únicamente las que coinciden con los fragmentos recuperados.

## Interacciones en la misma respuesta

`simulate_savings`, `change_period`, `select_category` y `list_goals` conservan el ID del mensaje visible. Cada interacción crea un AgentTurn para auditoría; al completarse, el mensaje apunta al turno nuevo. El snapshot incluye `replacesTurnId` y la superficie nueva usa el ID del nuevo turno. No se implementan deltas A2UI: se combinan los bloques afectados con los existentes y se entrega un snapshot completo. Las revisiones anteriores siguen consultables por ID.

Los bloques no afectados y su orden se conservan, la explicación se actualiza para evitar texto con cálculos antiguos y el chat no salta al final durante estas interacciones. Al recuperar la conversación se muestra el último resultado persistido. Si el recálculo falla, se mantiene la respuesta anterior y se permite reintentar desde ella; las superficies anteriores a un cambio de tema siguen inactivas.

La gráfica permite abrir gastos de una categoría presente en sus datos, con fechas derivadas del snapshot validado. La tabla muestra ocho filas por página. Cambiar el periodo conserva la categoría y reinicia la página. No interviene el LLM en estos recálculos.

## Metas con confirmación

`BanorteGoalList` incluye crear, editar, archivar, recuperar, filtros de estado y paginación. El LLM puede proponer `goalDraft` con operación, datos explícitos e ID propio obtenido por consulta; el formulario permite revisar o completar esos valores. `BanorteGoalConfirmation` muestra los datos definitivos y, al editar, los valores anteriores.

`prepare_goal` valida propietario, monto, fecha y `expectedUpdatedAt` para cambios a una meta existente. La confirmación dura diez minutos y pertenece a la sesión/conversación de origen. `confirm_goal` solo recibe el actionId, no vuelve a aceptar monto, fecha ni nombre. `apply_goal_change` ejecuta la modificación y guarda su recibo en una transacción serializable. Un reintento recupera el resultado; una edición posterior de la meta invalida la confirmación antigua. No se modifican saldos ni se crean aportaciones de ahorro.

Las escrituras y sus confirmaciones conservan mensajes separados. Solo las consultas interactivas sustituyen la respuesta visible. La pantalla Metas se refresca al completarse una interacción en Maya.
