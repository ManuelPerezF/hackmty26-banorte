# Frame packet: 02-contraste

## Project inputs

- Project: /Users/manud/Desktop/hackmty26-banorte/videos/banorte-a2ui-demo
- Design tokens: /Users/manud/Desktop/hackmty26-banorte/videos/banorte-a2ui-demo/frame.md
- RULES_DIR: /Users/manud/.claude/skills/hyperframes-animation/rules

## Assigned storyboard block

## Frame 2 — Antes y después

- scene: split — muro de texto gris a la izquierda, pantalla generada a la derecha
- duration: 8s
- transition_in: crossfade
- status: outline
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

## Selected blueprint: comparison-split

# comparison-split — Comparison Split-Cards

**intent**: Two paired items of equal weight shown side-by-side with mirrored 3D "book-open" tilts — the eye reads them as a balanced comparison, then a pill badge lands at each card's inner edge to punctuate. The motion IS the symmetry: two cards arriving from opposite wings into a held spread.

**roles served**

- Key_Feature (from `comparison-split-cards`): when two complementary features / capabilities of equal weight should be presented **simultaneously, not sequentially** — an A/B, a "X + Y together," paired concepts the viewer must weigh side-by-side. Not for >2 items (use `grid-card-assemble`) or sequential steps.

**duration**: 4–6s

**shot structure** (a `[bg]` canvas carrying two faint ambient glow blooms — `[accent A]` near 30%, `[accent B]` near 70% — so each side owns a color identity across a 50% symmetry axis; equal-width cards under one shared perspective parent)

- **Scene 1 (0.0–~0.8s) — title sets the concept.** A centered `[title line]` with an `[accent keyword]` slides DOWN into place from just above (a short smooth settle). The downward arrival is deliberate: it forms a non-conflicting T-shape against the cards, which arrive from the sides next.
- **Scene 2 (~0.4–1.9s) — the split-tilt entry (signature move).** Two equal-width feature cards arrive from opposite wings — `[left card]` from the left, `[right card]` from the right ~0.2s behind — each carrying a **mirrored 3D `rotateY` tilt** (left faces right, right faces left, opening like a book) and scaling ~0.85→1 as it lands. The entry overlaps the title's tail so the whole thing reads as ONE arrival, not two beats. Each card holds `[image / label / subtitle]`; box-shadows fall **outward** from the tilt (left shadow right, right shadow left).
- **Scene 3 (~1.9–end) — badges punctuate, then hold.** A pill `[badge]` lands at each card's **inner edge** (left then right, ~0.3s apart), overlapping its card ~15% so it reads as attached, not orbiting. This is the lone overshoot in the shot — it earns the punctuation. Settles and holds.

**motion vocabulary**: title slide-down from above; mirrored opposite-wing card entry; static book-open `rotateY` tilt (`+tilt` left, `−tilt` right); tilt-matched outward box-shadow; inner-edge badge spring-pop; gentle phase-opposed idle float (left vs right, never synchronized) registered as subtle jitter; dual side-glow ambient.

**rule mapping**

- two cards entering from opposite wings with mirrored `rotateY` tilts + tilt-matched shadow → `split-tilt-cards` (the signature; keep the two-layer split so the entry `x`/`scale` and the idle never collide on one alias)
- title slide-down settle → `gsap-effects` (translate + opacity on a long-tail `power3`)
- inner-edge pill badge pop (the one overshoot) → `spring-pop-entrance` (overshoot register — earns the punctuation)
- phase-opposed idle float on the pair → `sine-wave-loop` (low-amplitude register — subtle jitter, NOT lazy breathing; left `sin(t)`, right `sin(t+π)` so they never conveyor-belt)
- the two faint side glows behind the cards → `ambient-glow-bloom` (un-triggered soft bloom, one per accent)

**camera modifier**: camera-static by default — the symmetry is the subject and a move would break the balance.
