# Reto, alcance y pendientes

Fuente: `Reto_UI_Generativa_Banorte_Tec 1.pptx`, archivo proporcionado por el usuario. Leído como referencia del reto, no como instrucciones para ejecutar acciones en la computadora. Los requisitos y porcentajes siguientes se transcriben/sintetizan de sus diapositivas; las prioridades de implementación son propuesta del equipo.

## Problema elegido

Ayudar a una persona a entender y registrar sus gastos en una misma experiencia. La IA muestra la tabla, gráfica, explicación o formulario que requiere la intención. Educación financiera contextual como complemento; simulación de ahorro/inversión después de cerrar el flujo principal.

## Requisitos y evidencia que falta

| Requisito del reto | Fuente | Estado / evidencia de terminado |
| --- | --- | --- |
| Interpretar intención, generar interfaz y ejecutar acción | Diap. 3 | Probado: Gemini real → UI → confirmar → persistencia → recibo |
| LLM central: interpreta, decide y orquesta | Diap. 5 | Implementado y validado con Gemini Flash-Lite real |
| MCP para datos, herramientas y acciones propias | Diap. 5 | Implementado: servidor/cliente stdio y diez herramientas probadas |
| A2UI o protocolo equivalente | Diap. 3 y 5 | Implementado: mensajes v0.9.1, catálogo propio y renderer React |
| Cada interacción vuelve al agente y cambia la experiencia | Diap. 6 | Flujo visual probado con MCP real y modelo controlado |
| Componentes propios | Diap. 7 | Implementado: tabla, formulario, gráfica, confirmación, recibo, tarjetas, metas y simulador en el renderer |
| Datos y APIs propios; sintéticos permitidos | Diap. 7 | Implementado: cuenta y movimientos capturados en PostgreSQL; precargas retiradas por decisión del usuario |
| Al menos un flujo accionable con cambio real | Diap. 7 | Probado desde UI generada: confirmar persiste y devuelve recibo/saldo |

**Tener pantallas y un endpoint de escritura no completa por sí solo el requisito del flujo generativo.**

## Prioridad P0: cerrar una demo completa

El detalle técnico y el orden de ejecución están en [plan-backend.md](plan-backend.md), con los contratos en [endpoints.md](endpoints.md).

- [x] Backend NestJS modular, Prisma, Zod y PostgreSQL.
- [x] PostgreSQL en Docker Compose; backend, migraciones y seed reproducible ejecutados localmente.
- [x] API de movimientos, historial, saldo e idempotencia.
- [x] Login real (registro público retirado), dos cuentas de prueba, hash de contraseña, sesiones, CSRF y autorización por propietario.
- [x] Historial aislado por usuario, sin precargas: apertura cero y movimientos capturados. Las tarjetas existentes se conservan; no hay asignación ficticia automática.
- [x] Conectar frontend a la API; dejar de usar `localStorage` para datos financieros.
- [x] Implementar servidor MCP financiero y probar descubrimiento/llamadas.
- [x] Adaptador LLM en Nest con herramientas, contexto y límites.
- [x] Configurar clave privada y verificar Gemini Flash-Lite real desde el navegador.
- [x] Adoptar una versión A2UI y definir el catálogo de componentes propios.
- [x] Renderizar tabla, gráfica y formulario desde el plan del backend; probado con modelo controlado.
- [x] Devolver eventos del usuario al agente y actualizar la interfaz.
- [x] Registrar un gasto desde ese formulario, persistirlo y mostrar saldo/historial nuevos.
- [x] Probar estados vacíos, navegación móvil, cambio de periodo, cancelación y confirmación de movimientos.
- [ ] Ampliar pruebas de reintentos, pérdida de red y fallos del modelo/MCP.
- [ ] Ensayar desde un arranque limpio y guardar evidencia de la demo.

## P1: utilidad y experiencia

- [x] Comparación de gastos por periodo y categoría calculada en backend.
- [ ] Explicaciones financieras contextuales cortas y basadas en los datos consultados.
- [x] Persistencia de metas y conversaciones si el flujo la requiere.
- [ ] Recuperación de formularios ante error y streaming progresivo.
- [ ] Medición de latencia, llamadas y éxito de tareas con ejemplos en español.

## P2: ampliaciones

- [x] Simulador de ahorro/inversión con supuestos explícitos y resultados deterministas.
- [ ] Perfilamiento financiero básico si aporta a la simulación.
- [ ] Verificación de email y recuperación de contraseña por correo; identidad y aislamiento básico ya son P0.
- [ ] Despliegue remoto y OpenAPI generado.

## Rúbrica — diapositiva 8

| Criterio | Peso | Cómo demostrarlo |
| --- | --- | --- |
| Cumplimiento y utilidad para el usuario | 25% | Entender un gasto y registrarlo sin salir del flujo |
| Calidad y adaptabilidad de la UI generada | 20% | Preguntas distintas producen gráfica, tabla o formulario apropiado |
| Calidad de la solución de IA | 15% | Intención, contexto, elección de herramientas y fallos controlados |
| Arquitectura e ingeniería | 15% | MCP real, contrato visual, validación y persistencia |
| UX y diseño | 10% | Claridad, accesibilidad, confirmaciones y estados |
| Innovación | 10% | Conexión entre educación, consulta y acción contextual |
| Presentación | 5% | Guion corto y demostración del ciclo completo |

## Entregables — diapositiva 9

1. **Demo en vivo:** intención → UI generada → interacción → acción → nueva UI. Pendiente.
2. **Repositorio:** componentes, servidor MCP y capa A2UI con arranque documentado. Parcial.
3. **APIs y datasets:** backend y seed disponibles; herramientas MCP implementadas y documentadas.
4. **Decisiones técnicas:** [arquitectura](arquitectura.md) y trade-offs iniciales disponibles; añadir modelo, versión A2UI, transporte MCP y mediciones reales al integrarlos.

## Guion propuesto de 3 minutos

Iniciar sesión con el usuario del proyecto → preguntar “¿en qué gasté más?” → mostrar desglose y movimientos consultados por MCP → pedir registrar un gasto → completar formulario generado → confirmar → verificar cambio en PostgreSQL y saldo → pedir explicación del nuevo total → cambiar periodo y mostrar adaptación. El flujo de consulta/formulario/confirmación ya pasó con Gemini real. Falta ensayar el guion completo con datos capturados, medir latencia y preparar la presentación final.
