# Documentación del proyecto

## Estado actual

El backend ya implementa registro/login real, hash Argon2id, sesiones revocables, autorización por propietario, tarjetas, historial, análisis, metas, simulaciones y conversaciones. Cada usuario tiene dos tarjetas e historial inicial de ejemplo independiente, más los movimientos que registre.

El servidor MCP por stdio y el cliente Nest están implementados y probados. El adaptador Gemini y la generación de mensajes A2UI v0.9.1 están implementados. La prueba de integración usó un modelo controlado; falta configurar la clave y validar una llamada real a Gemini.

El frontend sigue con datos locales. Falta conectar login/API y construir el renderer del catálogo A2UI para completar la demo visual. Docker ejecuta únicamente PostgreSQL.

| Documento | Contenido |
| --- | --- |
| [Backend](backend.md) | Implementación, arranque y verificaciones |
| [Endpoints](endpoints.md) | Contrato HTTP actual y conexión del cliente |
| [Autenticación](autenticacion.md) | Sesiones, hash, CSRF e historial por usuario |
| [Arquitectura](arquitectura.md) | Módulos y recorrido de una interacción |
| [Base de datos](base-de-datos.md) | Modelos, migración, seed y dinero |
| [Docker](docker.md) | Arranque local y variables |
| [Frontend](frontend.md) | Pantallas y trabajo de integración pendiente |
| [MCP](mcp.md) | Herramientas, stdio y capacidades |
| [LLM](llm.md) | Proveedor, contexto y límites |
| [A2UI](a2ui.md) | Mensajes, catálogo propio y eventos |
| [Seguridad](seguridad.md) | Controles implementados y límites |
| [Reto y pendientes](reto-y-pendientes.md) | Evidencia y siguientes entregables |
| [Plan original](plan-backend.md) | Referencia de las fases propuestas; estado actualizado al inicio |

El [README del backend](../server/README.md) contiene los comandos de instalación.
