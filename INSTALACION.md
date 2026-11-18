# INSTALACION.md: Módulo Reseñas (Grupo 6)

**Equipo:** Reseñas (Equipo6-Resenas)

**Rama:** [Reseñas-WorkStation](https://github.com/Equipo6-Resenas/Equipo6-resenas/tree/workstation)

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
    │   ├── docker-compose.yml      ← Postgres + microservicio
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
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` | Credenciales y base de datos | `postgres` / COMPLETAR / `resenas` |
| `FRONTEND_ORIGIN` | Origen del front autorizado | COMPLETAR (jueves) |
| `API_GATEWAY_DOCKER_URL` | Gateway visto desde dentro de los contenedores | COMPLETAR (jueves, ej. `http://api-gateway:8080`) |
| `CATALOGO_SERVICE_DOCKER_URL` | Catálogo. **Debe apuntar al Gateway** (`<gateway>/api/catalogo`), no directo al contenedor de Catálogo | COMPLETAR (jueves) |
| `CHECKIN_SERVICE_DOCKER_URL` | Check-in vía Gateway (`<gateway>/api/checkin`) | COMPLETAR (jueves) |
| `CATALOGO_TIMEOUT_MS` / `CHECKIN_TIMEOUT_MS` | Timeout de las llamadas a otros módulos | `2000` |
| `SERVICE_TO_SERVICE_TOKEN` | Token servicio a servicio, si se acuerda | COMPLETAR |
| `AUTH_URL` | Dirección de Auth vía Gateway (`<gateway>/api/auth`) | COMPLETAR (jueves) |
| `AUTH_JWT_SECRET` o `AUTH_JWKS_URL` | Clave o endpoint para validar el token | COMPLETAR (según defina Auth) |
| `BROKER_URL` | Conexión AMQP a RabbitMQ | COMPLETAR (ej. `amqp://ticketu:<clave>@ticketu-rabbitmq:5672/ticketu`) |
| `EVENT_EXCHANGE` | Exchange compartido | `ticketu.events` |

### 3.2 Front-end (`code/frontend/.env.local`, o `.env` con Docker)

| Variable | Descripción | Valor en workstation |
|---|---|---|
| `NEXT_PUBLIC_GATEWAY_URL` | URL del Gateway **alcanzable desde el navegador** (no nombres internos de Docker) | COMPLETAR (jueves) |

> **Importante:** `NEXT_PUBLIC_GATEWAY_URL` debe estar definida **antes** de `npm run build` (o `docker compose up --build`). Si se cambia después, hay que volver a compilar.

---

## 4. Puertos

| Componente | Puerto |
|---|---|
| Front-end | `3000` |
| API Gateway | `8080` |
| Backend Reseñas | `3000` dentro de la red Docker; publicado en el host como `5000` |
| PostgreSQL de Reseñas | `5432` dentro de la red; `5433` publicado en el host |
| RabbitMQ (AMQP / panel) | `5672` / `15672` |

---

## 5. Pasos de instalación (con Docker)

### 5.1 Red compartida (una vez por máquina)

```bash
docker network create plataforma-eventos-net
```

### 5.2 Backend y base de datos

```bash
cd code/backend
cp .env.example .env         
docker compose up --build -d
docker compose ps
```

El compose levanta Postgres y ejecuta automáticamente `src/database/schema.sql` (creación de tablas) y `src/database/seed.sql` (datos iniciales) la primera vez. El servicio queda en la red como `resenas-service` / `ms-resenas`.

Para recargar los datos iniciales sin Docker: `npm run db:init` (crea y siembra) o `npm run db:seed` (solo datos).

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
curl <GATEWAY_URL>/api/resenas/evento/<eventoId-de-prueba>  # a través del Gateway
```

---

## 6. Usuarios de prueba

| Usuario (Auth) | Rol | Uso en este módulo |
|---|---|---|
| COMPLETAR (jueves) | cliente | Ver y publicar reseñas |
| COMPLETAR (jueves) | organizador | Responder reseñas de su evento |
| COMPLETAR (jueves) | COMPLETAR (otro rol) | Comprobar que es rechazado en acciones no permitidas |

Datos de prueba en `seed.sql`: eventos como `evt-101` (COMPLETAR: confirmar ids reales tras `seed.sql`) con usuarios, asistencias y reseñas de ejemplo.

---

## 7. Flujo principal del módulo

1. Abrir el front en `http://<host>:3000` e iniciar sesión con Auth como cliente (COMPLETAR: pantalla o ruta de login).
2. Abrir las reseñas de un evento: `/catalogo/evt-101/resenas`.
3. Ver el listado de reseñas (más reciente primero) y el promedio del evento.
4. Publicar una reseña con estrellas (1 a 5) y comentario opcional. Requiere que **Check-in** confirme la asistencia del usuario a ese evento (COMPLETAR: usuario y evento de prueba con asistencia registrada en Check-in).

> Si Check-in o Catálogo no responden, el backend **falla de forma cerrada** (no permite publicar y devuelve 503 con un mensaje comprensible). Los pasos 1 a 3 funcionan sin esas dependencias.

---

## 8. Notas

- Logs del backend (cada petición queda con fecha y hora): `docker compose logs -f ms-resenas` en `code/backend`.
- Pruebas automáticas del backend: `npm test` en `code/backend`.