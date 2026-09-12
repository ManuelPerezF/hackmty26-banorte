# Seguridad del backend

## Implementado

- Contraseñas Argon2id (19456 KiB, dos iteraciones, paralelismo uno) y verificación equivalente para usuario desconocido.
- Sesiones aleatorias revocables; hash SHA-256 del token en DB, cookie HttpOnly/SameSite y caducidad absoluta/inactividad.
- Guard global con autorización por propietario; origen exacto, JSON y CSRF en mutaciones autenticadas.
- Rate limit por IP/email para login y por usuario para rutas privadas, en memoria.
- Zod, límite JSON de 32 KB, Helmet y respuestas sin caché.
- Herramientas MCP con capacidad breve, sesión revalidada y alcance cerrado; escritura solo con acción aprobada.
- Idempotencia y restricciones en PostgreSQL para no duplicar movimientos; datos ajenos devuelven 404.
- Secretos únicamente en .env ignorado; ni hash, token ni credenciales del proveedor salen en los DTO financieros.

La API sirve datos sintéticos y registros manuales. No almacena PAN, CVV o PIN ni ejecuta pagos. El login comprueba las credenciales de las cuentas aprovisionadas; no existe registro público ni verificación de propiedad del correo.

## Límites conocidos

Una instancia local. Los rate limits y capacidades no se comparten entre procesos. No hay recuperación de contraseña, MFA, verificación de email, gestión de dispositivos ni cola distribuida. La configuración production exige HTTPS y cookies Secure; no equivale a una revisión completa de producción.

SSE revalida la sesión una vez por segundo. Logout cancela acciones pendientes; las escrituras ya iniciadas/confirmadas no se revierten. Si un proceso cae entre escritura y actualización de estado, reintentar conserva el UUID de la acción y recupera el movimiento sin duplicarlo.

En la instalación se corrigió el override de multer. La auditoría completa de npm seguía reportando cuatro entradas altas en la cadena del CLI Prisma (mysql2/deepmerge), no resueltas en esta entrega. Revisar antes de desplegar y mantener el lockfile; no ejecutar actualizaciones mayores automáticas sin comprobar compatibilidad.

## Evidencia

Se comprobaron login, hash, CSRF, origen, expiración, aislamiento entre usuarios, idempotencia concurrente y capacidades MCP de lectura/escritura. Las pruebas utilizaron cuentas temporales y las borraron al terminar. No se recreó la carpeta de tests eliminada.

Referencias: [password storage OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html), [session management OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html), [CSRF OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).
