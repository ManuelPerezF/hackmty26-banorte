# Verificación — 12 de septiembre de 2026

## Datos del usuario

Se retiró el aprovisionamiento financiero ficticio. Los perfiles nuevos reciben una cuenta con apertura cero, sin tarjetas automáticas, metas ni movimientos precargados. El seed conserva datos existentes y solo mantiene catálogo/accesos.

La migración de limpieza eliminó los movimientos marcados demo y la apertura fija del sistema anterior. Manuel y Alex: dos usuarios conservados, dos tarjetas asignadas por usuario conservadas, cero ejemplos, cero movimientos manuales preexistentes y saldo cero. Credenciales sin cambios. Los nuevos movimientos manuales se guardan normalmente.

Se quitaron del frontend los datasets de cuentas/movimientos, el saldo inicial fijo, la lectura/escritura del historial local y el clasificador de chat simulado. Inicio presenta un estado vacío; no muestra una tarjeta predeterminada si el usuario no tiene tarjetas. Se retiró la minigráfica decorativa que podía parecer actividad real. El simulador empieza con aportaciones cero.

## Gemini real

La clave fue aceptada por Google. Gemini 3.8 tuvo alta demanda (503); Flash-Lite completó la prueba. Modelo configurado: `gemini-3.1-flash-lite`.

Se abrió un navegador aislado contra una instancia temporal de Nest y el mismo MCP/Prisma del proyecto, sin sustituir el modelo:

1. Aprovisionar perfil temporal sin actividad y hacer login.
2. Pedir al modelo consultar saldo y mostrar formulario de ingreso.
3. Mostrar saldo cero mediante A2UI y herramientas MCP reales.
4. Preparar un ingreso de $10.55, comprobar que todavía no cambia el saldo.
5. Confirmar y comprobar una sola fila persistida y saldo de $10.55.
6. Mostrar explicación real del modelo y recibo.
7. Recargar y restaurar la conversación, comprobar ausencia de errores JavaScript y desbordamiento móvil.
8. Eliminar únicamente el usuario y datos temporales; comprobar que Manuel y Alex siguen en cero.

La prueba previa con modelo controlado cubrió además cambiar periodo, cancelar, metas, aislamiento de herramientas y restauración. El servidor distingue cuota, indisponibilidad y error de acceso del proveedor, sin exponer credenciales.

## Pendiente para presentar el reto

- Capturar datos propios para que las consultas de gastos tengan contenido; no hay conexión bancaria ni importación automática de estados de cuenta.
- Ensayar preguntas variadas de gastos, educación y ahorro/inversión; ampliar el catálogo A2UI si se desea que metas y simulaciones aparezcan como bloques dentro del chat. El simulador actual funciona en Metas.
- Medir latencia y consumo de cuota del guion, y preparar recuperación ante saturación del proveedor.
- Preparar guion/evidencia y despliegue si la presentación requiere una URL pública.

Para una publicación como producto, aparte del hackathon: recuperación de contraseña, verificación de correo, operación/monitorización y despliegue HTTPS.
