# INTEGRACIONES.md: Módulo Reseñas (Grupo 6)

Se declara **una integración por tipo**. Todas se ejecutan contra Auth, API Gateway y RabbitMQ de workstation, con direcciones y credenciales por variables de entorno (ver `INSTALACION.md`, sección 3).

## Tabla de integraciones

| Integración | Tipo | Módulo contraparte | Servicio, ruta en el gateway o tópico | Cómo se evidencia | Dónde verificarlo |
|---|---|---|---|---|---|
| I1 | A. Autenticación | Auth | Login `POST /api/auth/login` y validación de token con rol (`Authorization: Bearer <token>`) | Funcionalidad y traza | Sección I1 |
| I2 | B. API Gateway | Catálogo de Eventos | `GET /api/resenas/evento/{eventoId}` (provisto por Reseñas) | Traza y funcionalidad | Sección I2 |
| I3 | C. Broker | Organizador | Evento `resena.creada` en el exchange `ticketu.events` | Consola de RabbitMQ y traza | Sección I3 |

---

## I1. Autenticación con Auth

**Contraparte:** Auth. **Rutas usadas:** `POST /api/auth/login` (login) y validación de token en cada request a `/api/resenas/*`.

**Cómo funciona**
- El front inicia sesión con Auth y envía el token en `Authorization: Bearer <token>` en cada llamada a `/api/resenas/...`. El token se guarda en el navegador (localStorage/cookie según implementación de Auth).
- El backend valida el token (firma y vencimiento) y toma `usuarioId` y **rol** del token, no del cuerpo de la petición. Middleware: `code/backend/src/middlewares/auth.middleware.js` (pendiente de implementar).
- Roles esperados: `cliente` puede publicar reseñas; `organizador` puede responder reseñas de su evento. Otro rol recibe 403.
- Sin token, con token inválido o vencido: 401.
- Configuración: `AUTH_URL` (`http://api-gateway:8080/api/auth`) y `AUTH_JWT_SECRET` / `AUTH_JWKS_URL` por variables de entorno. Sin tokens fijos ni `localhost` en el código.

**Cómo verificarlo en workstation**
1. *Funcionalidad:* con el usuario cliente (`ana.lopez@tec.mx`), publicar una reseña; con el usuario organizador (`ana.lopez@tec.mx` — mismo usuario es organizador de evt-101/102), responderla; con un rol no permitido, la acción es rechazada (403).
2. *Sin token (debe dar 401):*
   ```bash
   curl -i -X POST <GATEWAY_URL>/api/resenas -H "Content-Type: application/json" \
     -d '{"id_evento":"evt-101","clasificacion":5}'
   ```
3. *Token alterado (debe dar 401):*
   ```bash
   curl -i -X POST <GATEWAY_URL>/api/resenas \
     -H "Authorization: Bearer <token_valido_con_ultimo_caracter_cambiado>" \
     -H "Content-Type: application/json" \
     -d '{"id_evento":"evt-101","clasificacion":5}'
   ```
4. *Traza:* log del backend (`docker compose logs ms-resenas`) con mensaje de token rechazado/inválido y fecha y hora.

> **Estado actual:** Middleware de autenticación **pendiente** (ver `code/backend/src/middlewares/`). Actualmente el backend no valida tokens; se espera que el Gateway/Auth lo hagan o que se implemente el middleware.

---

## I2. Servicio provisto por el API Gateway

**Contraparte:** Catálogo de Eventos (consume). **Servicio:** `GET /api/resenas/evento/{eventoId}?pagina={n}&tamano={n}`: devuelve `promedio`, `totalResenas`, `pagina`, `tamano` y `resenas` (ordenadas de más reciente a menos reciente).

- **Contrato (proveedor: Reseñas):** rama workstation, archivo `contract/Contrato integración general.md` (operación I-3) y `contract/Contrato Catalogo Promedio Reseñas.md`.
- **Swagger/OpenAPI:** `docs/api/API de Reseñas.yaml` (incluye esta ruta con el prefijo `/api/resenas`).
- **Ruta en el Gateway:** `/api/resenas/*` → `RESENAS_SERVICE_URL=http://resenas-service:3000`. El Gateway conserva el path completo; el backend responde en `/api/resenas/evento/{eventoId}` (`code/backend/src/routes/resenas.routes.js`).
- **Dependencia:** Reseñas ↔ Catálogo (tabla de dependencias TITEC 2026-2).

**Cómo verificarlo en workstation**
1. *Funcionalidad:*
   ```bash
   curl -i "<GATEWAY_URL>/api/resenas/evento/evt-101"
   ```
   Respuesta esperada: 200 con `promedio`, `totalResenas` y `resenas` (3 reseñas en seed).
2. *Evento sin reseñas:* `curl -i "<GATEWAY_URL>/api/resenas/evento/evt-103"` → 200 con `promedio: null`, `totalResenas: 0`, `resenas: []` (según contrato consolidado, Reseñas no valida existencia del evento).
3. *Parámetro inválido (400):* `curl -i "<GATEWAY_URL>/api/resenas/evento/evt-101?tamano=500"` → 400 con mensaje comprensible (validación en `code/backend/src/controllers/resenas.controller.js`).
4. *Paginación:* `curl -i "<GATEWAY_URL>/api/resenas/evento/evt-101?pagina=1&tamano=1"` → 200 con 1 reseña por página.
5. *Sin token (401):* Requiere middleware I1 implementado.
6. *Pasa por el Gateway:* `docker compose logs -f gateway` (en el repo del Gateway) muestra `GET /api/resenas/evento/...`, y `docker compose logs ms-resenas` (en `code/backend`) muestra la misma petición con `X-Correlation-Id`, fecha y hora. En la pantalla `/catalogo/<eventoId>` de Catálogo se ven las reseñas si Catálogo ya consume el servicio.
7. *Errores del servicio provisto:* los errores se devuelven como JSON y la aplicación no se cae (`code/backend/src/middlewares/errorHandler.js`).
8. *Servicio caído:* si el microservicio está caído, el Gateway responde 502 controlado.

