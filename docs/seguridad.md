# Seguridad proporcional al hackathon

## Decisión actual

**Usar una cuenta demo sin contraseñas.** El backend no implementa registro, login, JWT ni almacenamiento de passwords. El acceso visual del frontend abre el panel demo. `DEMO_MODE=true` es el único modo soportado y `NODE_ENV=production` se rechaza para evitar etiquetar este setup como listo para producción.

Si posteriormente se guardan contraseñas, sí necesitan hash con una librería mantenida, preferentemente Argon2id, o delegar autenticación a un proveedor. Omitir un sistema de identidad durante la demo ahorra trabajo; guardar contraseñas en texto plano no es una simplificación aceptable.

## Incluido

- Datos sintéticos y cuenta fija controlada por el servidor.
- Zod para configuración, payloads y filtros; campos extra rechazados.
- Centavos enteros y límites de entrada.
- CORS con orígenes explícitos y Helmet.
- Cuerpo JSON limitado a 32 KB.
- Restricción de idempotencia persistida en PostgreSQL.
- PostgreSQL publicado en loopback por Compose; NestJS local escucha en `127.0.0.1` por defecto.
- `.env` excluidos de Git; ejemplos explícitamente locales.

CORS no es autenticación. Cualquier proceso con acceso al puerto puede leer y modificar la cuenta demo. Cambiar una variable de entorno no crea controles de identidad.

## Antes de exponerlo fuera de una demo local

Autenticar usuarios, derivar la cuenta de la sesión verificada y autorizar acceso por recurso; HTTPS; secretos de despliegue; límite de solicitudes/costo LLM; manejo de sesiones; consentimiento de acciones ligado a payload y sesión; revisión de dependencias. Para una demo compartida, definir explícitamente si todos usarán la misma cuenta o una cuenta aislada por sesión.

Las acciones del LLM requerirán una confirmación verificable emitida por la interacción del usuario. El modelo no debe poder autoautorizar una escritura colocando un booleano en sus argumentos.

## Dependencias revisadas durante el setup

Se fijó una versión corregida de Multer mediante `overrides`. El backend se ejecuta localmente y no tiene imagen Docker.

La revisión del 11 de septiembre de 2026 encontró cuatro avisos altos asociados a la cadena del CLI Prisma (`deepmerge-ts`, `mysql2` y sus dependientes). Se mantienen documentados sin aplicar el downgrade mayor que sugiere `npm audit fix --force`. Esas herramientas ejecutan migraciones/configuración local controlada. Revisar actualizaciones del CLI antes del despliegue.
