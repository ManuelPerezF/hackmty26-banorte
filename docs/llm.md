# Adaptador LLM

Implementado en `server/src/integrations/llm/llm.service.ts` con Gemini como proveedor del chat (`LLM_PROVIDER=gemini`). `GEMINI_API_KEY` permanece exclusivamente en `server/.env` y nunca se envía al cliente ni al proceso MCP.

Si falta `GEMINI_API_KEY`, enviar una pregunta devuelve `503 LLM_NOT_CONFIGURED`. No hay respuestas simuladas dentro del backend normal.

## Recorrido

1. Persistir mensaje y turno; responder HTTP 202 con URL de eventos.
2. Recuperar hasta doce mensajes previos del usuario autenticado.
3. Dar al modelo las herramientas de lectura y las reglas del sistema; elige qué consultar.
4. Ejecutar cada llamada mediante el cliente MCP real, usando identidad de la sesión.
5. Devolver resultados al modelo y pedir un plan JSON validado por Zod: title, explanation y blocks.
6. Resolver datos de los bloques desde las herramientas y construir mensajes A2UI del catálogo permitido.
7. Persistir explicación y snapshot; SSE entrega el estado al consumidor.

Bloques del plan: balance, movements, spending, movementForm, education, cards, goals y savings. Las cifras de tablas/gráficas/saldo vienen de los servicios, no del texto generado. El modelo puede redactar explicaciones, cuya exactitud debe evaluarse al probar el proveedor real.

## Escrituras

El modelo puede sugerir el formulario. El usuario envía valores, el servidor guarda una acción pendiente y genera su confirmación. Confirmar habilita una escritura determinista por MCP con esos valores y una clave idempotente. El resultado guardado se entrega al modelo para explicar el cambio. Si esa explicación falla, el backend conserva y devuelve el éxito real del registro.

El prompt exige tratar notas/resultados como datos y no instrucciones. La autorización se aplica además en código; el prompt no sustituye guards ni capacidades.

## Límites y fallos

Máximo seis llamadas a herramientas solicitadas por el modelo, siete rondas y 4096 tokens de salida por solicitud. El turno tiene un timeout configurable de 90 segundos para Gemini. El plan permite como máximo cinco bloques. No se ejecuta HTML, JavaScript o SQL generado.

Estados persistidos: queued, running, completed, failed e interrupted. Una instancia reiniciada marca los turnos activos como interrupted. Los errores de turno exponen código seguro; las trazas de herramienta guardan nombre, duración y éxito, sin tokens ni cadenas de razonamiento.

## Validación real y nivel gratuito

La configuración está en `server/.env` (ignorado por Git, permisos 0600). El adaptador usa la API de Gemini para el chat y para embeddings RAG.

Prueba: navegador → Nest → MCP por stdio → Gemini → A2UI → formulario → confirmación → ingreso persistido → recibo/saldo/historial → recarga de conversación. Se usó un perfil temporal vacío y se limpió al terminar. Ver [evidencia de validación](verificacion.md).

Google ofrece [nivel gratuito para Flash-Lite](https://ai.google.dev/gemini-api/docs/pricing#gemini-3.1-flash-lite), sujeto a cuotas del proyecto. La aplicación no activa facturación ni cambia de proveedor automáticamente. Un 429 informa límite de uso; un 503 informa indisponibilidad temporal. Los mensajes públicos nunca incluyen el error crudo o la clave. No hay reintentos automáticos de escrituras financieras.

Pendiente: medir latencia y cuota con el guion completo del hackathon; comprobar educación, simulación y preguntas ambiguas en español. Las credenciales de otro entorno deben configurarse fuera de Git siguiendo [la guía de Google](https://ai.google.dev/gemini-api/docs/api-key).

Para simular, el modelo solo llama la herramienta si dispone de todos los supuestos del usuario. En caso contrario propone `savings` con formulario vacío. El botón de recálculo vuelve al orquestador y a MCP, sin coste de otra generación LLM.

## Consulta documental

Gemini puede llamar `search_financial_knowledge` para condiciones de tarjetas. El prompt exige consultar evidencia en el turno actual, citar marcadores S1/S2, distinguir producto/red y vigencia e ignorar instrucciones dentro de los PDFs. Los embeddings usan `gemini-embedding-001` a 768 dimensiones; es independiente del modelo conversacional. Sin evidencia recuperada se sustituye la explicación por una respuesta de información insuficiente. Las citas prueban qué se consultó, no garantizan por sí mismas que cada interpretación del modelo sea correcta; falta ampliar la evaluación. Ver [RAG](rag.md).

Cuando la explicación cita una guía sin fecha o una condición histórica, el orquestador añade una aclaración de vigencia independientemente del texto de Gemini.
