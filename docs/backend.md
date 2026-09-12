# Backend

## Implementado

NestJS 12, Prisma 7, PostgreSQL, Zod 4, Helmet y TypeScript. API REST con prefijo `/api/v1`. El backend solo opera la cuenta definida por `DEMO_ACCOUNT_ID`; no acepta una cuenta arbitraria en el cuerpo de una solicitud.

| Método | Ruta | Resultado |
| --- | --- | --- |
| GET | `/health` | Proceso activo y modo demo |
| GET | `/health/ready` | Consulta `SELECT 1`; 503 si la DB no responde |
| GET | `/account` | Cuenta MXN, saldo inicial, ingresos, gastos y saldo actual |
| GET | `/movements/categories` | Categorías permitidas |
| GET | `/movements` | Historial paginado y totales del filtro completo |
| GET | `/movements/:id` | Detalle; 404 si no pertenece a la cuenta demo |
| POST | `/movements` | Registra un ingreso o gasto manual |

## Registrar

`Idempotency-Key` es un UUID generado por el consumidor para una intención de registro. Reutilizarlo durante los reintentos; generar uno nuevo para otro movimiento.

```sh
curl -X POST http://127.0.0.1:3001/api/v1/movements \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: 74e19b80-e0cb-44ef-82b7-4e989571d47d' \
  -d '{"description":"Supermercado","amountCents":12550,"type":"expense","category":"Alimentación","date":"2026-09-11","notes":"Compra semanal"}'
```

`12550` representa $125.50 MXN. El backend no recibe un número decimal en pesos.

Reglas: concepto de 1–80 caracteres; centavos enteros positivos hasta `99999999999`; tipo `income` o `expense`; categoría del catálogo; fecha real `YYYY-MM-DD` no posterior a hoy en `America/Monterrey`; nota hasta 500 caracteres. Se rechazan campos extra, incluido `accountId` o `source`. Zod elimina espacios externos de los textos.

Respuesta HTTP 201, también en un reintento idéntico:

```json
{
  "id": "<uuid>",
  "description": "Supermercado",
  "amountCents": 12550,
  "type": "expense",
  "category": "Alimentación",
  "date": "2026-09-11",
  "notes": "Compra semanal",
  "source": "manual",
  "createdAt": 1789142400000
}
```

El ID y `createdAt` de arriba son ilustrativos. La fecha del movimiento es una fecha de calendario; `createdAt` representa milisegundos Unix.

La restricción única de PostgreSQL resuelve reintentos simultáneos. Si la clave ya existe con otros datos, responde 409. La comparación usa el cuerpo normalizado. El registro manual no inicia pagos ni transferencias.

## Consultar

```sh
curl 'http://127.0.0.1:3001/api/v1/movements?type=expense&from=2026-09-01&to=2026-09-30&page=1&pageSize=8'
curl 'http://127.0.0.1:3001/api/v1/movements?query=supermercado'
curl http://127.0.0.1:3001/api/v1/account
```

Filtros opcionales: `query` (concepto/categoría/nota), `type`, `category`, `from`, `to`. Búsqueda sin distinción de mayúsculas; **sí distingue acentos**, a diferencia del filtro local actual del frontend. Fechas inclusivas. `page` empieza en 1; `pageSize` por defecto 20, máximo 100. Orden: fecha, creación e ID descendentes. Una página fuera de rango devuelve `items: []`.

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "pageSize": 20,
  "totals": { "incomeCents": 0, "expenseCents": 0, "netCents": 0 }
}
```

Conteo, página y totales se leen con una misma instantánea (`RepeatableRead`). Los totales cubren todos los resultados filtrados, no solamente la página visible.

## Errores

| Estado | Caso |
| --- | --- |
| 400 | Payload, encabezado UUID, fecha o filtros inválidos |
| 404 | Movimiento o cuenta inexistente |
| 409 | Clave de idempotencia reutilizada con datos distintos |
| 413 | Cuerpo JSON mayor a 32 KB |
| 503 | Readiness con DB no disponible |

El pipe Zod devuelve `code: VALIDATION_ERROR`, `message` e `issues: [{path,message}]`. Los demás errores usan el formato HTTP de Nest. Los errores internos no se convierten en registros exitosos.

## Pendiente

Conectar frontend; persistir metas; catálogo de tarjetas en API si hace falta; sesiones/conversaciones; adaptador LLM; cliente MCP; streaming de UI; autenticación si se publica. Swagger/OpenAPI generado todavía no está instalado: este documento es el contrato humano actual.

Fuentes técnicas: [validación NestJS](https://docs.nestjs.com/techniques/validation), [Prisma con NestJS](https://docs.prisma.io/docs/guides/frameworks/nestjs).
