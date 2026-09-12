---
workflow: product-launch-video
flow: automation
storyboard: no
message: "El agente no responde: construye la pantalla financiera y ejecuta la acción"
destination: presentation
aspect: 1920x1080
language: es
audience: jurado del reto Banorte x Tec (evaluadores técnicos y de producto)
length: 75s
angle: product-demo
---

## Intent

Video de apoyo para la presentación del reto "UI Generativa" de Banorte × Tec.
Debe demostrar en 75s las features del asistente: LLM al centro (Gemini), MCP con
13 herramientas financieras propias, y A2UI v0.9.1 con catálogo propio de 16
componentes que el agente ensambla en tiempo real. Cierra con el flujo accionable:
confirmación explícita y escritura real idempotente.

Tono: claro, técnico, confiable. Identidad Banorte (rojo institucional). Nada de
lenguaje de marketing vacío; el jurado premia evidencia.

## Assets

capture/assets/ — capturas reales del asistente corriendo en local (flujo principal)
UI recreada en HTML — diagramas de arquitectura LLM → MCP → A2UI → componentes

## Customizations

- Mixto: capturas reales de la app para el flujo del asistente; UI recreada/animada
  para el ciclo de arquitectura y el desglose de herramientas MCP.
- Mapear las escenas a la rúbrica: utilidad (25%), UI generada adaptable (20%),
  calidad IA (15%), arquitectura/ingeniería (15%).
- Mostrar el ciclo cerrado: la interacción con la UI generada regresa al agente.

## Notes

- Datos sintéticos; registrar un movimiento es una anotación financiera, no un pago real.
- No inventar cifras ni componentes que no existan en el catálogo propio.
- Componentes reales del catálogo: BanorteBalance, BanorteMovementTable,
  BanorteSpendingChart, BanorteMovementForm, BanorteConfirmation, BanorteActionResult,
  BanortePeriodSelector, BanorteCardList, BanorteGoalList, BanorteGoalConfirmation,
  BanorteSavingsSimulator, BanorteSources, BanortePeriodComparison, BanorteKnowledgeFacts.