**Contraparte no disponible:** si Catálogo no está instalado o no consume el jueves, la parte propia se evidencia con los pasos 1 a 5 (la petición llega al Gateway con la ruta del contrato y el servicio responde por el gateway).

> El backend también expone `GET /api/v1/resenas/evento/{eventoId}` y `POST /api/v1/resenas/calificaciones-basicas` para Catálogo, pero esos prefijos solo sirven por el Gateway si este los enruta. **Solo se declara la ruta de arriba como I2.**

---

## I3. Notificación por el broker (RabbitMQ)

**Contraparte:** Organizador (consumidor propuesto en la tabla de eventos del Platform Team). **Acuerdo:** pendiente por formalizar con equipo Organizador (quién, fecha y medio).

- **Rol de Reseñas:** publica.
- **Exchange:** `ticketu.events` (tipo `topic`). **Routing key:** `resena.creada`.
- **Cuándo se publica:** después de guardar una reseña en la base de datos (`code/backend/src/services/resenas.service.js`, función `crearResena`). Publicador: `code/backend/src/services/broker.service.js`.
- **Esquema del mensaje (JSON):**

| Campo | Tipo | Descripción |
|---|---|---|
| `resenaId` | string | `num_resena` de la reseña |
| `eventoId` | string | Evento reseñado |
| `usuarioId` | string | Autor |
| `calificacion` | number | 1 a 5 |
| `fecha` | string (ISO 8601) | Fecha y hora de publicación |

```json
{
  "resenaId": "21",
  "eventoId": "evt-101",
  "usuarioId": "3",
  "calificacion": 5,
  "fecha": "2026-11-19T10:30:00Z"
}
```

- **Configuración:** `BROKER_URL` (`amqp://ticketu:ticketu@ticketu-rabbitmq:5672/ticketu`) y `EVENT_EXCHANGE` (`ticketu.events`) por variables de entorno.
- **Fallos:** si RabbitMQ no está disponible, la reseña se guarda igual, la aplicación no falla y el error queda en el log. Manejo en `code/backend/src/services/broker.service.js` (try/catch de conexión y publicación, con reintento de conexión automático).

**Cómo verificarlo en workstation**
1. *Acción:* con el usuario cliente, publicar una reseña en el front (o `POST /api/resenas` por el Gateway).
2. *Traza de publicación:* en `docker compose logs ms-resenas` aparece `resena.creada publicada resenaId=<id>` con fecha y hora.
3. *Consola del broker:* `http://<host-rabbitmq>:15672` (usuario `ticketu`, password `ticketu`), vhost `ticketu` → Exchanges → `ticketu.events` → mensajes publicados. Con una cola enlazada a `resena.*`, usar *Get messages* para ver el mensaje.
4. *Base de datos (efecto consistente con lo publicado):*
   ```sql
   SELECT num_resena, id_usuario, id_evento, clasificacion, "fecha_reseña"
   FROM resenas
   ORDER BY num_resena DESC LIMIT 1;
   ```
   Los datos coinciden con el mensaje publicado.

**Contraparte no disponible:** si Organizador no consume el jueves, la parte propia se evidencia con los pasos 1 a 4 (el mensaje se publica en el exchange con el esquema acordado).

---

## Integraciones adicionales (consumidas por Reseñas)

### Catálogo (validación de evento)
- **Endpoint:** `GET /api/catalogo/eventos/{eventoId}/info-servicio`
- **Uso:** Validar que el evento existe antes de crear una reseña (`code/backend/src/services/catalogo.service.js`).
- **Timeout:** `CATALOGO_TIMEOUT_MS=2000`.
- **Falla cerrada:** Si Catálogo no responde (timeout o error), no se permite crear la reseña → 503.

### Check-in (verificación de elegibilidad)
- **Endpoint:** `GET /api/checkin/asistencia?usuarioId={id}&eventoId={id}`
- **Uso:** Verificar que el usuario asistió al evento antes de permitir reseña (`code/backend/src/services/checkin.service.js`).
- **Timeout:** `CHECKIN_TIMEOUT_MS=2000`.
- **Falla cerrada:** Si Check-in no responde, no se permite crear la reseña → 503.

---

## Referencias

- Contratos: `contract/Contrato integración general.md`, `contract/Contrato Catalogo Promedio Reseñas.md`, `contract/Contrato Catálogo de eventos.md`, `contract/Contrato Check-in.md`.
- Tabla de dependencias TITEC 2026-2: Reseñas depende de Catálogo y Check-in. I2 corresponde a la relación con Catálogo. I1 e I3 no figuran en la tabla; justificarlos con el acuerdo con Auth y con Organizador, y con la propuesta de eventos del Platform Team (`resena.creada`).
- Archivos clave:
  - `code/backend/src/middlewares/auth.middleware.js` — middleware auth (pendiente)
  - `code/backend/src/services/catalogo.service.js` — cliente Catálogo
  - `code/backend/src/services/checkin.service.js` — cliente Check-in
  - `code/backend/src/services/broker.service.js` — publicador RabbitMQ
  - `code/backend/src/services/resenas.service.js` — lógica de negocio (llama a Catálogo, Check-in, Broker)
  - `code/backend/src/controllers/resenas.controller.js` — controladores y validaciones
  - `code/backend/src/routes/resenas.routes.js` — rutas principales `/api/resenas`
  - `code/backend/src/routes/resenas.v1.routes.js` — rutas V1 para Catálogo `/api/v1/resenas`