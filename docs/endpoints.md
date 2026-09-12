# Endpoints implementados

Base: `http://127.0.0.1:3001/api/v1`. Todos los importes son centavos enteros MXN. Fechas de calendario: YYYY-MM-DD; timestamps: milisegundos Unix. IDs y claves de idempotencia: UUID.

## Reglas comunes

Salvo salud, catálogo de productos y login, las rutas requieren cookie de sesión. POST/PATCH requieren Origin permitido y JSON (logout puede ir sin body); las rutas privadas además exigen X-CSRF-Token. El navegador debe enviar `credentials: 'include'`. Las rutas nunca aceptan un userId/accountId para elegir al propietario.

Las rutas marcadas con **K** requieren `Idempotency-Key`: generar un UUID por intención, conservarlo en reintentos. Repetir la clave con el mismo payload recupera el resultado; otro payload devuelve 409.

## Inventario

| Método | Ruta | Acceso / resultado |
| --- | --- | --- |
| GET | /health | Público; proceso activo |
| GET | /health/ready | Público; SELECT 1, 503 si no hay DB |
| POST | /auth/login | Público con origen/JSON/rate limit; 200 + cookie |
| GET | /auth/session | Privado; usuario, CSRF y vencimiento |
| POST | /auth/logout | Privado + CSRF; 204 |
| GET | /me | Perfil autenticado |
| GET | /me/cards | Tarjetas asignadas |
| GET | /me/cards/:id | Detalle de una tarjeta propia |
| PATCH | /me/preferences | Tarjeta preferida |
| GET | /card-products | Público; catálogo Clásica, Oro, Infinite |
| GET | /account | Cuenta y saldo |
| GET | /movements/categories | Categorías |
| GET | /movements | Historial paginado y totales |
| GET | /movements/:id | Detalle propio |
| POST | /movements | K; registro manual, 201 |
| GET | /insights/spending | Agregados por periodo |
| GET | /goals | Metas paginadas |
| POST | /goals | K; crear meta, 201 |
| PATCH | /goals/:id | Editar o archivar meta |
| POST | /simulations/savings | Simulación educativa, 200 |
| GET | /assistant/catalog | Catálogo A2UI propio |
| POST | /assistant/conversations | K; crear conversación, 201 |
| GET | /assistant/conversations | Lista paginada |
| GET | /assistant/conversations/:id | Conversación y mensajes paginados |
| POST | /assistant/conversations/:id/messages | K; crear turno, 202 |
| POST | /assistant/conversations/:id/actions | K; acción de UI, 202 |
| GET | /assistant/turns/:id | Estado y snapshot |
| GET | /assistant/turns/:id/events | SSE con sesión y propietario |

Ruta interna adicional: `POST /internal/tools/:name`, solo con capacidad MCP del servidor. No usar desde el frontend ni con cookie; ver [MCP](mcp.md).

## Login y ejemplo para el cliente

El registro público está deshabilitado: `/auth/register` devuelve 404. Las dos cuentas se aprovisionan de forma privada mediante el seed; ver [autenticación](autenticacion.md).

Login recibe `{email,password}`. Devuelve 200 `{user:{id,email,displayName},expiresAt,csrfToken}` y Set-Cookie HttpOnly. Session devuelve ese mismo cuerpo. Logout revoca la sesión; una sesión ausente/expirada/revocada devuelve 401.

Ejemplo de integración dentro del navegador, usando valores capturados del formulario:

```ts
const API = 'http://127.0.0.1:3001/api/v1';
const response = await fetch(`${API}/auth/login`, {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
if (!response.ok) throw new Error('No se pudo iniciar sesión');
const session = await response.json();

const save = await fetch(`${API}/movements`, {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': session.csrfToken,
    'Idempotency-Key': requestKey, // UUID estable para este envío y sus reintentos
  },
  body: JSON.stringify(movement),
});
if (!save.ok) throw new Error('No se pudo guardar');
```

El navegador envía Origin automáticamente. Clientes curl deben incluirlo explícitamente, además de conservar la cookie y CSRF. Al recargar, recuperar sesión; no guardar token de sesión en localStorage.

## Perfil, tarjetas y cuenta

`/me`: `{id,displayName,email,locale,timezone,preferredCardId}`. `/me/cards`: `{items:[{id,last4,status,isPreferred,product:{key,name,network,imageKey}}]}`. El detalle devuelve un elemento. `/card-products`: `{items:[{key,name,network,imageKey}]}`; no indica titularidad.

PATCH preferencias recibe exactamente `{preferredCardId: UUID | null}` y devuelve ese campo. Verifica que la tarjeta pertenece al perfil y está activa: ajena 404, inactiva 409. No asigna productos nuevos.

`/account`: `{id,name,currency,openingBalanceCents,incomeCents,expenseCents,balanceCents}`. Saldo calculado con todo el historial propio.

## Movimientos

POST body:

```json
{
  "description": "Supermercado",
  "amountCents": 12550,
  "type": "expense",
  "category": "Alimentación",
  "date": "2026-09-11",
  "notes": "Compra semanal",
  "cardId": null
}
```

Descripción de 1–80 caracteres, monto entero positivo hasta 99999999999, type income/expense, categoría del catálogo, fecha válida no posterior a hoy en la zona del perfil, notes opcional hasta 500. Campos extra como accountId/source se rechazan. Respuesta 201: `{id,description,amountCents,type,category,date,notes,source,createdAt}`. Un reintento idéntico mantiene UUID y fecha de creación. Source demo es ejemplo; manual es registro propio. `cardId` es UUID de una tarjeta propia activa o null para cuenta personal. La respuesta incluye `cardId`, `card` (id, last4, product) y `account` (id, name, currency). Tarjeta ajena: 404; inactiva: 409. No ejecuta pagos.

