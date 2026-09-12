# Autenticación e historial por usuario

Implementado: login real con email/contraseña, Argon2id y sesiones revocables en PostgreSQL. Se eligieron sesiones opacas para este cliente web; JWT no es necesario para resolver el acceso ni la integración MCP.

## Credenciales y sesión

- Aprovisionamiento privado: nombre de 1–80 caracteres, email único normalizado y contraseña de 15–128 caracteres. La contraseña no se recorta ni normaliza.
- Hash Argon2id: 19 MiB de memoria, tres parámetros explícitos: memoryCost=19456 KiB, timeCost=2 y parallelism=1. El hash incluye salt generado por la librería.
- Login con contraseña inválida, email inexistente o usuario inactivo devuelve el mismo 401 `INVALID_CREDENTIALS`. Se realiza verificación de hash también para usuario inexistente.
- Token aleatorio de 32 bytes; PostgreSQL guarda su SHA-256, no el token en claro. Cookie `banorte_session`, HttpOnly, SameSite=Lax, Path=/ y Secure cuando `COOKIE_SECURE=true`.
- Al iniciar sesión se revoca la cookie anterior, si existe. Caducidad absoluta de ocho horas e inactividad de 30 minutos, configurables. Se actualiza lastSeenAt como máximo una vez por minuto.
- Logout revoca la sesión, cancela sus acciones pendientes y borra la cookie. Una escritura ya ejecutada no se deshace. Repetir logout con sesión revocada devuelve 401.

No se devuelve el hash de contraseña, token de sesión ni credenciales MCP al navegador. Login y session devuelven el usuario, vencimiento y `csrfToken`.

## Cliente web

Usar el mismo hostname para frontend/backend, por ejemplo `127.0.0.1` en ambos. Todos los fetch usan `credentials: 'include'`. POST/PATCH exigen Origin de la lista exacta `CORS_ORIGINS`; requieren JSON salvo logout. Las mutaciones autenticadas además exigen `X-CSRF-Token` ligado a la sesión. Guardar CSRF en memoria y recuperarlo de `/auth/session` al recargar.

Login: máximo 20 solicitudes por IP y 10 por email normalizado por minuto. Rutas privadas: 180 por usuario/minuto. El limitador está en memoria y se reinicia con el proceso; no es un limitador distribuido.

GET de salud y catálogo de tarjetas son públicos. El catálogo A2UI, datos financieros y SSE requieren sesión. El gateway interno MCP verifica su propia capacidad; una cookie de usuario no habilita ese gateway.

## Aprovisionamiento

El formulario de alta y `POST /auth/register` están retirados. Se mantienen dos cuentas para las pruebas. En la base local existente se conservaron Manuel y Alex, con sus contraseñas e historial; la contraseña de Manuel es la que eligió al crear su cuenta. La de Alex se encuentra en la configuración privada `BOOTSTRAP_PASSWORD`.

En una instalación nueva, configurar `BOOTSTRAP_EMAIL`/`BOOTSTRAP_PASSWORD` para Alex y `SECOND_TEST_EMAIL`/`SECOND_TEST_PASSWORD` para la segunda cuenta antes de `npm run db:seed`. Las contraseñas requieren 15–128 caracteres. El seed solo añade la segunda si existen menos de dos usuarios. No elimina ni modifica otros usuarios de una base ya usada; nunca sirve como limpieza destructiva de datos.


El aprovisionamiento crea User, Profile y una Account con saldo de apertura cero. No genera tarjetas, movimientos, ingresos ni gastos. El historial crece exclusivamente con registros propios. Iniciar sesión y ejecutar el seed no insertan actividad financiera. Las tarjetas ya asignadas a Manuel y Alex se conservan.

La migración asocia explícitamente la cuenta original a un usuario inicial deshabilitado; no la entrega al primer usuario que se registre. Para habilitarlo, configurar `BOOTSTRAP_EMAIL` y `BOOTSTRAP_PASSWORD` privados en `server/.env` y ejecutar `npm run db:seed`. Si ya está habilitado, el seed no cambia sus credenciales ni borra movimientos manuales.

Las imágenes pertenecen al producto, mediante `product.imageKey` (`clasica`, `oro`, `infinite`). Cada instancia Card pertenece a un perfil; el catálogo no implica que el usuario posea todas las tarjetas.

## Autorización

El guard resuelve identidad del lado servidor. Las consultas incluyen el propietario. Un UUID ajeno devuelve 404; sesión inválida 401; CSRF/origen inválido 403; exceso de solicitudes 429.

Conversaciones y turnos pertenecen al perfil. Una acción pendiente también pertenece a la sesión que la preparó. La capacidad MCP dura dos minutos, contiene el alcance en memoria y revalida la sesión en cada herramienta. El modelo no recibe la credencial ni puede seleccionar otro usuario.

El login es real, pero no valida propiedad del correo ni integra cuentas bancarias reales. Verificación de email, recuperación de contraseña y MFA quedan pendientes. Para producción, configuración exige cookies Secure y orígenes HTTPS; también se necesita terminar el despliegue y la operación correspondientes.
