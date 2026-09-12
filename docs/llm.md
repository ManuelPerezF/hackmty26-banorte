# LLM y orquestación

**Estado: pendiente.** El asistente del frontend es simulado. No hay proveedor, modelo, clave ni llamadas LLM configuradas.

## Alcance propuesto

El LLM interpreta la intención, decide herramientas y selecciona componentes. Las sumas de dinero y escrituras siguen siendo responsabilidad de los servicios deterministas. Priorizar banca personal y educación contextual; las inversiones serán una simulación con supuestos visibles.

Intenciones iniciales: entender gastos, consultar movimientos, registrar ingreso/gasto y pedir una explicación financiera. Una petición ambigua debe producir una pregunta corta o formulario para completar datos.

## Ciclo del orquestador en Nest

1. Recibir mensaje o evento de interfaz y recuperar el contexto de la conversación.
2. Adjuntar el catálogo de herramientas y componentes permitidos.
3. Llamar al proveedor LLM mediante un adaptador configurable del servidor.
4. Validar las llamadas a herramientas y ejecutarlas mediante el cliente MCP.
5. Dar al modelo los resultados y pedir una interfaz estructurada.
6. Validar esa interfaz y transmitirla al renderer.
7. Repetir cuando el usuario interactúe; conservar la relación entre acción, resultado y siguiente interfaz.

Propuesta de límites iniciales, a ajustar con mediciones: máximo 6 llamadas a herramientas por turno, timeout de 30 segundos por turno y un intento de reparación de salida estructurada inválida. Al fallar, mostrar un estado recuperable, sin simular una respuesta exitosa.

## Contexto

Mensaje actual, eventos recientes, intención, sesión demo, resumen financiero del servidor y resultados de herramientas. No enviar todo el historial cuando bastan filtros y agregados. Las instrucciones del sistema deben distinguir solicitudes del usuario de texto no confiable dentro de notas/documentos/resultados.

## Elección de modelo pendiente

Evaluar soporte de herramientas, salida estructurada, latencia, calidad en español y costo de tres casos reales del proyecto. Documentar proveedor y versión finalmente elegidos. Las claves vivirán en variables del servidor, nunca en variables públicas del frontend.

## Evaluación mínima

| Pregunta / interacción | Debe ocurrir |
| --- | --- |
| ¿En qué gasté más este mes? | Consulta por fechas + desglose calculado + gráfica y tabla |
| Registra un gasto | Solicita campos faltantes con formulario |
| Confirmación del formulario | Herramienta de escritura, resultado persistido y saldo actualizado |
| Cambiar fechas | Nueva consulta y UI actualizada, conservando contexto |
| Datos vacíos | Estado vacío honesto |
| MCP o LLM caído | Error recuperable y reintento |
| Nota de movimiento con instrucciones | Se trata como dato y no altera las reglas del agente |

Registrar por turno modelo, duración, nombres de herramientas y resultado/error. No registrar cadenas de conexión, llaves ni contenido sensible. Medir latencia y éxito de tareas antes de ampliar el alcance.
