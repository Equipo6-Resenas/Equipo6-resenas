# INSTALACION.md: Módulo Reseñas (Grupo 6)

**Equipo:** Reseñas (Equipo6-Resenas)

**Rama:** [workstation](https://github.com/Equipo6-Resenas/Equipo6-resenas/tree/workstation)

**Stack:** Backend Node.js 20 + Express · Base de datos PostgreSQL 16 · Front-end Next.js (módulo `resenas`)

---

## 1. Contenido de la rama

```text
/
├── INSTALACION.md
├── INTEGRACIONES.md
├── README.md
├── contract/                       ← contratos (Catálogo, Check-in, consolidado)
├── docs/
│   ├── api/API de Reseñas.yaml     ← Swagger/OpenAPI del servicio provisto
│   └── database/                   ← diagrama ER y diccionario de datos
└── code/
    ├── backend/                    ← microservicio Reseñas (Express)
    │   ├── Dockerfile
    │   ├── docker-compose.yml      ← Postgres + RabbitMQ + microservicio
    │   ├── .env.example
    │   └── src/database/           ← schema.sql (creación) y seed.sql (datos iniciales)
    └── frontend/                   ← front Next.js (base del Platform Team + módulo resenas)
        ├── Dockerfile
        ├── docker-compose.yml
        └── .env.example
```

---

## 2. Requisitos

- Docker y Docker Compose.
- Node.js 20 o superior y npm (solo si se ejecuta sin Docker).
- Levantados previamente en workstation por el equipo de plataforma: **Auth, API Gateway y RabbitMQ**. También deberían estar Catálogo y Check-in.

---

## 3. Variables de entorno

Ninguna dirección ni credencial está fija en el código: todo se lee de variables de entorno.

### 3.1 Backend (`code/backend/.env`, plantilla en `.env.example`)

| Variable | Descripción | Valor en workstation |
|---|---|---|
| `PORT` | Puerto del servicio. **Con Docker debe ser `3000`** (el Gateway apunta a `resenas-service:3000`). Para ejecución local sin Docker puede ser `5000` | `3000` |
| `DB_HOST` / `DB_PORT` | Host y puerto de PostgreSQL (con Docker: `postgres-resenas` / `5432`, lo fija el compose) | automático con Docker |
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` | Credenciales y base de datos | `postgres` / `postgres` / `resenas` |
| `FRONTEND_ORIGIN` | Origen del front autorizado para CORS | `http://localhost:3000` |
| `API_GATEWAY_DOCKER_URL` | Gateway visto desde dentro de los contenedores | `http://api-gateway:8080` |
| `CATALOGO_SERVICE_DOCKER_URL` | Catálogo. **Debe apuntar al Gateway** (`<gateway>/api/catalogo`), no directo al contenedor de Catálogo | `http://api-gateway:8080/api/catalogo` |
| `CHECKIN_SERVICE_DOCKER_URL` | Check-in vía Gateway (`<gateway>/api/checkin`) | `http://api-gateway:8080/api/checkin` |
| `CATALOGO_TIMEOUT_MS` / `CHECKIN_TIMEOUT_MS` | Timeout de las llamadas a otros módulos | `2000` |
| `SERVICE_TO_SERVICE_TOKEN` | Token servicio a servicio, si se acuerda | (vacío por defecto) |
| `AUTH_SERVICE_DOCKER_URL` | URL privada de Auth para introspección (no se llama por Gateway) | `http://auth-service:10000` |
| `AUTH_INTERNAL_API_KEY` | Secreto compartido por entorno con Auth | configurarlo por canal seguro |
| `AUTH_TIMEOUT_MS` | Timeout de validación de sesión | `1000` |
| `BROKER_URL` | Conexión AMQP a RabbitMQ | `amqp://ticketu:ticketu@ticketu-rabbitmq:5672/ticketu` |
| `EVENT_EXCHANGE` | Exchange compartido | `ticketu.events` |

> **Nota:** En `.env.example` también están definidas `API_GATEWAY_URL`, `CATALOGO_SERVICE_URL`, `CHECKIN_SERVICE_URL` y `BROKER_DOCKER_URL` para ejecución local sin Docker (usando `localhost`).

### 3.2 Front-end (`code/frontend/.env.local`, o `.env` con Docker)

| Variable | Descripción | Valor en workstation |
|---|---|---|
| `NEXT_PUBLIC_GATEWAY_URL` | URL del Gateway **alcanzable desde el navegador** (no nombres internos de Docker) | `http://localhost:5000` |

> **Importante:** `NEXT_PUBLIC_GATEWAY_URL` debe estar definida **antes** de `npm run build` (o `docker compose up --build`). Si se cambia después, hay que volver a compilar.

---

## 4. Puertos

| Componente | Puerto |
|---|---|
| Front-end | `3000` |
| API Gateway | `8080` |
| Backend Reseñas | `3000` dentro de la red Docker; publicado en el host como `5000` |
| PostgreSQL de Reseñas | `5432` dentro de la red; `5433` publicado en el host (mapeo 5433:5432) |
| RabbitMQ (AMQP / panel) | `5672` / `15672` |

---

## 5. Pasos de instalación (con Docker)

### 5.1 Red compartida (una vez por máquina)

```bash
docker network create plataforma-eventos-net
```

### 5.2 Backend, base de datos y RabbitMQ

```bash
cd code/backend
cp .env.example .env         
docker compose up --build -d
docker compose ps
```

El compose levanta **PostgreSQL, RabbitMQ y el microservicio**. Ejecuta automáticamente `src/database/schema.sql` (creación de tablas) y `src/database/seed.sql` (datos iniciales) la primera vez. El servicio queda en la red como `ms-resenas` / `resenas-service`. Auth debe estar conectado a `plataforma-eventos-net` con el alias `auth-service`; el Gateway debe conservar la cookie de sesión.

Si el volumen de PostgreSQL ya existía antes de agregar `auth_uuid`, aplica la migración sin borrar los datos:

```bash
docker compose exec ms-resenas npm run db:migrate:auth
```

No uses `npm run db:init` para actualizar una base existente: vuelve a crear las tablas. Los usuarios antiguos no se vinculan automáticamente con Auth; solo deben asociarse mediante un mapeo de identidad verificado.

Para una base nueva sin Docker: `npm run db:init` (crea y siembra). En una base existente, primero ejecuta `npm run db:migrate:auth`; no ejecutes `db:init` porque recrea las tablas. `npm run db:seed` carga solo datos iniciales.

### 5.3 Front-end

```bash
cd code/frontend
cp .env.example .env          # completar NEXT_PUBLIC_GATEWAY_URL
docker compose up --build -d
```

Sin Docker: `cp .env.example .env.local && npm install && npm run build && npm run start`.

### 5.4 Comprobación rápida

```bash
curl http://<host>:5000/health                              # backend directo (solo diagnóstico)
curl <GATEWAY_URL>/api/resenas/evento/evt-101               # a través del Gateway
```

---

## 6. Usuarios de prueba (desde `seed.sql`)

| Usuario seed local | Estado | Uso en este módulo |
|---|---|---|
| `ana.lopez@tec.mx` (id local: 1) | cuenta seed local | Datos de ejemplo; no se vincula automáticamente a Auth |
| `carlos.ramirez@tec.mx` (id local: 2) | cuenta seed local | Datos de ejemplo; su identidad Auth requiere asociación verificada |
| `maria.gonzalez@tec.mx` (id local: 3) | cuenta seed local | Datos de ejemplo; su identidad Auth requiere asociación verificada |

Datos de prueba en `seed.sql`:
- **Eventos:** `evt-101` (Taller de IA, organizador id=1), `evt-102` (Ciberseguridad, organizador id=1), `evt-103` (Hackathon, organizador id=2)
- **Asistencias:** Usuario 1 → evt-101, evt-102; Usuario 2 → evt-101
- **Reseñas existentes:** 3 reseñas (ids 1, 2, 3) en evt-101 y evt-102

---

## 7. Flujo principal del módulo

1. Abrir el front en `http://<host>:3000` e iniciar sesión con Auth con una cuenta de rol `usuario`.
2. Abrir las reseñas de un evento: `/catalogo/evt-101/resenas`.
3. Ver el listado de reseñas (más reciente primero) y el promedio del evento.
4. Publicar una reseña con estrellas (1 a 5) y comentario opcional. Requiere que **Check-in** confirme la asistencia para el UUID de Auth. Las asistencias seed con IDs numéricos no demuestran asistencia para una cuenta Auth.
5. La respuesta del organizador requiere que el UUID autenticado esté asociado al propietario del evento. Esa asociación aún debe integrarse desde Catálogo o acordarse entre equipos.

> Si Auth no responde, las rutas protegidas fallan de forma cerrada. Las lecturas públicas de reseñas siguen disponibles; publicar requiere Auth, Catálogo y la consulta contractual de Check-in.

---

## 8. Endpoints principales (Backend)

### Rutas `/api/resenas` (principales)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Health check con verificación de BD |
| GET | `/me` | Obtener el perfil de Auth (requiere sesión) |
| GET | `/eligibilidad` | Verificar si la sesión puede reseñar un evento (query: `eventoId`) |
| POST | `/` | Crear una reseña (requiere sesión Auth; body: `id_evento`, `clasificacion`, `descripcion?`) |
| GET | `/` | Listar reseñas con filtros opcionales |
| GET | `/promedio` | Obtener promedio de calificaciones de un evento (query: `eventoId`) |
| GET | `/evento/:eventoId` | Obtener reseñas y promedio de un evento (paginado: `pagina`, `tamano`) |
| POST | `/:idResena/respuestas` | Crear respuesta (sesión Auth de organizador y propiedad validada) |

### Rutas `/api/v1/resenas` (para Catálogo)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/calificaciones-basicas` | Obtener promedio y total de reseñas para múltiples eventos (máx. 100, body: `eventoIds[]`) |
| GET | `/evento/:eventoId` | Obtener reseñas y promedio de un evento (formato V1 para Catálogo) |

---

## 9. Eventos RabbitMQ (I3)

El backend publica el evento `resena.creada` en el exchange `ticketu.events` (tipo `topic`) tras guardar una reseña.

**Esquema del mensaje:**

```json
{
  "resenaId": "21",
  "eventoId": "evt-101",
  "usuarioId": "3f1e2c1a-4b8d-4a2e-9c3f-7d1e2f9b2d4a",
  "calificacion": 5,
  "fecha": "2026-11-19T10:30:00Z"
}
```

Configuración: `BROKER_URL`, `EVENT_EXCHANGE` (por defecto `ticketu.events`). Si RabbitMQ no está disponible, la reseña se guarda igual y el error queda en el log con reintento automático de conexión.

---

## 10. Notas

- **Logs del backend** (cada petición queda con fecha y hora): `docker compose logs -f ms-resenas` en `code/backend`.
- **Pruebas automáticas del backend**: `npm test` en `code/backend`.
- **Auth**: Reseñas valida las operaciones protegidas consultando `/internal/validar-sesion` directamente; requiere `AUTH_INTERNAL_API_KEY` y que el Gateway conserve la cookie `jwt`.
- **Roles esperados**: `usuario` (publicar reseñas), `organizador` (responder si se valida la propiedad del evento). Otros roles reciben 403.
- **Validación de elegibilidad**: El backend consulta a Check-in vía `GET /api/checkin/asistencia?usuarioId={authUuid}&eventoId={id}` antes de permitir crear una reseña.
- **Consulta a Catálogo**: El backend consulta a Catálogo vía `GET /api/catalogo/eventos/{eventoId}/info-servicio` para validar que el evento existe al crear una reseña.