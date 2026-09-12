# Referencias del chatbot

Consultadas con el MCP de Mobbin: búsqueda de asistentes web con historial, preguntas sugeridas y compositor de mensajes. Las capturas se inspeccionaron como referencias de interacción; no se copiaron assets al producto.

| Referencia | Patrón aplicado |
| --- | --- |
| [Microsoft Copilot](https://mobbin.com/screens/38fddb11-e03c-4f6c-8c08-1c8bb698864d) | Historial lateral, bienvenida y sugerencias para empezar |
| [Zapier](https://mobbin.com/screens/cb65c41e-e7b6-4bd9-af40-cd92d768e90d) | Resultados de acciones dentro de la conversación y compositor al pie |
| [Notion](https://mobbin.com/screens/e4b33dac-a24d-4886-bd95-db57821c97d7) | Preguntas iniciales concretas y acceso a conversaciones recientes |

## Adaptación a Banorte

Historial a la izquierda en escritorio y compacto en móvil. Área principal con nombre del asistente, mensajes y bloques financieros; entrada de texto persistente al pie. Colores y tipografía siguen la interfaz existente de Banorte.

Tres puntos de entrada: entender gastos, registrar un gasto y empezar a ahorrar. El backend determina los bloques según la intención. Una escritura tiene un paso explícito de revisión y un recibo persistido. El estado de conexión y los errores se muestran junto a la conversación.

El MCP de Mobbin sirve para investigar diseño. El MCP financiero propio en `mcp/` es el que consulta los datos y ejecuta acciones del producto.
