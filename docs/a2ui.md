# Interfaz generativa y A2UI

**Estado: pendiente.** La UI actual está programada en React; todavía no consume mensajes A2UI.

La diapositiva admite A2UI o un protocolo equivalente. El usuario pidió A2UI: la opción prevista es adoptar el protocolo oficial y fijar su versión al integrar el renderer. [Sitio y documentación oficial](https://a2ui.org/). No presentar un JSON propio como cumplimiento de A2UI sin documentar explícitamente que se trata de una alternativa.

## Catálogo propio mínimo

| Componente del producto | Para qué sirve |
| --- | --- |
| Resumen de saldo | Mostrar saldo/ingresos/gastos con moneda y periodo |
| Gráfica por categoría | Comparar dónde se gasta más |
| Tabla de movimientos | Consultar los registros que respaldan una respuesta |
| Formulario de movimiento | Completar y confirmar un ingreso o gasto |
| Selector de fechas | Ajustar la consulta |
| Explicación contextual | Educación financiera breve relacionada con los datos |
| Resultado de acción | Indicar qué cambió y permitir continuar |

Estos son nombres de componentes de nuestro catálogo, **no nombres de mensajes del protocolo**. Se deben mapear a la versión oficial seleccionada. Reutilizar componentes de `client/src/modules/movimientos` y primitivas compartidas.

## Contrato que falta implementar

- Identidad de conversación y superficie, más una revisión para evitar aplicar respuestas antiguas.
- Árbol o actualizaciones de componentes con IDs únicos, tipos permitidos y propiedades validadas.
- Datos separados de la estructura y enlaces a valores de formularios/gráficas.
- Eventos del usuario que incluyan acción, componente, valores y revisión correspondiente.
- Validación en backend antes de enviar y en frontend antes de renderizar.

El renderer resuelve componentes registrados por el equipo. No evalúa JavaScript, HTML arbitrario ni importaciones generadas por el modelo. Rechaza componentes desconocidos y presenta un error recuperable.

## Flujo accionable prioritario

“Quiero registrar un gasto” → agente pide un formulario → usuario completa y confirma → evento vuelve al agente → MCP registra en PostgreSQL → agente genera recibo, saldo y tabla actualizados.

Modificar un periodo debe producir una nueva consulta y actualización de gráfica/tabla. El foco y los datos ya escritos deben conservarse cuando se actualice una superficie, salvo que la acción los haya consumido correctamente.

## Criterios de terminado

Renderer propio con al menos tabla, gráfica y formulario; esquema validado; carga/error/vacío; eventos de vuelta al agente; una acción persistente; protección contra respuesta fuera de orden y doble envío; navegación por teclado y vista móvil. Documentar la versión efectiva de A2UI y capturar evidencia del ciclo completo.
