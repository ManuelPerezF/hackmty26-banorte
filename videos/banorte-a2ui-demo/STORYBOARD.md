---
format: 1920x1080
duration: 77s
message: "El agente no responde: construye la pantalla financiera y ejecuta la acción"
arc: Hook → Problema → Intención → MCP → A2UI → UI adaptable → Acción real → Cierre
audience: jurado del reto Banorte × Tec (evaluadores técnicos y de producto)
mode: autonomous
music: none
language: es
---

## Video direction

- **Palette (de `frame.md`, nunca inventada):** canvas crema cálido como fondo de todas las escenas conceptuales; ink oscuro para display y cuerpo; el accent rojo Banorte (#D71033) se raciona — solo en el dato que manda, la barra activa, el estado de ejecución y el sello de marca. La superficie de código/protocolo usa el `code surface` oscuro del preset para los mensajes A2UI y las llamadas MCP; nunca dos acentos compitiendo en el mismo plano.
- **Tipografía por rol:** display para titulares de escena (2–5 palabras), body para la línea de apoyo, mono para nombres de herramientas, tipos de mensaje A2UI y componentes del catálogo. Cifras con `tabular-nums`.
- **Gramática de movimiento + modelo de revelado:** el video es **mudo** (se proyecta mientras la persona presenta), así que cada revelado se cadencia a un **beat de texto en pantalla**, no a una voz: aparece un titular, respira, y solo entonces entra la siguiente pieza. Eases de cola larga (`power3` por defecto, suave antes que rebotado). Nada de front-load: a t=0 solo está lo que el titular dice en ese momento.
- **Ritmo / escenas en reposo:** Frame 2 y Frame 8 son beats sostenidos (contenido ya revelado, quietud que se lee). Frame 4 y Frame 5 son los picos de densidad. Frame 6 respira a mitad antes del clímax accionable del Frame 7.
- **Legibilidad de proyección:** cuerpo mínimo generoso — este video se ve a 6 metros en un salón. Nada crítico bajo el 83% inferior del canvas.
- **Lista negra:** sin barras de navegación ni cromo de navegador (salvo la reconstrucción intencional de UI), sin gradientes morado-azul "IA", sin bokeh flotante, sin cursores reales del sistema, sin jerga de marketing. Los dos modos de falla prohibidos: **slideshow** (todo al inicio y luego congelado) y **screensaver** (todo flotando sin jerarquía).
- **Honestidad de datos:** todas las cifras salen de la app real corriendo (saldo $33,871.10; gastos $14,042.30 del 1–12 sep 2026). Nada inventado.

## Frame 1 — No contesta. Construye.

- scene: el titular se arma en beats sobre crema; "responde" se tacha y lo reemplaza "construye"
- duration: 6s
- transition_in: cut
- status: animated
- poster: 4s
- type: hook
- persuasion: Reframe
- beat: tesis
- blueprint: kinetic-type-beats (Reproduce)
- focal: tipografía display
- asset_candidates: brand/banorte-mark.png
- ui_recreation: sello Banorte fijo en esquina; titular display puro
- roles: banorte-mark = supporting (sello pequeño, esquina superior) · tipografía = cutout
- src: compositions/frames/01-hook.html

La tesis del reto en una línea. Nada de producto todavía.

Scene 1 (0.0–1.6s): canvas crema vacío; entra centrada la primera línea display "Tu banco responde." en ink — Centered, ~55% del ancho. El sello Banorte aparece pequeño en la esquina superior izquierda y se queda fijo el resto del video.
Scene 2 (1.6–3.0s): una regla roja de 1px barre "responde" y lo tacha; el texto tachado baja de contraste.
Scene 3 (3.0–4.6s): debajo, en el mismo peso display, aparece "Ahora **construye**." con "construye" en accent — swap en el sitio, corte duro sobre el beat, sin fade.
Scene 4 (4.6–6.0s): entra la línea de apoyo mono en caps pequeñas "LLM · MCP · A2UI" bajo el titular y todo se queda quieto — hold sostenido, sin deriva de cámara.

## Frame 2 — Antes y después

- scene: split — muro de texto gris a la izquierda, pantalla generada a la derecha
- duration: 8s
- transition_in: crossfade
- status: animated
- poster: 6s
- type: pain_point
- persuasion: Contraste
- beat: el problema, sin dramatizarlo
- blueprint: comparison-split (Adapt)
- focal: panel derecho (UI generada)
- asset_candidates: brand/banorte-mark.png
- ui_recreation: párrafo de chat plano recreado (izq) + tarjeta BanorteSpendingChart reducida con total $14,042.30 (der)
- roles: chat plano = supporting (izquierda, desaturado) · chart recreado = cutout (derecha, accent vivo)
- src: compositions/frames/02-contraste.html

Adapt: conservo el book-open espejado de los dos paneles y el pill badge que remata cada lado; cambio los "dos productos" por dos respuestas al mismo mensaje.

Scene 1 (0.0–1.8s): sobre crema entra centrado el mismo mensaje del usuario en una burbuja — "¿En qué gasté este mes?" — Centered, ~45% del ancho.
Scene 2 (1.8–3.6s): la burbuja sube al tope y el plano se parte en dos; desde el ala izquierda entra con tilt espejado un panel de texto plano: cinco renglones grises de párrafo, ilegibles a propósito, con la pill mono "TEXTO" abajo.
Scene 3 (3.6–5.4s): desde el ala derecha entra el panel espejo: la tarjeta "Gastos por categoría" con el total $14,042.30 y dos barras que crecen — pill mono "INTERFAZ" en accent.
Scene 4 (5.4–8.0s): el panel izquierdo cae al 40% de opacidad; el derecho gana un hairline accent y ambos se sostienen quietos — held read, la comparación se lee sola.

## Frame 3 — La intención entra

- scene: el prompt se teclea en el compositor real de Maya y el asistente empieza a trabajar
- duration: 10s
- transition_in: cut
- status: animated
- poster: 7s
- type: product_intro
- persuasion: Demostración
- beat: el turno arranca
- blueprint: prompt-type-submit-generate (Reproduce)
- focal: compositor del asistente
- asset_candidates: brand/banorte-mark.png
- ui_recreation: shell del asistente Maya recreado: cabecera, saludo 'Hola, Manuel.', compositor y estado 'Consultando tu información…'
- roles: shell del asistente = cutout · banorte-mark = supporting (avatar) · crema = background
- src: compositions/frames/03-intencion.html

Reproduce: el teclado maneja la escena; nada de cursor paseando por la UI.

Scene 1 (0.0–2.0s): el shell del asistente entra desde abajo y se asienta centrado — cabecera "Maya · Asistente Banorte" con el símbolo Banorte, saludo display "Hola, Manuel." y el compositor vacío. Centered, ~70% del canvas, 3 planos de profundidad.
Scene 2 (2.0–4.6s): un caret teclea letra por letra "¿En qué gasté este mes?" en el compositor; el botón de envío pasa de apagado a accent cuando hay texto.
Scene 3 (4.6–6.0s): el mensaje sale como burbuja del usuario y sube; el compositor queda vacío.
Scene 4 (6.0–8.2s): aparece el punto accent pulsando con el estado real "Consultando tu información…"; a su lado, en mono pequeño, se enciende la etiqueta "turno → LLM".
Scene 5 (8.2–10.0s): la etiqueta mono se convierte en "gemini-3.1-flash-lite · decide qué herramientas llamar" y el frame se sostiene con el estado vivo — solo el punto late.

## Frame 4 — MCP: trece herramientas propias

- scene: las herramientas MCP orbitan el modelo; una se enciende y devuelve datos firmados
- duration: 12s
- transition_in: wipe
- status: animated
- poster: 8s
- type: key_feature
- persuasion: Prueba de ingeniería
- beat: el pico técnico
- blueprint: constellation-hub (Adapt)
- focal: anillo de herramientas
- asset_candidates: brand/banorte-mark.png
- ui_recreation: nodos mono con los 13 nombres reales de herramientas MCP + tira de código con la llamada al gateway y la capacidad
- roles: anillo de herramientas = cutout · tarjeta de capacidad = supporting · crema = background
- src: compositions/frames/04-mcp.html

Adapt: conservo el spring de los nodos al anillo y el push-in que resuelve sobre el núcleo; cambio los íconos genéricos por los nombres mono reales de las herramientas y añado el sello de la capacidad de dos minutos como remate.

Scene 1 (0.0–1.6s): sobre crema entra el titular superior "El modelo no adivina: llama herramientas" y, al centro, un núcleo con la etiqueta mono "LLM".
Scene 2 (1.6–4.4s): trece nodos mono entran en cascada escalonada al anillo alrededor del núcleo — get_account_summary, list_movements, get_spending_insights, compare_spending_periods, simulate_savings, list_goals, list_my_cards, get_profile, get_movement, list_movement_categories, search_financial_knowledge, apply_goal_change, register_movement. Layered-depth, el anillo ocupa ~60% del canvas.
Scene 3 (4.4–6.6s): `get_spending_insights` se enciende en accent, viaja una chispa del núcleo al nodo y vuelve; los otros doce bajan a 35% de opacidad.
Scene 4 (6.6–9.2s): bajo el anillo se despliega una tira de superficie de código oscura con la llamada real — `POST /internal/tools/get_spending_insights` y `Authorization: Bearer <capacidad>` — y la línea mono "capacidad opaca · 2 min · alcance por sesión · el modelo nunca la ve".
Scene 5 (9.2–12.0s): el anillo se comprime con un push-in suave y quedan dos líneas sostenidas: "11 herramientas de lectura para el modelo" y, en accent, "2 de escritura solo tras confirmación". Hold.

## Frame 5 — A2UI: la interfaz viaja

- scene: los tres mensajes A2UI se apilan y de ellos se ensambla el componente real
- duration: 12s
- transition_in: cut
- status: animated
- poster: 9s
- type: key_feature
- persuasion: Mecanismo
- beat: el corazón del reto
- blueprint: agent-progress-theater (Adapt)
- focal: tarjeta BanorteSpendingChart ensamblándose
- asset_candidates: brand/banorte-mark.png
- ui_recreation: tres mensajes A2UI v0.9.1 en superficie de código + BanorteSpendingChart ensamblándose con los datos reales
- roles: mensajes A2UI = supporting (izquierda, superficie de código) · chart = cutout (derecha) · crema = background
- src: compositions/frames/05-a2ui.html

Adapt: conservo el teatro de estado y la cascada de recibo; el "recibo" aquí es la interfaz misma armándose pieza por pieza desde los mensajes.

Scene 1 (0.0–1.4s): titular superior "El agente no manda HTML: manda interfaz" y, a la izquierda, una superficie de código oscura vacía con la etiqueta mono "A2UI v0.9.1".
Scene 2 (1.4–3.2s): entra la primera línea `createSurface` con `catalogId: urn:banorte:a2ui:catalog:1`; a la derecha aparece un lienzo vacío con borde punteado.
Scene 3 (3.2–5.2s): entra `updateComponents` — raíz Column y los nombres del catálogo propio; en el lienzo derecho se dibujan los contenedores vacíos del componente (título, total, seis filas).
Scene 4 (5.2–7.4s): entra `updateDataModel` en la ruta `/`; el lienzo derecho se llena con los datos reales: "Gastos por categoría · 1 sep 2026 – 12 sep 2026", el total $14,042.30 cuenta hacia arriba y las seis barras crecen escalonadas — Vivienda $7,500.00, Alimentación $3,546.30, Compras $1,299.00, Transporte $650.00, Servicios $599.00, Entretenimiento $448.00.
Scene 5 (7.4–9.6s): un sello mono verde-ink "validado con Zod + JSON Schema oficial" se estampa sobre la superficie de código; un componente ajeno al catálogo aparece en rojo tachado un instante — "rechazado".
Scene 6 (9.6–12.0s): la superficie de código se retira al 30% de opacidad y el componente queda solo, centrado y quieto, con la línea mono "16 componentes propios · catálogo urn:banorte:a2ui:catalog:1". Hold.

## Frame 6 — La UI se adapta sola

- scene: tocar la gráfica recalcula por MCP y sustituye la respuesta, sin nueva llamada al LLM
- duration: 10s
- transition_in: crossfade
- status: animated
- poster: 7s
- type: key_feature
- persuasion: Adaptabilidad (20% de la rúbrica)
- beat: el ciclo que se cierra
- blueprint: panel-edit-live-sync (Reproduce)
- focal: selector de periodo acoplado a la gráfica
- asset_candidates: brand/banorte-mark.png
- ui_recreation: BanortePeriodSelector + BanorteSpendingChart + tabla de movimientos por categoría, todo recreado
- roles: chart = cutout · selector = supporting · tabla = supporting
- src: compositions/frames/06-adaptable.html

Reproduce: el par control↔superficie nunca se pierde de plano; la cámara hace punch-and-return, no se va.

Scene 1 (0.0–1.6s): el componente sigue centrado; debajo entra el BanortePeriodSelector real — "Desde 01/09/2026 · Hasta 12/09/2026 · Actualizar periodo".
Scene 2 (1.6–4.0s): un caret cambia "Desde" a 01/08/2026 y se pulsa Actualizar; las seis barras se reacomodan en vivo a los nuevos valores y el total se recalcula — punch-in corto al par control↔gráfica y regreso.
Scene 3 (4.0–6.4s): se toca la fila "Vivienda"; la gráfica cede la mitad del plano y entra deslizando la tabla de movimientos de esa categoría — split 50/50.
Scene 4 (6.4–10.0s): sobre el par se enciende la línea mono en accent "la interacción vuelve al agente como contexto" y, debajo, más pequeña, "recalculado por MCP · sin una llamada extra al LLM". Held read.

## Frame 7 — Una acción que de verdad ocurre

- scene: formulario → confirmación explícita → escritura idempotente → saldo nuevo
- duration: 12s
- transition_in: cut
- status: animated
- poster: 9s
- type: key_feature
- persuasion: Prueba (el flujo accionable que exige el reto)
- beat: clímax
- blueprint: cursor-ui-demo (Adapt)
- focal: tarjeta de confirmación
- asset_candidates: brand/banorte-mark.png
- ui_recreation: BanorteMovementForm → BanorteConfirmation → BanorteActionResult + BanorteBalance $33,871.10, todo recreado
- roles: confirmación = cutout · formulario = supporting · saldo = supporting
- src: compositions/frames/07-accion.html

Adapt: conservo el cursor que conduce la UI y el cambio de estado pantalla a pantalla; sustituyo el paseo libre por tres estados encadenados en el mismo sitio, porque lo que se demuestra es la cadena de autorización, no la navegación.

Scene 1 (0.0–2.0s): corte a la burbuja del usuario "Registra mi renta de septiembre"; debajo se arma el BanorteMovementForm prellenado — concepto, monto $7,500.00, categoría Vivienda, cuenta.
Scene 2 (2.0–4.2s): el cursor pulsa Enviar; el formulario se voltea en el sitio y queda la tarjeta de confirmación con el monto grande y dos botones — Confirmar (accent) y Cancelar.
Scene 3 (4.2–6.0s): una línea mono entra a un lado: "el modelo no puede aprobar ni cambiar el monto — la acción ya está persistida en el servidor".
Scene 4 (6.0–8.4s): el cursor pulsa Confirmar; la tarjeta pasa a estado de ejecución y aparece la traza mono `register_movement · Idempotency-Key · UUID de la acción`.
Scene 5 (8.4–10.4s): la tarjeta se convierte en BanorteActionResult con palomita, y al lado el saldo cuenta de $33,871.10 a su valor nuevo — la cifra es el único elemento en accent.
Scene 6 (10.4–12.0s): una flecha curva sale del resultado y regresa al avatar de Maya, cerrando el ciclo; línea mono "la escritura vuelve al agente, que explica el estado actualizado". Hold corto.

## Frame 8 — Cierre

- scene: las tres piezas del reto quedan como lockup bajo la marca
- duration: 7s
- transition_in: crossfade
- status: animated
- poster: 5s
- type: brand_outro
- persuasion: Síntesis
- beat: reposo
- blueprint: titlecard-reveal (Reproduce)
- focal: brand/banorte-logo.png
- asset_candidates: brand/banorte-logo.png
- ui_recreation: tres columnas mono LLM / MCP / A2UI
- roles: banorte-logo = cutout · etiquetas = supporting · crema = background
- src: compositions/frames/08-cierre.html

Reproduce: un solo movimiento contenido y luego quietud; el reposo es la carga útil.

Scene 1 (0.0–1.8s): todo lo anterior se limpia con un wipe y entra el titular display en dos líneas "Una interfaz que se rediseña con la intención." — Centered, tercio superior.
Scene 2 (1.8–3.6s): entran en fila las tres columnas mono con su línea de apoyo — LLM "interpreta y orquesta" · MCP "13 herramientas propias" · A2UI "16 componentes del catálogo".
Scene 3 (3.6–5.2s): el logo Banorte se asienta debajo con un solo fade-up; una regla accent de 1px se dibuja a su ancho.
Scene 4 (5.2–7.0s): quietud total; solo persiste la línea mono pequeña al pie "Datos sintéticos · el registro es una anotación financiera, no una transferencia". Held.
