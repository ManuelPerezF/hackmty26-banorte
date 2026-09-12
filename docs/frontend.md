# Frontend

## Existe

React 19 + Vinext + TypeScript. Rutas públicas `/`, `/login` y `/panel`; el panel cambia de sección mediante estado interno. Organización `src/modules/<dominio>` con `views`, `components`, `hooks`, `services`, `types`, `data` y `styles` solo donde se necesitan. Layout en `src/shared/layout`, primitivas en `src/shared/components/ui`.

| Sección | Estado |
| --- | --- |
| Landing | Presentación del concepto y acceso demo |
| Inicio | Saldo, tarjeta y actividad local reciente |
| Movimientos | Registro, historial, filtros, detalle y paginación; `localStorage` |
| Asistente | Respuestas y gráficas simuladas a partir de los movimientos locales |
| Cuentas y tarjetas | Cuenta MXN, saldo disponible, Clásica y Oro asignadas, detalle y actividad por tarjeta |
| Metas | Creación durante la sesión del panel |
| Perfil | Perfil/configuración de demostración |

El diseño conserva la identidad Banorte; historial y detalle toman referencias consultadas mediante MCP de Mobbin de Revolut Business y Wise. Este MCP de diseño **no sustituye** el servidor de herramientas financieras requerido por el reto.

## Conexión pendiente con Nest

El backend ya implementa estas rutas, autenticación y generación A2UI. La pantalla de acceso actual sigue siendo demo hasta conectarla. El contrato vigente está en [endpoints.md](endpoints.md).

El alcance ahora incluye login y registro reales. Conectar `/auth/register`, `/auth/login`, `/auth/session` y `/auth/logout`, proteger el panel y enviar cookies con `credentials: 'include'`. Obtener CSRF de la sesión para escrituras. Limpiar estado y cachés al cerrar sesión o cambiar de usuario. Los datos financieros se conservan en PostgreSQL y no se vuelven a sembrar al hacer login. Ver [autenticacion.md](autenticacion.md).

1. Agregar un cliente HTTP compartido con URL de API configurable y manejo de errores.
2. Cambiar `movimientos/services` de `localStorage` a `GET/POST /api/v1/movements`. No mezclar automáticamente historiales: el dataset local y el seed API son copias independientes.
3. Convertir el string de pesos del formulario a `amountCents` con la utilidad existente. Crear un UUID por envío lógico y conservarlo si se reintenta.
4. Leer `/account` para saldo y recargarlo junto con el historial después de un registro.
5. Pasar filtros y paginación al backend. No calcular totales globales usando solo una página; usar `totals` de la API.
6. Mostrar carga, error, vacío y reintento; conservar los valores del formulario ante un error.
7. Implementar el renderer y retorno de eventos descritos en [A2UI](a2ui.md).

Las formas JSON de movimiento conservan los campos de la UI: `date` de calendario, `createdAt` en milisegundos y centavos enteros. La API envuelve el historial en `{items,total,page,pageSize,totals}`. La búsqueda local ignora acentos; la de PostgreSQL todavía no.

## Por hacer para la demo

Un formulario invocado por el agente debe usar los mismos componentes y validaciones de la pantalla de movimientos. El usuario necesita ver el resultado persistido y una UI nueva que responda a su acción. No se requieren más pantallas para lograrlo; completar Inicio, Movimientos y Asistente tiene prioridad.

Ver [README del cliente](../client/README.md) para comandos y organización de las pantallas.

## Vista de cuentas y asociación de movimientos

La sección Cuentas y tarjetas reemplaza el selector de productos. Ofrece una cuenta personal, saldo calculado con el ledger local, dos tarjetas asignadas, ocultar saldos, preferencia de tarjeta principal y navegación al historial filtrado. El gasto mostrado por tarjeta es la suma de registros, no una deuda o un límite de crédito. El catálogo comercial sigue teniendo Clásica, Oro e Infinite.

Los movimientos locales incluyen instrumentId, elegible al registrar y visible en tabla/detalle. Los registros anteriores se conservan: los manuales sin asociación quedan en Cuenta personal; los ejemplos conocidos reciben asociaciones explícitas. No cambia el saldo al agregar esa referencia.

La UI elimina insignias y mensajes demo repetidos del panel y conserva la procedencia en Perfil/detalle. El login conserva su comportamiento y explicación actuales. La integración API sigue pendiente: estos IDs son del dataset de presentación; al conectar, resolver Card.id del usuario autenticado y ampliar el contrato de movimientos del backend para esa relación. No enviar estos IDs locales como UUID de tarjeta.
