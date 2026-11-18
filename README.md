# Equipo 6 Reseñas

Repositorio del proyecto **Reseñas**, desarrollado por el Grupo 6 del ramo **Taller de Integración Tecnológica I (TITEC)**.

## Integrantes

| Nombre | Correo | Rol |
|---|---|---|
| Vicente Cruces Collao | vicente.cruces@estudiantes.uv.cl | Integración |
| Constanza Díaz Pulgar | constanza.diazpu@estudiantes.uv.cl | Scrum Master; QA |
| Bruno González Luke | bruno.gonzalez@estudiantes.uv.cl | Frontend |
| Rodrigo Pino Araya | rodrigo.pino@estudiantes.uv.cl | Backend; Base de Datos |

### Integraciones

| Integración | Tipo (A, B o C) | Módulo contraparte | Servicio, endpoint o tópico | Contrato | Ítem en GitHub |
|---|---|---|---|---|---|
| I1 | A | Auth | Sesión mediante cookie `jwt` e introspección interna `GET /internal/validar-sesion` | Contrato Auth | https://github.com/Equipo6-Resenas/Equipo6-resenas/issues/12 |
| I2 | B | Catálogo | `GET /api/resenas/evento/{eventoId}` (provisto por Reseñas) | [Contrato Catálogo Promedio Reseñas](https://github.com/Equipo6-Resenas/Equipo6-resenas/blob/main/contract/Contrato%20Catalogo%20Promedio%20Rese%C3%B1as.md) | https://github.com/Equipo6-Resenas/Equipo6-resenas/issues/16 |
| I3 | C | Organizador | Evento `resena.creada` en exchange `ticketu.events` | [Contrato integración general](https://github.com/Equipo6-Resenas/Equipo6-resenas/blob/main/contract/Contrato%20integraci%C3%B3n%20general.md) | https://github.com/Equipo6-Resenas/Equipo6-resenas/issues/17 |

## Docentes

- Rodrigo Alfaro
- René Noël
- Sheyla Torres

## Dependencias de equipos

- Auth
- Check-in
- Catálogo de eventos
- Organizador (consumidor de eventos RabbitMQ)

## Integraciones REST y Docker

Reseñas consume Catálogo y Check-in desde el backend; el navegador solo llama al API Gateway.

| Flujo | Endpoint utilizado |
|---|---|
| Reseñas → Catálogo | `GET /api/catalogo/eventos/{eventoId}/info-servicio` |
| Reseñas → Check-in | `GET /api/checkin/asistencia?usuarioId={authUuid}&eventoId={id}` |
| Catálogo → Reseñas | `POST /api/v1/resenas/calificaciones-basicas` |
| Catálogo → Reseñas | `GET /api/v1/resenas/evento/{eventoId}` |
| Front → Gateway → Reseñas | `/api/resenas/...` |
| Reseñas → Auth | `GET /internal/validar-sesion` (privado; cookie `jwt` y `x-api-key`) |

El backend envía `Accept: application/json` y `X-Correlation-Id` a los servicios externos, aplica timeout y falla de forma cerrada: si Catálogo o Check-in no responden, no se permite crear una reseña. El formulario del front consulta la elegibilidad al backend y no usa un check-in simulado.
Las operaciones protegidas consultan la sesión con Auth por la red interna. El navegador envía la cookie HttpOnly con `credentials: "include"`; la clave interna nunca llega al frontend.

### Eventos por RabbitMQ (I3)

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

Configuración: `BROKER_URL`, `EVENT_EXCHANGE` (por defecto `ticketu.events`), `BROKER_QUEUE_EVIDENCIA` (opcional, cola enlazada a `resena.creada`). Si RabbitMQ no está disponible, la reseña se guarda igual y el error queda en el log con reintento automático de conexión.

### Ejecutar con Docker

1. Crear una vez la red compartida indicada por Platform Team:

   ```powershell
   docker network create plataforma-eventos-net
   ```

2. En `code/backend`, configurar `.env` (copiar `.env.example`) con la URL interna del Gateway para contenedores:

   ```env
   API_GATEWAY_DOCKER_URL=http://api-gateway:8080
   CATALOGO_SERVICE_DOCKER_URL=http://catalogo-service:3000
   CHECKIN_SERVICE_DOCKER_URL=http://api-gateway:8080/api/checkin
   AUTH_SERVICE_DOCKER_URL=http://auth-service:10000
   AUTH_INTERNAL_API_KEY=<configurar por canal seguro>
   BROKER_DOCKER_URL=amqp://ticketu:ticketu@rabbitmq:5672/ticketu
   EVENT_EXCHANGE=ticketu.events
   ```

   Los nombres deben coincidir con los aliases reales de los servicios en Docker. `API_GATEWAY_URL` permanece como `http://localhost:8080` para ejecución directa desde el host; ese `localhost` no sirve desde dentro de un contenedor.
   `AUTH_INTERNAL_API_KEY` debe contener la clave compartida del entorno entregada por Auth. Guárdala solo en `.env`; nunca la subas a Git ni la configures en el frontend. Auth debe estar conectado a `plataforma-eventos-net` con el alias `auth-service`.

3. Levantar Reseñas:

   ```powershell
   docker compose up --build -d
   ```

   El servicio API se publica en el host como `http://localhost:5000`, escucha en el puerto interno `3000` (mapeado al `5000` del host) y se conecta a Postgres por la red interna de Compose. Su alias compartido es `ms-resenas` / `resenas-service`.

4. Levantar Gateway, Catálogo, Check-in y RabbitMQ en `plataforma-eventos-net`. En el `.env` de Catálogo, configurar `RESENAS_SERVICE_URL=http://ms-resenas:3000`. El Gateway debe dirigir `/api/resenas/*` a `http://resenas-service:3000`.

5. Si el volumen PostgreSQL ya existía, aplicar la migración aditiva:

   ```powershell
   docker compose exec ms-resenas npm run db:migrate:auth
   ```

   No ejecutes `npm run db:init` sobre una base existente: recrea las tablas. La columna `auth_uuid` ya viene en el esquema de bases nuevas.

El Gateway debe conservar la cookie y permitir credenciales para el origen del frontend. La ruta interna de Auth se llama directamente desde el backend de Reseñas, no a través del Gateway.

La copia actual de Check-in debe implementar `GET /api/checkin/asistencia` para confirmar asistencia por UUID; mientras no exista, la elegibilidad y la creación fallan de forma segura con 503. Las respuestas de organizador también requieren asociar de forma verificada el UUID de Auth con el propietario del evento; Catálogo todavía no entrega esa asociación en el contrato usado aquí.

Docker se ocupa de ejecutar el backend y su base de datos en contenedores aislados, y de conectarlos por la red compartida; no es una dependencia del front.

## API Endpoints (Backend)

### `/api/resenas` (Rutas principales)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/me` | Obtener el perfil validado por Auth (requiere sesión) |
| GET | `/health` | Health check con verificación de BD |
| GET | `/eligibilidad` | Verificar si la sesión puede reseñar un evento |
| POST | `/` | Crear una reseña (requiere sesión Auth y asistencia confirmada) |
| GET | `/` | Listar reseñas con filtros opcionales |
| GET | `/promedio` | Obtener promedio de calificaciones de un evento |
| GET | `/evento/:eventoId` | Obtener reseñas y promedio de un evento (paginado) |
| POST | `/:idResena/respuestas` | Crear respuesta (sesión Auth de organizador y propiedad validada) |

### `/api/v1/resenas` (Rutas para Catálogo)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/calificaciones-basicas` | Obtener promedio y total de reseñas para múltiples eventos (máx. 100) |
| GET | `/evento/:eventoId` | Obtener reseñas y promedio de un evento (formato V1 para Catálogo) |

## Ejecución de implementación

### Comandos para **front-end**

1. Ingresar a directorio correspondiente al front-end: `cd code/frontend`
2. Instalar dependencias: `npm install`
3. Copiar `.env.example` a `.env.local` (PowerShell: `Copy-Item .env.example .env.local`).
4. Lanzar dependencias: `npm run dev`
5. Abrir http://localhost:3000/catalogo/evt-101/resenas para probar reseñas del evento de ejemplo.

### Comandos para **back-end**

**Requiere PostgreSQL instalado y una base de datos llamada `resenas` ya creada.**

1. Ingresar a directorio correspondiente al back-end: `cd code/backend`
2. Instalar dependencias: `npm install`
3. Crear el archivo `.env` a partir de `.env.example` y configurar PostgreSQL. Asegurarse de que exista la base `resenas`; `FRONTEND_ORIGIN` debe ser `http://localhost:3000`.
4. Inicializar y sembrar solo una base nueva: `npm run db:init`. Para una base existente, aplicar `npm run db:migrate:auth` y no volver a ejecutar `db:init`.
5. Recargar los datos iniciales (opcional): `npm run db:seed`
6. Lanzar dependencias: `npm start`
**La API estará levantada en el puerto 5000**

### Comandos para probar el docker

1. Acceder a directorio `cd code/backend`
2. `Copy-Item .env.example .env -ErrorAction SilentlyContinue` para **PowerShell** o bien `copy .env.example .env` para **CMD**
3. `docker network create plataforma-eventos-net` se crea la red virtual en donde se ejecutará
4. `docker compose up --build -d` lee el archivo de docker-compose.yml y los pone en marcha
5. `docker compose ps` muestra la tabla del estado actual del docker

## Estructura del proyecto

```
Equipo6-resenas/
├── code/
│   ├── backend/                 # API Node.js + Express
│   │   ├── src/
│   │   │   ├── config/          # Configuración de BD
│   │   │   ├── controllers/     # Controladores de reseñas
│   │   │   ├── database/        # Inicialización y seed de BD
│   │   │   ├── middlewares/     # Manejo de errores, CORS, correlation ID
│   │   │   ├── repositories/    # Acceso a datos (PostgreSQL)
│   │   │   ├── routes/          # Rutas API v1 y principales
│   │   │   ├── services/        # Lógica de negocio, Catálogo, Check-in, Broker
│   │   │   └── utils/           # Validaciones
│   │   ├── broker.service.js    # Publicador RabbitMQ (evento resena.creada)
│   │   ├── docker-compose.yml   # Backend + PostgreSQL
│   │   └── Dockerfile
│   └── frontend/                # Next.js 14 + React 18 + TypeScript
│       ├── src/
│       │   ├── app/             # App Router (páginas)
│       │   ├── components/      # Componentes UI compartidos
│       │   ├── lib/             # Configuración de entorno
│       │   └── modules/
│       │       └── resenas/     # Módulo de reseñas (HU1, HU4)
│       │           ├── components/  # ResenasPlaceholder, ReviewsSection, ReviewForm, etc.
│       │           ├── api.ts       # Cliente API para reseñas
│       │           └── useReviews.ts # Hook para gestión de estado
│       ├── docker-compose.yml
│       └── Dockerfile
├── contract/                    # Contratos de integración (Markdown)
│   ├── Contrato Catálogo de eventos.md
│   ├── Contrato Catalogo Promedio Reseñas.md
│   ├── Contrato Check-in.md
│   └── Contrato integración general.md
├── docs/                        # Documentación adicional
│   ├── api/
│   └── database/
├── INSTALACION.md               # Guía de instalación completa
├── INTEGRACIONES.md             # Detalle de integraciones I1, I2, I3
└── README.md
```

## Variables de entorno principales (Backend)

| Variable | Descripción | Ejemplo |
|---|---|---|
| `PORT` | Puerto del servidor | `5000` |
| `DB_HOST` | Host PostgreSQL | `localhost` |
| `DB_PORT` | Puerto PostgreSQL | `5432` |
| `DB_USER` | Usuario PostgreSQL | `postgres` |
| `DB_PASSWORD` | Contraseña PostgreSQL | `postgres` |
| `DB_NAME` | Base de datos | `resenas` |
| `FRONTEND_ORIGIN` | Origen permitido para CORS | `http://localhost:3000` |
| `CATALOGO_SERVICE_URL` | URL servicio Catálogo | `http://localhost:8080/api/catalogo` |
| `CHECKIN_SERVICE_URL` | URL servicio Check-in | `http://localhost:8080/api/checkin` |
| `API_GATEWAY_URL` | URL API Gateway | `http://localhost:8080` |
| `AUTH_SERVICE_URL` | URL interna de Auth | `http://localhost:10000` |
| `AUTH_INTERNAL_API_KEY` | Secreto para la introspección servidor-a-servidor | (configurar localmente; no subir a Git) |
| `AUTH_TIMEOUT_MS` | Timeout de introspección Auth | `1000` |
| `BROKER_URL` | URL RabbitMQ | `amqp://ticketu:ticketu@localhost:5672/ticketu` |
| `EVENT_EXCHANGE` | Exchange RabbitMQ | `ticketu.events` |
| `SERVICE_TO_SERVICE_TOKEN` | Token servicio a servicio | (opcional) |
| `CATALOGO_TIMEOUT_MS` | Timeout Catálogo (ms) | `2000` |
| `CHECKIN_TIMEOUT_MS` | Timeout Check-in (ms) | `2000` |

## Estado actual (rama workstation)

- ✅ Backend: API completa con endpoints REST, validación, manejo de errores
- ✅ Base de datos: Esquema, inicialización y seed implementados
- ✅ Integración Catálogo (I2): Consumo y provisión de endpoints funcionando
- ✅ Integración Check-in: Verificación de elegibilidad implementada
- ✅ RabbitMQ (I3): Publicador `resena.creada` con reintentos y logging
- ✅ Frontend: Módulo reseñas con componentes (HU1: calificar/comentar, HU4: respuesta organizador)
- ✅ Auth (I1): Sesión verificada servidor-a-servidor; identidad obtenida desde Auth
- ⚠️ Check-in: falta disponibilidad del endpoint de asistencia por UUID para probar la publicación de reseñas de extremo a extremo
- ⚠️ Respuestas: pendiente el mapeo de propiedad de eventos a UUID de Auth
- ⚠️ Acuerdo con Organizador para consumo de `resena.creada` **pendiente**