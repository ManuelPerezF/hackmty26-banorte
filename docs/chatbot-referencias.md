# Referencias del chatbot

Consultadas con el MCP de Mobbin: búsqueda de asistentes web con historial, preguntas sugeridas y compositor de mensajes. Las capturas se inspeccionaron como referencias de interacción; no se copiaron assets al producto.

| Referencia | Patrón aplicado |
| --- | --- |
| [Microsoft Copilot](https://mobbin.com/screens/38fddb11-e03c-4f6c-8c08-1c8bb698864d) | Historial lateral, bienvenida y sugerencias para empezar |
| [Zapier](https://mobbin.com/screens/cb65c41e-e7b6-4bd9-af40-cd92d768e90d) | Resultados de acciones dentro de la conversación y compositor al pie |
| [Notion](https://mobbin.com/screens/e4b33dac-a24d-4886-bd95-db57821c97d7) | Preguntas iniciales concretas y acceso a conversaciones recientes |

## Adaptación a Banorte

La captura SchoolAI proporcionada por el usuario guía la actualización: bienvenida centrada, saludo con tipografía serif, compositor amplio y sugerencias en filas. Historial a la derecha en escritorio y desplegable con botón en móvil. Al iniciar la conversación, el compositor pasa al pie. Se conservan la navegación y los colores de Banorte; no se añaden adjuntos ni micrófono sin funcionalidad.

Cinco puntos de entrada: entender gastos, registrar movimientos, consultar cuentas y tarjetas, revisar metas y simular ahorro. El backend determina los bloques según la intención. Una escritura tiene un paso explícito de revisión y un recibo persistido. El estado de conexión y los errores se muestran junto a la conversación.

El MCP de Mobbin sirve para investigar diseño. El MCP financiero propio en `mcp/` es el que consulta los datos y ejecuta acciones del producto.
