# RAG documental de Maya

Maya recupera fragmentos de folletos y guías antes de responder sobre beneficios, comisiones, requisitos y condiciones de Clásica, Oro y Platinum. Los documentos son fuentes de información, nunca instrucciones para el agente. Los saldos, movimientos y datos personales siguen en sus APIs de negocio; no se incorporan al índice vectorial.

## Recorrido

Pregunta → Gemini → herramienta MCP `search_financial_knowledge` → embedding de la consulta → búsqueda pgvector con filtros → fragmentos con página/vigencia → explicación con citas → componente A2UI `BanorteSources`.

pgvector no es un requisito de RAG, pero permite conservar los vectores en el PostgreSQL existente. Solo la base usa Docker; Nest y el proceso MCP siguen locales.

## Corpus inicial

Los seis originales proporcionados están versionados en `server/knowledge/documents`, junto con su extracción de texto por página. El manifiesto identifica el producto y guarda SHA-256, páginas, vigencia y excepciones por página. Son 82 páginas PDF y 94 fragmentos útiles: se descartan portadas/navegación con menos de 50 caracteres.

| Documento | Páginas PDF | Vigencia registrada |
| --- | --- | --- |
| Platinum · Folleto | 5 | 1 mayo–31 octubre 2026 |
| Platinum · Guía | 27 | Sin fecha general indicada |
| Clásica · Folleto | 5 | 1 mayo–31 octubre 2026 |
| Clásica · Guía | 20 | Sin fecha general; promoción de página 5 terminó el 3 abril 2024 |
| Oro · Folleto | 5 | 1 mayo–31 octubre 2026 |
| Oro · Guía | 20 | Sin fecha general; promoción de página 5 terminó el 3 abril 2024 |

Las páginas son las del archivo PDF (empezando en 1), no la numeración impresa. La exclusión de las promociones vencidas se aplica a toda la página correspondiente, de forma conservadora; no invalida la guía entera. Las guías sin fecha no acreditan condiciones actuales. El prompt prioriza folletos vigentes cuando hay contradicción y exige distinguir Visa/Mastercard.

## Indexación

Desde la raíz:

```sh
docker compose up -d --wait postgres
cd server
npm ci
npm run prisma:generate
npm run db:deploy
npm run build
npm run rag:ingest
```

Configurar `GEMINI_API_KEY` únicamente en `server/.env`. `RAG_EMBEDDING_MODEL=gemini-embedding-001` es independiente de `LLM_MODEL`. La indexación envía el texto de los documentos a Gemini para calcular embeddings; consume cuota del proveedor. La disponibilidad y cuota dependen de la cuenta, no de pgvector.

El comando valida hashes y páginas antes de procesar cada PDF. Usa fragmentos de hasta 1,700 caracteres, con 180 de solapamiento y sin cruzar páginas; incluye título/producto en el embedding. Emplea `RETRIEVAL_DOCUMENT`, 768 dimensiones y normalización L2. Procesa lotes de 12. Cada documento se reemplaza en una transacción solo después de obtener sus vectores completos. Un fallo permite reintentar conservando documentos ya indexados. Un hash del manifiesto, texto, modelo y versión de segmentación evita reindexar documentos sin cambios. El CLI no ejecuta seeds ni modifica cuentas.

`gemini-embedding-001` es deliberadamente el único modelo permitido por el esquema: cambiar de espacio vectorial requiere reindexar y ajustar la implementación, no solo cambiar una variable.

## Consulta y citas

Entrada MCP: `query` (3–600 caracteres), `product` opcional (`clasica`, `oro`, `platinum`), `limit` (1–5; por defecto 4), `includeHistorical` (false por defecto; solo preguntas históricas). La búsqueda exacta usa distancia coseno `<=>` y filtra documentos activos, modelo, producto y vigencia antes de ordenar. La vigencia se evalúa con la fecha de `BUSINESS_TIMEZONE`. No necesita HNSW para este corpus pequeño. Se descartan similitudes inferiores a 0.55 y se limita a dos fragmentos por página. El umbral es inicial: requiere evaluación con más preguntas, no es una probabilidad de veracidad.

La consulta usa `RETRIEVAL_QUERY`. Las guías sin fecha pueden aparecer con advertencia. `includeHistorical` también permite documentos aún no vigentes, siempre etiquetados. Las fuentes citan texto completo del fragmento, título y página; sus enlaces los construye React usando UUID, nunca una URL que proponga el modelo. Los PDFs requieren sesión autenticada.

Los marcadores S1/S2 son asignados por el orquestador, deduplicados por fragmento y persistidos en el snapshot. Se eliminan marcadores desconocidos de la explicación. Si la herramienta no ofrece evidencia o falla, el backend responde que no puede verificar las condiciones. Las fuentes consultadas permiten inspeccionar el soporte, pero todavía se necesita evaluación humana de correspondencia entre afirmaciones y citas.

## Añadir o actualizar documentos

1. Guardar el PDF con nombre estable y seguro (`platinum-folleto-2027.pdf`, letras minúsculas, dígitos y guiones) en `server/knowledge/documents`.
2. Extraer con `python3 scripts/extract-knowledge.py` desde `server`, teniendo instalado `pypdf` (ver `scripts/requirements-rag.txt`). Revisar visualmente páginas, tablas, letras pequeñas y calidad del texto. El script no hace OCR.
3. Registrar manualmente título, producto, SHA-256, pageCount, fechas y excepciones `pageValidity` en el manifiesto. Las fechas de una promoción no deben confundirse con la vigencia de todo el documento.
4. Ejecutar `npm run rag:ingest`. No se ejecuta automáticamente al arrancar Nest.
5. Probar recuperación y vigencia; un documento retirado del manifiesto se desactiva al terminar la indexación.

Para conservar citas de versiones anteriores, añadir cada nueva edición con un slug/archivo diferente y desactivar la anterior cuando corresponda; no sobrescribir PDFs históricos si sus conversaciones deben seguir siendo verificables.

## Límites y siguientes pasos

- No hay carga de documentos desde UI ni OCR; la extracción y clasificación se revisan antes de indexar.
- Los PDFs proceden del usuario: no hay sincronización automática con Banorte. Programar revisión antes de que venza el folleto.
- No se ejecutan compras, inversiones ni contrataciones desde RAG.
- Ampliar preguntas de evaluación: citas, números de tablas, promociones, red, contradicciones, fechas, sin evidencia y ataques dentro de documentos.
- Medir latencia y cuota. Considerar caché de consultas o índice HNSW si crece el corpus; no hace falta añadirlos para 94 fragmentos.

Referencias técnicas: [pgvector](https://github.com/pgvector/pgvector), [embeddings Gemini](https://ai.google.dev/gemini-api/docs/embeddings), [gemini-embedding-001](https://ai.google.dev/gemini-api/docs/models/gemini-embedding-001).

## Verificación reproducible

Después de compilar e indexar, desde `server`: `node scripts/verify-rag.cjs`. Requiere puerto 3002 libre, PostgreSQL y Gemini para embeddings. Prueba el protocolo completo con un modelo conversacional controlado y un usuario temporal que elimina al finalizar; no modifica las cuentas existentes. Ver [evidencia y límites](verificacion.md#rag-documental--12-septiembre-2026).
