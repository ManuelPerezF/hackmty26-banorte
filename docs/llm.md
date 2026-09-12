# Adaptador LLM

Implementado en `server/src/integrations/llm/llm.service.ts` con `@google/genai`. Modelo configurable mediante `LLM_MODEL`; valor inicial `gemini-3.8-flash`. Configurar `GEMINI_API_KEY` exclusivamente en `server/.env` y reiniciar Nest. Nunca enviarla al cliente ni al proceso MCP.

Sin clave, enviar una pregunta devuelve `503 LLM_NOT_CONFIGURED`. La API de banca, login y conversaciones sigue funcionando. No hay respuestas de modelo simuladas dentro del backend normal.

## Recorrido

1. Persistir mensaje y turno; responder HTTP 202 con URL de eventos.
2. Recuperar hasta doce mensajes previos del usuario autenticado.
3. Dar al modelo las herramientas de lectura y las reglas del sistema; elige qué consultar.
4. Ejecutar cada llamada mediante el cliente MCP real, usando identidad de la sesión.
5. Devolver resultados al modelo y pedir un plan JSON validado por Zod: title, explanation y blocks.
6. Resolver datos de los bloques desde las herramientas y construir mensajes A2UI del catálogo permitido.
7. Persistir explicación y snapshot; SSE entrega el estado al consumidor.

Bloques del plan: balance, movements, spending, movementForm y education. Las cifras de tablas/gráficas/saldo vienen de los servicios, no del texto generado. El modelo puede redactar explicaciones, cuya exactitud debe evaluarse al probar el proveedor real.

## Escrituras

El modelo puede sugerir el formulario. El usuario envía valores, el servidor guarda una acción pendiente y genera su confirmación. Confirmar habilita una escritura determinista por MCP con esos valores y una clave idempotente. El resultado guardado se entrega al modelo para explicar el cambio. Si esa explicación falla, el backend conserva y devuelve el éxito real del registro.

El prompt exige tratar notas/resultados como datos y no instrucciones. La autorización se aplica además en código; el prompt no sustituye guards ni capacidades.

## Límites y fallos

Máximo seis llamadas a herramientas solicitadas por el modelo, siete rondas y 4096 tokens de salida por solicitud. El turno tiene un timeout configurable de 30 segundos por defecto. El plan permite como máximo cinco bloques. No se ejecuta HTML, JavaScript o SQL generado.

Estados persistidos: queued, running, completed, failed e interrupted. Una instancia reiniciada marca los turnos activos como interrupted. Los errores de turno exponen código seguro; las trazas de herramienta guardan nombre, duración y éxito, sin tokens ni cadenas de razonamiento.

## Validación pendiente

Se verificó el recorrido con MCP real y un modelo controlado en un proceso temporal de prueba. **No se validó una llamada real a Gemini**, porque no hay clave configurada. Antes de la demo: configurar la clave, comprobar acceso al modelo, ensayar preguntas de gastos/formulario/educación, medir latencia y revisar explicaciones contra los agregados.

Referencias: [SDK Google Gen AI](https://googleapis.github.io/js-genai/), [function calling](https://ai.google.dev/gemini-api/docs/function-calling), [salida estructurada](https://ai.google.dev/gemini-api/docs/structured-output).
