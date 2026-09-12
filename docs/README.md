# Documentación del proyecto

## Estado actual

El backend ya implementa login real, hash Argon2id, sesiones revocables, autorización por propietario, tarjetas, historial, análisis, metas, simulaciones y conversaciones. Los perfiles nuevos comienzan con saldo cero e historial vacío. Las dos cuentas de prueba existentes conservan sus tarjetas asignadas; se retiraron saldos y movimientos precargados.

El servidor MCP por stdio y el cliente Nest están implementados y probados. El adaptador Gemini y la generación de mensajes A2UI v0.9.1 están implementados. La integración se verificó también con Gemini real (Flash-Lite), desde el navegador hasta PostgreSQL. La clave local está configurada únicamente en server/.env; no se versiona.

El frontend ya consume login, cuenta, tarjetas, movimientos, metas, simulación y asistente. El renderer del catálogo A2UI y el flujo confirmado se probaron desde navegador. Solo hay login y dos cuentas de prueba; registro público cerrado. Docker ejecuta únicamente PostgreSQL.

| Documento | Contenido |
| --- | --- |
| [Verificación](verificacion.md) | Prueba con Gemini real y datos vacíos |
| [Backend](backend.md) | Implementación, arranque y verificaciones |
| [Endpoints](endpoints.md) | Contrato HTTP actual y conexión del cliente |
| [Autenticación](autenticacion.md) | Sesiones, hash, CSRF e historial por usuario |
| [Arquitectura](arquitectura.md) | Módulos y recorrido de una interacción |
| [Base de datos](base-de-datos.md) | Modelos, migración, seed y dinero |
| [Docker](docker.md) | Arranque local y variables |
| [Chatbot y Mobbin](chatbot-referencias.md) | Referencias y decisiones visuales |
| [Frontend](frontend.md) | Pantallas, sesión y flujos integrados |
| [MCP](mcp.md) | Herramientas, stdio y capacidades |
| [RAG](rag.md) | PDFs, pgvector, embeddings, citas y vigencia |
| [LLM](llm.md) | Proveedor, contexto y límites |
| [A2UI](a2ui.md) | Mensajes, catálogo propio y eventos |
| [Seguridad](seguridad.md) | Controles implementados y límites |
| [Reto y pendientes](reto-y-pendientes.md) | Evidencia y siguientes entregables |
| [Plan original](plan-backend.md) | Referencia de las fases propuestas; estado actualizado al inicio |

El [README del backend](../server/README.md) contiene los comandos de instalación.

Maya consulta seis documentos de Clásica, Oro y Platinum mediante RAG con pgvector. El índice contiene solo documentación de productos; saldos e historial continúan consultándose por las herramientas transaccionales.
