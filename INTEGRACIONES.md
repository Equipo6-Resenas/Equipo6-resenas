# INTEGRACIONES.md: Módulo Reseñas (Grupo 6)

Se declara **una integración por tipo**. Todas se ejecutan contra Auth, API Gateway y RabbitMQ de workstation, con direcciones y credenciales por variables de entorno (ver `INSTALACION.md`, sección 3).

## Tabla de integraciones

| Integración | Tipo | Módulo contraparte | Servicio, ruta en el gateway o tópico | Cómo se evidencia | Dónde verificarlo |
|---|---|---|---|---|---|
| I1 | A. Autenticación | Auth | Cookie `jwt` e introspección privada `GET /internal/validar-sesion` | Funcionalidad y traza | Sección I1 |
| I2 | B. API Gateway | Catálogo de Eventos | `GET /api/resenas/evento/{eventoId}` (provisto por Reseñas) | Traza y funcionalidad | Sección I2 |
| I3 | C. Broker | Organizador | Evento `resena.creada` en el exchange `ticketu.events` | Consola de RabbitMQ y traza | Sección I3 |

---

## I1. Autenticación con Auth

**Contraparte:** Auth. Auth gestiona el login y entrega una cookie HttpOnly `jwt`. Reseñas valida la sesión en cada solicitud protegida mediante `GET /internal/validar-sesion`, directamente por la red interna (no por el Gateway).

**Cómo funciona**
- El navegador llama a Reseñas con `credentials: "include"`; el Gateway debe conservar la cookie `jwt`.
- El backend reenvía la cookie original y `x-api-key` a `AUTH_SERVICE_URL/internal/validar-sesion`. No decodifica ni valida el JWT por su cuenta.
- La respuesta de Auth contiene el UUID `usuario.id_usuario` y el rol normalizado (`usuario`, `organizador` o `staff`). El backend ignora cualquier identidad o rol enviado por el navegador.
- Solo el rol `usuario` puede publicar reseñas; solo `organizador` puede responder, y el backend también valida la propiedad del evento.
- La respuesta de Catálogo usada por Reseñas aún no aporta el UUID del propietario. Las respuestas de organizador permanecerán bloqueadas hasta acordar y cargar esa asociación verificada.
- Sin sesión válida: 401. Si Auth no está configurado o disponible: 503. Una clave interna rechazada se trata como error de configuración y no permite la operación.
- Configuración backend: `AUTH_SERVICE_URL` (en Docker, `http://auth-service:10000`), `AUTH_INTERNAL_API_KEY` y `AUTH_TIMEOUT_MS`. La clave se guarda solo en `.env`, nunca en Git ni en el frontend.
- Solo `/me`, elegibilidad, creación de reseñas y respuestas requieren sesión; las lecturas públicas de reseñas permanecen públicas.

**Cómo verificarlo en workstation**
1. Iniciar sesión en Auth desde el frontend y consultar `/api/resenas/me`; debe devolver el UUID y rol validados por Auth.
2. *Sin cookie de sesión (debe dar 401):*
   ```bash
   curl -i -X POST <GATEWAY_URL>/api/resenas -H "Content-Type: application/json" \
     -d '{"id_evento":"evt-101","clasificacion":5}'
   ```
3. Con una sesión válida, intentar publicar como rol distinto de `usuario`: debe responder 403.
4. Verificar que la creación envía el UUID de Auth a Check-in; si Check-in aún no implementa la consulta contractual, Reseñas falla de forma segura con 503.
5. Revisar `docker compose logs ms-resenas`; no deben aparecer cookies, JWT ni claves.

La clave compartida debe entregarse por canal seguro. El endpoint interno no debe exponerse en el Gateway público. El Gateway debe reenviar la cookie y permitir credenciales para el origen del frontend.

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
5. Las lecturas de reseñas de I2 son públicas y no requieren una sesión Auth.
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
  "usuarioId": "3f1e2c1a-4b8d-4a2e-9c3f-7d1e2f9b2d4a",
  "calificacion": 5,
  "fecha": "2026-11-19T10:30:00Z"
}
```

- **Configuración:** `BROKER_URL` (`amqp://ticketu:ticketu@ticketu-rabbitmq:5672/ticketu`) y `EVENT_EXCHANGE` (`ticketu.events`) por variables de entorno.
- **Fallos:** si RabbitMQ no está disponible, la reseña se guarda igual, la aplicación no falla y el error queda en el log. Manejo en `code/backend/src/services/broker.service.js` (try/catch de conexión y publicación, con reintento de conexión automático).

**Cómo verificarlo en workstation**
1. *Acción:* con un usuario Auth de rol `usuario`, publicar una reseña en el front (o `POST /api/resenas` por el Gateway).
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
- **Endpoint:** `GET /api/checkin/asistencia?usuarioId={authUuid}&eventoId={id}`
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