GET filtros: query (concepto/categoría/nota), type, category, from, to, cardId, accountOnly (true/false), page, pageSize. Fechas inclusivas; búsqueda sin distinguir mayúsculas, sí acentos. Orden fecha/creación/ID descendente. Página 1, tamaño 20 por defecto; máximo 100.

Respuesta: `{items,total,page,pageSize,totals:{incomeCents,expenseCents,netCents}}`. Los totales abarcan el filtro completo, no solo la página. Una página fuera de rango devuelve items vacío. Detalle ajeno/inexistente: 404.

## Análisis

GET `/insights/spending`: from/to opcionales como pareja, rango inclusivo máximo 366 días, category opcional, bucket day/month. Por defecto mes actual; bucket diario para hasta 31 días, mensual en rangos mayores.

Respuesta: `{currency,period:{from,to,timezone},filters:{category},bucket,totals:{incomeCents,expenseCents,netCents,movementCount},categories:[{category,expenseCents,share}],series:[{periodStart,incomeCents,expenseCents}]}`. Share entre 0 y 1; desglose solo de gastos. Los buckets sin registros son cero. Neto del periodo no representa saldo de cuenta.

## Metas y simulación

GET goals: status active/archived (default active), page/pageSize (1/20, máximo 100). Devuelve `{items,total,page,pageSize}`. POST con K: `{name,targetCents,deadline?}`; deadline acepta null. Monto positivo hasta 99999999999, nombre 1–80 y plazo no anterior a hoy. Respuesta 201: `{id,name,targetCents,deadline,status,createdAt,updatedAt}`.

PATCH recibe un subconjunto no vacío de `{name,targetCents,deadline,status}`. Omitir un campo lo conserva; deadline:null quita el plazo. No modifica saldo.

POST simulación recibe `{initialCents,monthlyContributionCents,months,annualRateBps}`. Importes 0–100000000, meses 1–600 y tasa 0–10000 puntos base (500=5% nominal anual). Interés mensual anual/12, redondeo half-up y aportación al final del mes. Proyección fuera de rango numérico seguro: 400.

Devuelve `{currency,assumptions,totalContributedCents,estimatedInterestCents,finalCents,schedule:[{month,contributedCents,interestCents,balanceCents}]}`. Assumptions identifica tasa proporcionada, redondeo, exclusión de impuestos/comisiones/inflación y guaranteed:false. No persiste ni compra inversiones.

## Conversaciones, mensajes y acciones

POST conversación con K: `{}` o `{title}` de 1–80. Devuelve `{id,title,createdAt}`. GET lista acepta page/pageSize (1/20, máximo 100) y devuelve items,total,page,pageSize. Detalle: `{id,title,createdAt,updatedAt,messages:{items,total,page,pageSize},latestTurnId}`. Mensajes recientes primero; elemento `{id,role,content,createdAt,turnId}`. No incluye trazas internas.

POST messages con K: `{content}` de 1–4000. Sin clave Gemini: 503 LLM_NOT_CONFIGURED. Con configuración: 202 `{conversationId,turnId,status,eventsUrl}`. Una misma clave recupera turno; otra clave con un turno activo en la conversación devuelve 409 TURN_IN_PROGRESS.

POST actions con K:

| event | Campos |
| --- | --- |
| change_period | surfaceId, revision, values:{from,to} |
| submit_movement_form | surfaceId, revision, values con esquema de movimiento |
| confirm_movement | surfaceId, revision, actionId |
| cancel_movement | surfaceId, revision, actionId |

SurfaceId es el UUID del turno que generó el componente; revision es la revisión del snapshot (1 al completarse). Usar la nueva superficie de confirmación para confirmar/cancelar. ActionId se obtiene de confirmation.actionId en el data model. La confirmación no reenvía monto. Acciones pendientes expiran en diez minutos y pertenecen a la sesión que las preparó. Respuesta 202 con el mismo contrato de messages. Una acción completada puede recuperar resultado sin duplicar escritura.

## Snapshots y SSE

GET turno: `{id,conversationId,status,revision,assistantMessage,uiSnapshot,pendingActions,error,createdAt,updatedAt}`. Estados queued/running/completed/failed/interrupted. UiSnapshot null antes de generarse; después contiene mensajes A2UI validados. PendingActions contiene id,status,expiresAt,result. Error es null o `{code,message}`; un turno failed sigue siendo HTTP 200.

SSE emite snapshot al conectar y al cambiar el estado, done al terminar y error ante pérdida de acceso/fallo de lectura. Heartbeat cada 15 segundos; consulta estado cada segundo. Autorización antes de abrir el stream y durante su vida. `new EventSource(url,{withCredentials:true})`. No hay eventos de tokens individuales ni replay de Last-Event-ID; restaurar desde snapshot.

## Errores y límites

400 validación/UUID/fecha;401 sin sesión o credenciales inválidas;403 origen/CSRF;404 recurso ajeno;409 idempotencia/turno activo/UI antigua/estado de acción;410 acción expirada;413 JSON superior a 32 KB;415 tipo de contenido;429 rate limit;503 DB o LLM no configurado.

Zod devuelve code VALIDATION_ERROR, message e issues. Otros errores preservan el cuerpo estándar Nest o su code específico; no todos llevan el mismo código de dominio. Un error posterior al 202 se consulta en el turno; no cambia retroactivamente la respuesta inicial. Si falló el modelo después de guardar, la UI informa que el registro sí existe.

El frontend debe invalidar saldo/historial/análisis tras registrar, recargar perfil/tarjetas tras cambiar preferencia y limpiar estado al cerrar sesión. No mezclar localStorage y PostgreSQL como una sola cuenta.
