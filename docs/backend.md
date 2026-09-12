# Backend implementado

NestJS 12, Prisma 7, PostgreSQL, Zod 4, Helmet y TypeScript. API REST bajo `/api/v1`. Nest se ejecuta localmente; Docker contiene únicamente PostgreSQL.

## Dominios

| Módulo | Responsabilidad |
| --- | --- |
| autenticacion | Registro, Argon2id, login, sesiones, guard, CSRF y aprovisionamiento |
| perfil | Perfil, catálogo, tarjetas asignadas y preferencia |
| cuentas | Resumen y saldo calculado de la cuenta del usuario |
| movimientos | Registro idempotente, historial, filtros, categorías y detalle |
| analisis | Agregados por periodo, categoría y día/mes |
| metas | Crear, consultar, editar y archivar objetivos |
| simulaciones | Proyección educativa con aritmética exacta |
| asistente | Conversaciones, mensajes, turnos, acciones y SSE |
| salud | Liveness y readiness |

Las integraciones LLM/MCP y el protocolo visual viven fuera de los módulos del negocio. Todas las rutas financieras obtienen `userId → profileId → accountId` de la sesión; el consumidor no elige su identidad en el body. Recursos ajenos devuelven 404.

## Contratos

El [catálogo de endpoints](endpoints.md) detalla rutas, cuerpos y respuestas. [Autenticación](autenticacion.md) explica cookies, origen y CSRF. El token de sesión no se entrega en JSON ni se guarda en localStorage.

El dinero se recibe en centavos enteros y se almacena como `BigInt`. Saldo = apertura + ingresos − gastos. Las consultas de movimientos incluyen totales del filtro completo en una instantánea RepeatableRead. POST idempotentes usan una clave UUID y restricciones únicas en PostgreSQL; repetir payload conserva el resultado, cambiarlo con la misma clave devuelve 409.

El registro manual solo guarda un dato financiero: no procesa un pago. Las tarjetas son asignaciones sintéticas y no contienen PAN/CVV/PIN. Las metas no apartan dinero y las simulaciones no compran inversiones.

## Arranque y comprobación

Consultar [server/README.md](../server/README.md). `npm run check` ejecuta TypeScript y build. La API base funciona sin clave de modelo; enviar una pregunta devuelve `503 LLM_NOT_CONFIGURED` mientras no se configure `GEMINI_API_KEY`.

Verificación de esta entrega con PostgreSQL local y scripts temporales, eliminando sus usuarios al terminar:

- Registro de dos usuarios, login válido/inválido y hash Argon2id en DB.
- Dos tarjetas y nueve movimientos independientes por usuario; persistencia tras logout/login.
- Endpoints protegidos, cookie HttpOnly, CSRF/origen, vencimiento e imposibilidad de consultar o modificar recursos ajenos.
- Tres registros simultáneos con la misma clave generan un solo movimiento; payload diferente devuelve 409; saldo y agregados correctos.
- Metas aisladas, PATCH conserva campos omitidos, simulación exacta y rechazo de desbordamiento.
- MCP real por stdio: descubrimiento de ocho herramientas, lectura autorizada y rechazo de escritura sin capacidad.
- Asistente con modelo controlado: preparación sin escritura, confirmación idempotente, persistencia, respuesta posterior al modelo, mensajes A2UI y SSE.

No se hizo una llamada real a Gemini en estas pruebas. El frontend no fue conectado ni se implementó su renderer en esta entrega. No se añadió una suite permanente en `server/test`, conforme a la eliminación solicitada.

## Límites operativos

Una instancia Nest: límites de solicitudes, capacidades MCP y ejecución de turnos viven en memoria. Los turnos persisten; al reiniciar, queued/running se marcan interrupted. La escritura usa la misma clave de acción para recuperar reintentos. No hay cola distribuida ni replay de deltas SSE; la recuperación se hace con snapshots.

Swagger/OpenAPI generado, recuperación de contraseña, verificación de email y despliegue remoto quedan fuera de esta entrega. Los errores Zod contienen `code`, `message`, `issues`; algunos errores de dominio conservan el formato HTTP estándar de Nest.
