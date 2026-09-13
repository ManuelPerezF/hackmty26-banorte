# Banorte KANAN · Maya

Banca personal donde **Maya**, un agente con Gemini al centro, no responde texto: **construye la pantalla** que resuelve la pregunta (A2UI) con datos y acciones que obtiene por **MCP**, y lo que la persona toca vuelve al agente como contexto.

Reto Banorte × Tec de Monterrey · UI Generativa. Detalle técnico completo en [TECNICO.md](TECNICO.md).

## Qué hace

- **Pregunta → interfaz.** "¿Cómo voy a cerrar el mes?" devuelve la proyección, la gráfica de gastos y el botón para aportar a tu meta, no un párrafo.
- **Dos modos estructurales.** *Coach* sugiere siguientes pasos; *Analista* solo datos — la herramienta de sugerencias ni siquiera viaja en su permiso.
- **Acciones reales con confirmación.** Registrar movimiento, cambiar meta, aportar a meta: preparar → confirmar → ejecutar, idempotente.
- **UI que se adapta sin volver al modelo.** Tocar una categoría trae sus movimientos; cambiar el periodo recalcula por MCP.
- **Evidencia, no memoria.** Condiciones y tasas de tarjetas salen de los folletos oficiales de Banorte (RAG con pgvector), citando página y vigencia.
- **Plan del mes, Metas, Movimientos, Cuentas** como pantallas propias sobre los mismos datos.
- Ámbito cerrado: fuera de finanzas personales y productos Banorte, Maya declina.

## Stack

NestJS 12 · Prisma 7 · PostgreSQL 16 + pgvector · Zod 4 · `@modelcontextprotocol/sdk` (servidor stdio) · `@google/genai` (Gemini 3.1 Flash-Lite + `gemini-embedding-001`) · A2UI v0.9.1 · React 19 / vinext · Tailwind 4 · SSE · Argon2id + CSRF + `Idempotency-Key`.

```
client/   React: pantallas + renderer A2UI
server/   Nest: dominios de negocio, asistente (turnos/acciones/SSE), integrations/{llm,mcp}, ui-protocol
mcp/      server.ts — servidor MCP por stdio lanzado por Nest
videos/   videos HyperFrames (técnico, loop de fondo, demo de flujos)
```

## Arranque

```sh
docker compose up -d --wait postgres          # solo PostgreSQL
cd server
cp -n .env.example .env                        # GEMINI_API_KEY, DATABASE_URL, BOOTSTRAP_EMAIL/PASSWORD
npm ci && npm run prisma:generate && npm run db:deploy
npm run db:seed && npm run build && npm run rag:ingest
npm run dev                                    # API en http://127.0.0.1:3001/api/v1
```

En otra terminal: `cd client && npm ci && npm run dev` → `http://127.0.0.1:3000`. Acceso solo por login con las cuentas de prueba del seed; los datos son sintéticos.

Verificación: `npm run test:adaptive`, `npm run test:a2ui-actions`, `npm run test:planeacion` (server) y `npm test` (client).

## Herramientas MCP (20)

Servidor `banorte-financial-tools`. Cada turno recibe una **capacidad** de 120 s con solo las herramientas que necesita; las de escritura entran únicamente al confirmar una acción.

### Lectura (17)

| Herramienta | Qué hace |
|---|---|
| `get_profile` | Perfil del usuario autenticado |
| `list_my_cards` | Tarjetas propias: producto, últimos 4, estado |
| `get_account_summary` | Saldo = apertura + ingresos − gastos |
| `list_movements` | Historial paginado con filtros de periodo, categoría y tarjeta |
| `get_movement` | Detalle de un movimiento |
| `list_movement_categories` | Categorías válidas |
| `get_spending_insights` | Gasto por categoría en un periodo |
| `compare_spending_periods` | Diferencia exacta entre dos periodos |
| `list_goals` | Metas activas o archivadas |
| `simulate_savings` | Proyección determinista: capital, aportación, plazo, tasa |
| `search_financial_knowledge` | RAG: fragmentos de folletos oficiales con página y vigencia |
| `get_spending_forecast` | Proyección al cierre de mes (variable + cargos fijos por caer) |
| `get_budgets` | Presupuestos por categoría con avance y estado |
| `list_recurrences` | Cargos e ingresos fijos mensuales |
| `get_financial_health` | Score 0–100: ahorro 40 + presupuestos 35 + metas 25 |
| `get_coach_actions` | Sugerencias calculadas con datos propios (**solo modo coach**) |
| `get_reward_points` | Puntos por tarjeta con la tasa del folleto vigente + hipotético |

### Escritura (3)

| Herramienta | Qué hace |
|---|---|
| `register_movement` | Guarda un movimiento confirmado |
| `apply_goal_change` | Crea / edita / archiva / recupera una meta confirmada |
| `contribute_to_goal` | Registra una aportación confirmada (anotación de plan, no mueve saldo) |

## Componentes A2UI (20)

Catálogo `urn:banorte:a2ui:catalog:1`, más `Column` y `Text` del protocolo. El modelo elige **bloques** de una lista cerrada de 14; el servidor los convierte en componentes y datos validados.

| Componente | Bloque | Qué muestra |
|---|---|---|
| `BanorteBalance` | `balance` | Saldo de la cuenta |
| `BanorteCardList` | `cards` | Tarjetas propias |
| `BanorteMovementTable` | `movements` | Tabla de movimientos paginada |
| `BanorteSpendingChart` | `spending` | Gasto por categoría; tocar una abre sus movimientos |
| `BanortePeriodSelector` | con `spending` / `movements` | Desde/Hasta → recalcula sin LLM |
| `BanortePeriodComparison` | `comparison` | Dos periodos con diferencia |
| `BanorteForecast` | `forecast` | Proyección al cierre del mes |
| `BanorteBudgetList` | `budgets` | Presupuestos con semáforo |
| `BanorteHealthScore` | `health` | Score 0–100 con desglose |
| `BanorteCoachActions` | `coach` | Chips accionables |
| `BanorteGoalList` | `goals` | Metas |
| `BanorteSavingsSimulator` | `savings` | Simulador de ahorro |
| `BanorteRewardPoints` | `points` | Puntos por tarjeta con cita |
| `BanorteKnowledgeFacts` | `education` | Citas verificadas del RAG |
| `BanorteSources` | `education` | Fuentes: documento, página, vigencia |
| `BanorteMovementForm` | `movementForm` | Formulario de movimiento prellenado |
| `BanorteConfirmation` | acción `submit_movement_form` | Confirmación de movimiento |
| `BanorteGoalConfirmation` | acción `prepare_goal` | Confirmación de cambio de meta |
| `BanorteContributionConfirmation` | acción `prepare_contribution` | Confirmación de aportación |
| `BanorteActionResult` | acción `confirm_*` | Resultado con saldo/meta actualizados |

Eventos de acción de la UI (13): `prepare_goal`, `confirm_goal`, `cancel_goal`, `prepare_contribution`, `confirm_contribution`, `cancel_contribution`, `submit_movement_form`, `confirm_movement`, `cancel_movement`, `list_goals`, `select_category`, `simulate_savings`, `change_period`.

## Notas

- Registrar un movimiento o aportar a una meta persiste una anotación financiera; no realiza pagos ni transferencias.
- Los PDFs indexados son documentos públicos de Banorte; el índice vectorial no contiene datos personales.
- Secretos solo en `server/.env` (ignorado por git).
