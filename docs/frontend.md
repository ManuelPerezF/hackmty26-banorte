# Frontend conectado

React 19 + Vinext + TypeScript. Rutas `/`, `/login` y `/panel`; las seis secciones del panel conservan navegación interna. Organización por dominio en `src/modules`, componentes compartidos en `src/shared`.

| Sección | Integración |
| --- | --- |
| Landing y acceso | Solo inicio de sesión. Sin formulario ni endpoint público de registro |
| Inicio | Perfil, saldo, tarjetas y actividad obtenidos de Nest |
| Movimientos | GET/POST, cuenta o tarjeta propia, filtros, paginación y detalle |
| Cuentas y tarjetas | Cuenta MXN y Clásica/Oro del usuario; preferencia persistida |
| Metas | Crear, editar, archivar y recuperar objetivos de PostgreSQL |
| Simulación dentro de Metas | POST savings, tasa aportada por el usuario y calendario mensual |
| Asistente | Conversaciones persistidas, SSE, renderer A2UI y acciones confirmadas |
| Perfil | Usuario autenticado, preferencia y cierre de sesión |

## Sesión y datos

`shared/api/client.ts` centraliza URL, cookies, CSRF, errores y claves idempotentes. Por defecto consume el puerto 3001 del mismo hostname; `VITE_API_BASE_URL` permite configurarlo. Usa `127.0.0.1` para ambos procesos en desarrollo.

`cuentas/context/bank-context.tsx` recupera `/auth/session`, `/me`, `/account` y `/me/cards` antes de montar las pantallas privadas. Un 401 lleva al login; cerrar sesión revoca la cookie y desmonta los datos del panel. CSRF se mantiene en memoria, nunca la contraseña o el token de sesión.

Movimientos, metas y conversaciones cargan todas las páginas de la API. Los filtros/paginación visual de movimientos operan sobre esa colección completa; el saldo global se consulta a `/account`. Para volúmenes grandes, trasladar los filtros a consultas por página y evitar descargar el historial completo.

No se usa localStorage como fuente de datos financieros. Se eliminaron los datasets de cuentas/movimientos y las funciones de almacenamiento local. No se importan historiales locales automáticamente a PostgreSQL. Los nuevos movimientos envían `cardId` UUID o null para cuenta personal, y el servidor valida la titularidad. Tabla y detalle muestran la asociación devuelta por la API.

Un UUID estable representa cada envío lógico; se conserva al reintentar una petición fallida. Si la escritura funciona y falla la recarga posterior, la UI informa que ya fue guardada y evita reenviar la operación como nueva.

## Asistente y A2UI

`asistente/hooks/useAsistente.ts` consume conversaciones, mensajes, acciones y snapshots. EventSource lleva la cookie; la UI restaura conversaciones al seleccionarlas y presenta el estado de trabajo, error o confirmación.

`types/protocol.ts` valida el catálogo y las envolturas v0.9.1 con Zod. `components/a2ui-renderer.tsx` resuelve únicamente los componentes permitidos: saldo, tabla, gráfica por categoría, selector de periodo, formulario, confirmación y recibo. Nunca ejecuta HTML/JS/JSX producido por el modelo. Cada bloque valida además sus datos.

El formulario reutiliza el módulo Movimientos. Preparar muestra el monto, fecha y cuenta/tarjeta; confirmar devuelve `actionId` al backend. Al terminar se actualizan saldo e historial. Los formularios históricos quedan inactivos y las confirmaciones obedecen su estado/vencimiento.

La prueba en navegador recorrió Nest → MCP real por stdio → respuesta de modelo controlada → A2UI → confirmación → PostgreSQL y restauración. También se probaron crear/editar/archivar metas, cambiar periodo y cancelar un registro sin escritura. **También pasó la prueba con Gemini real (gemini-3.1-flash-lite)**: perfil vacío, saldo cero, formulario generado, ingreso confirmado de $10.55, recibo y conversación restaurada. El perfil temporal se eliminó al terminar. Sin clave se muestra el error del servicio, no una respuesta simulada.

Referencias: [chatbot y Mobbin](chatbot-referencias.md). Comandos y estructura: [README del cliente](../client/README.md).
