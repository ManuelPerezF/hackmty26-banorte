# Frontend

## Existe

React 19 + Vinext + TypeScript. Rutas públicas `/`, `/login` y `/panel`; el panel cambia de sección mediante estado interno. Organización `src/modules/<dominio>` con `views`, `components`, `hooks`, `services`, `types`, `data` y `styles` solo donde se necesitan. Layout en `src/shared/layout`, primitivas en `src/shared/components/ui`.

| Sección | Estado |
| --- | --- |
| Landing | Presentación del concepto y acceso demo |
| Inicio | Saldo, tarjeta y actividad local reciente |
| Movimientos | Registro, historial, filtros, detalle y paginación; `localStorage` |
| Asistente | Respuestas y gráficas simuladas a partir de los movimientos locales |
| Tarjetas | Catálogo Clásica, Oro e Infinite |
| Metas | Creación durante la sesión del panel |
| Perfil | Perfil/configuración de demostración |

El diseño conserva la identidad Banorte; historial y detalle toman referencias consultadas mediante MCP de Mobbin de Revolut Business y Wise. Este MCP de diseño **no sustituye** el servidor de herramientas financieras requerido por el reto.

## Conexión pendiente con Nest

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
