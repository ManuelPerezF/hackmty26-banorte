# PostgreSQL en Docker y backend local

Requisitos: Docker Engine/Desktop con Compose, Node 22.13+ y npm. Docker se utiliza únicamente para la imagen oficial `postgres:17-bookworm`. NestJS, Prisma CLI y el frontend se ejecutan localmente. No hay imagen ni Dockerfile del backend.

## Iniciar PostgreSQL

Desde la raíz:

```sh
docker compose up -d --wait postgres
docker compose ps
```

Compose inicia solamente la base de datos. Las migraciones, el seed y la API se ejecutan desde una terminal local, como se indica a continuación.

PostgreSQL se publica en `127.0.0.1:5433`; dentro de su contenedor usa 5432. El volumen `banorte-demo_postgres_data` conserva los datos. `docker compose down` detiene la DB sin borrar el volumen. **Añadir `-v` elimina los datos de este proyecto** y no es necesario para actualizar código. NestJS se detiene con Ctrl+C en su terminal.

## Backend con recarga

Desde la raíz, después de iniciar PostgreSQL:

```sh
cd server
cp -n .env.example .env
npm ci
npm run prisma:generate
npm run db:deploy
npm run db:seed
npm run dev
```

`cp -n` conserva un `.env` existente. Compose lee el `.env` de la raíz; Nest y Prisma leen `server/.env`. No son el mismo archivo. La API escucha en `http://127.0.0.1:3001/api/v1`. Para uso diario basta con levantar PostgreSQL y ejecutar `npm run dev` desde `server`. Aplicar `db:deploy` cuando haya migraciones nuevas y regenerar Prisma cuando cambie el esquema. Para ejecutar el JS compilado localmente: `npm run build` y `npm start`.

## Variables

| Variable | Uso / valor de desarrollo |
| --- | --- |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Compose; valores demo incluidos en `.env.example` |
| `POSTGRES_PORT` | Puerto del host, 5433 |
| `DATABASE_URL` | `server/.env`: conexión a PostgreSQL en `127.0.0.1:5433` |
| `HOST`, `PORT` | `server/.env`: NestJS local en `127.0.0.1:3001` |
| `CORS_ORIGINS` | Orígenes exactos separados por coma |
| `DEMO_MODE` | Solo `true` está implementado |
| `DEMO_ACCOUNT_ID` | UUID de cuenta, igual en seed y API |
| `BUSINESS_TIMEZONE` | `America/Monterrey` para validar el día actual |
| `NODE_ENV` | `development` o `test`; la demo rechaza `production` |

Si cambias las credenciales demo, actualiza también el `DATABASE_URL` local. Contraseñas con caracteres reservados necesitan codificación URL en la cadena de conexión. Cambiar `POSTGRES_PASSWORD` no actualiza automáticamente la contraseña de una base ya inicializada.

## Verificación

```sh
cd server
npm run check
```

`check` ejecuta TypeScript y compilación. Por decisión del equipo, no hay carpeta ni suite de pruebas automatizadas en `server`. Para verificar el flujo manualmente, usar los ejemplos de [la API](backend.md): consultar saldo, registrar un movimiento, repetirlo con la misma clave, verificar que existe una sola vez y comprobar el saldo. Un cambio de payload con esa misma clave debe responder 409; un monto inválido, 400.

Para comprobar el frontend, desde `client`: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.

### Verificación del setup realizada

En el setup inicial se verificaron temporalmente validaciones, reintentos concurrentes, persistencia, saldo, filtros, detalle, CORS, Helmet y límites JSON. Los registros de esa verificación se eliminaron. El cambio al arranque local conserva la misma base y sus movimientos. Estas verificaciones no crean una suite permanente en el repositorio.

## Diagnóstico

```sh
docker compose logs --tail=80 postgres
docker compose exec postgres pg_isready -U banorte -d banorte
curl http://127.0.0.1:3001/api/v1/health/ready
```

- No aparece el socket Docker: iniciar Docker Desktop y esperar al motor.
- Puerto ocupado: ajustar `POSTGRES_PORT` en el `.env` raíz o `PORT` en `server/.env`, según el proceso afectado. Si cambia el puerto de PostgreSQL, actualizar también `DATABASE_URL`.
- Cuenta no encontrada: ejecutar `db:seed` contra esa misma DB.
- API no inicia: revisar variables, migraciones y la terminal de `npm run dev`. Compose solo inicia PostgreSQL.
- El panel no muestra el registro API: la conexión frontend–backend sigue pendiente; el panel actual usa `localStorage`.
