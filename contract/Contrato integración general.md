# Contrato de integración: Módulo de Reseñas con Check-in y Catálogo de Eventos

**Versión:** 1.0
**Equipo dueño del documento:** Reseñas (Equipo6-Resenas)
**Fecha:** 2026-10-29
**Reemplaza / consolida:** Contrato Check-in v1.1, Contrato Catálogo de Eventos v1.0, Contrato Catálogo Promedio Reseñas v1.0
**Basado en:** HU-01 (Reseñar evento asistido), HU-02 (Adjuntar imagen a la reseña), HU (Ver reseñas y calificación promedio)

---

## 1. Mapa de integraciones

| # | Dirección | Proveedor | Consumidor | Operación | Tipo |
|---|-----------|-----------|------------|-----------|------|
| I-1 | Reseñas → Check-in | Check-in | Reseñas | Verificar asistencia | Síncrona (REST) |
| I-2 | Reseñas → Catálogo | Catálogo de Eventos | Reseñas | Obtener datos del evento | Síncrona (REST) |
| I-3 | Catálogo → Reseñas | Reseñas | Catálogo de Eventos | Obtener reseñas y promedio | Síncrona (REST) |

```
Cliente ──► Reseñas ──I-1──► Check-in        (¿asistió?)
              │
              └─────I-2──► Catálogo          (¿existe el evento? nombre/fecha/tipo)

Cliente ──► Catálogo ──I-3──► Reseñas        (promedio + listado ordenado)
```

---

## 2. Convenciones comunes (aplican a I-1, I-2 e I-3)

### 2.1 Protocolo y formato
- REST sobre HTTPS, cuerpo en `application/json; charset=utf-8`.
- Fechas en ISO 8601 UTC (`2026-09-21` para fecha, `2026-09-08T18:30:00Z` para fecha y hora).
- Identificadores como `string` opacos (`u-12345`, `e-98765`). Ningún equipo asume su formato interno, salvo que no estén vacíos y tengan máximo 64 caracteres.
- Campos en `camelCase`. Campos desconocidos en una respuesta deben ser **ignorados** por el consumidor (compatibilidad hacia adelante).

### 2.2 Cabeceras obligatorias

| Cabecera | Descripción |
|----------|-------------|
| `Authorization: Bearer <token>` | Token de servicio a servicio. Mecanismo exacto por confirmar (ver sección 8). |
| `X-Correlation-Id` | UUID generado por quien origina la petición y propagado en toda la cadena. Se registra en logs. |
| `Accept: application/json` | |

### 2.3 Formato único de error
Todos los servicios responden errores con este cuerpo:

```json
{
  "codigo": "EVENTO_NO_ENCONTRADO",
  "mensaje": "El evento e-98765 no existe",
  "correlationId": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
}
```

| HTTP | Uso | ¿Reintentable? |
|------|-----|:--------------:|
| 400 | Parámetro ausente o con formato inválido | No |
| 401 / 403 | Token ausente, inválido o sin permiso | No |
| 404 | Recurso inexistente | No |
| 429 | Límite de tasa excedido | Sí, con espera |
| 500 | Error interno | Sí |
| 503 / timeout | Servicio no disponible | Sí |

### 2.4 Timeouts, reintentos y degradación
Valores propuestos, a confirmar con cada equipo:

| Parámetro | Valor |
|-----------|-------|
| SLA de respuesta (p95) | < 300 ms |
| Timeout del consumidor | 2 s |
| Reintentos | Máximo 2, solo en 500/503/timeout/429, con espera exponencial (200 ms, 600 ms) |
| Idempotencia | Las tres operaciones son de **solo lectura**, por lo que reintentar es seguro |
| Circuit breaker | Abrir tras 5 fallos consecutivos; reintentar a los 30 s |

**Comportamiento ante falla del proveedor (lado Reseñas):**
- Si Check-in no responde: **no se habilita** el formulario de reseña y se muestra "No pudimos verificar tu asistencia, intenta más tarde". Nunca se asume que asistió.
- Si Catálogo no responde al habilitar el formulario: no se habilita el formulario (no se puede validar el evento).
- Si Catálogo no responde al mostrar reseñas ya publicadas: se muestra la reseña sin nombre/fecha del evento, o se usa el último dato en caché si existe.

---

## 3. I-1: Verificar asistencia (Reseñas → Check-in)

**Proveedor:** Check-in. **Consumidor:** Reseñas. **Momento:** cuando el cliente finaliza el evento y se va a decidir si se habilita el formulario.

### 3.1 Endpoint (propuesta de corrección)
```
GET /checkin/asistencia?usuarioId={usuarioId}&eventoId={eventoId}
```
Se cambia de `POST` a `GET` porque es una consulta sin efectos secundarios y los parámetros ya van en la query string.

### 3.2 Request

| Parámetro (query) | Tipo | Obligatorio | Descripción |
|-------------------|------|:-----------:|-------------|
| usuarioId | string | Sí | Identificador del usuario/cliente |
| eventoId | string | Sí | Identificador del evento |

### 3.3 Response 200

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|:-----------:|-------------|
| usuarioId | string | Sí | Eco del parámetro |
| eventoId | string | Sí | Eco del parámetro |
| asistio | boolean | Sí | `true` si existe check-in confirmado para esa combinación |
| fechaCheckin | string (ISO 8601) | No | Solo si `asistio = true` |

```json
{
  "usuarioId": "u-12345",
  "eventoId": "e-98765",
  "asistio": true,
  "fechaCheckin": "2026-09-21T10:42:00Z"
}
```

Si el usuario existe pero **no tiene check-in**, la respuesta es `200` con `asistio: false` (no es un error).

### 3.4 Errores

| HTTP | `codigo` | Cuándo |
|------|----------|--------|
| 400 | `PARAMETRO_INVALIDO` | Falta `usuarioId` o `eventoId`, o formato inválido |
| 404 | `USUARIO_O_EVENTO_NO_ENCONTRADO` | El usuario o el evento no existen en Check-in |
| 500 | `ERROR_INTERNO` | Falla interna |

### 3.5 Reglas del lado Reseñas
1. `asistio = false` → no se habilita el formulario.
2. `asistio = true` → Reseñas valida internamente si ya existe una reseña de ese usuario para ese evento. Si existe, no habilita; si no, habilita.
3. Reseñas **no** recibe ni almacena otros datos del asistente.

> **Punto a corregir del contrato v1.1:** `asistio` estaba tipado como `String` y descrito como "lista de asistencias". Se propone `boolean` por evento/usuario. Si Check-in prefiere entregar la lista completa de asistentes de un evento, debe definirse como otra operación (`GET /checkin/eventos/{eventoId}/asistentes`) con paginación.

---

## 4. I-2: Obtener datos del evento (Reseñas → Catálogo de Eventos)

**Proveedor:** Catálogo de Eventos. **Consumidor:** Reseñas. **Momento:** al habilitar el formulario y al renderizar una reseña publicada.

### 4.1 Endpoint
```
GET /eventos/{eventoId}
```

### 4.2 Request

| Parámetro (path) | Tipo | Obligatorio | Descripción |
|------------------|------|:-----------:|-------------|
| eventoId | string | Sí | Identificador del evento |

No lleva cuerpo.

### 4.3 Response 200

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|:-----------:|-------------|
| eventoId | string | Sí | Identificador del evento |
| nombre | string | Sí | Nombre del evento |
| fecha | string (ISO 8601, fecha) | Sí | Fecha de realización |
| tipo | string | Sí | Categoría, por ejemplo `gratuito` o `pagado` |

```json
{
  "eventoId": "e-98765",
  "nombre": "Feria de Innovación TITEC",
  "fecha": "2026-09-21",
  "tipo": "gratuito"
}
```

### 4.4 Errores

| HTTP | `codigo` | Cuándo |
|------|----------|--------|
| 400 | `PARAMETRO_INVALIDO` | `eventoId` con formato inválido |
| 404 | `EVENTO_NO_ENCONTRADO` | El evento no existe en el catálogo |
| 500 | `ERROR_INTERNO` | Falla interna |

> **Punto a corregir del contrato v1.0:** el contrato original define tanto `existe: false` en un `200` como un `404` para el mismo caso. Se propone **un solo mecanismo: `404` con el formato de error de la sección 2.3**, y eliminar el campo `existe`. Si Catálogo prefiere conservar `existe`, debe ser con `200` y sin `404`; falta acordarlo.

### 4.5 Reglas del lado Reseñas
1. `404` → no se permite crear ni mostrar reseñas asociadas a ese evento.
2. `tipo` es solo contexto visual: las reglas de reseña son iguales para eventos gratuitos y pagados (HU-01).
3. Reseñas puede cachear `nombre`, `fecha` y `tipo` hasta 10 minutos (propuesta) para no depender del Catálogo en cada render.
4. Catálogo no comparte datos de gestión interna (organizador, aforo, costos, proveedores).

---

## 5. I-3: Obtener reseñas y promedio de un evento (Catálogo de Eventos → Reseñas)

**Proveedor:** Reseñas. **Consumidor:** Catálogo de Eventos. **Momento:** al abrir el detalle de un evento.

### 5.1 Endpoint
```
GET /resenas/evento/{eventoId}?pagina={n}&tamano={n}
```

### 5.2 Request

| Parámetro | Ubicación | Tipo | Obligatorio | Descripción |
|-----------|-----------|------|:-----------:|-------------|
| eventoId | path | string | Sí | Identificador del evento |
| pagina | query | integer | No | Página, desde 1. Por defecto 1 |
| tamano | query | integer | No | Reseñas por página. Por defecto 20, máximo 50 |

### 5.3 Response 200

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|:-----------:|-------------|
| eventoId | string | Sí | Evento consultado |
| promedio | number \| null | Sí | Promedio de **todas** las reseñas (no solo de la página), con 1 decimal. `null` si no hay reseñas |
| totalResenas | integer | Sí | Total de reseñas del evento |
| pagina | integer | Sí | Página devuelta |
| tamano | integer | Sí | Tamaño de página aplicado |
| resenas | array | Sí | Reseñas de la página, de más reciente a menos reciente. `[]` si no hay |

**Elemento de `resenas`:**

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|:-----------:|-------------|
| resenaId | string | Sí | Identificador de la reseña |
| usuarioId | string | Sí | Usuario que reseñó |
| calificacion | integer | Sí | 1 a 5 |
| comentario | string | No | Máximo 1000 caracteres (propuesta). Se omite si no hay |
| fecha | string (ISO 8601, fecha y hora) | Sí | Fecha de publicación |
| imagenes | array de string (URL) | No | URLs de imágenes adjuntas (HU-02). Se omite si no hay. Solo para evento donde se confirme este campo con Catálogo |

```json
{
  "eventoId": "e-98765",
  "promedio": 4.3,
  "totalResenas": 3,
  "pagina": 1,
  "tamano": 20,
  "resenas": [
    {
      "resenaId": "r-001",
      "usuarioId": "u-12345",
      "calificacion": 5,
      "comentario": "Excelente organización",
      "fecha": "2026-09-08T18:30:00Z"
    },
    {
      "resenaId": "r-002",
      "usuarioId": "u-33333",
      "calificacion": 4,
      "fecha": "2026-09-01T09:15:00Z"
    }
  ]
}
```

Evento sin reseñas:
```json
{
  "eventoId": "e-98765",
  "promedio": null,
  "totalResenas": 0,
  "pagina": 1,
  "tamano": 20,
  "resenas": []
}
```

### 5.4 Errores

| HTTP | `codigo` | Cuándo |
|------|----------|--------|
| 400 | `PARAMETRO_INVALIDO` | `eventoId` inválido, `pagina` < 1 o `tamano` fuera de rango |
| 500 | `ERROR_INTERNO` | Falla interna |

> **Punto a corregir del contrato v1.0:** el contrato original devolvía `404` si el evento no existe, pero Reseñas no es dueño del catálogo y no puede saberlo sin llamar a I-2. Se propone que Reseñas devuelva **siempre `200`** (con lista vacía si no hay reseñas) y que Catálogo, que sí es dueño de los eventos, valide la existencia antes de llamar.

### 5.5 Reglas del lado Catálogo
1. `totalResenas = 0` → mostrar estado vacío explícito ("Este evento aún no tiene reseñas"), nunca error ni pantalla en blanco.
2. `totalResenas > 0` → mostrar `promedio` y el listado respetando el orden recibido, **sin recalcular ni reordenar**.
3. `comentario` es opcional: si falta, se muestra solo la calificación.
4. Catálogo no cachea el promedio más de 60 s (propuesta), para que las reseñas nuevas se reflejen rápido.

### 5.6 Reglas del lado Reseñas
1. El promedio se calcula sobre todas las reseñas con calificación, redondeado a 1 decimal.
2. El orden es por `fecha` descendente; en empate, por `resenaId` descendente para garantizar un orden estable entre páginas.
3. Reseñas no devuelve datos personales del usuario más allá de `usuarioId`. Si Catálogo necesita mostrar el nombre del autor, lo resuelve con su propio servicio de usuarios.

---

## 6. Flujos de punta a punta

### 6.1 Habilitar formulario de reseña (HU-01)
1. Cliente finaliza el evento → Reseñas recibe la solicitud.
2. Reseñas → **I-2**: valida que el evento existe. Si 404, termina sin habilitar.
3. Reseñas → **I-1**: verifica asistencia. Si `asistio = false` o hay error, no habilita.
4. Reseñas consulta su propia base: si ya existe reseña del usuario para el evento, no habilita.
5. En otro caso, habilita el formulario.

### 6.2 Ver reseñas de un evento
1. Cliente abre el detalle del evento en Catálogo.
2. Catálogo → **I-3** con `eventoId`.
3. Catálogo muestra promedio y listado, o el estado vacío.

---

## 7. Versionado, cambios y pruebas

- Versión del contrato con formato `MAYOR.MENOR`. Un cambio que rompe compatibilidad (quitar o renombrar campos, cambiar tipos, cambiar semántica de errores) sube la versión mayor y exige un período de transición acordado entre equipos.
- Agregar campos opcionales a una respuesta es un cambio menor y no rompe a los consumidores (ver 2.1).
- Los endpoints incluyen prefijo de versión cuando haya más de una vigente (ej. `/v1/eventos/{eventoId}`).
- **Pruebas de contrato:** cada proveedor entrega un entorno de pruebas (o mock) con estos datos fijos para validar la integración:

| Caso | Datos de prueba | Resultado esperado |
|------|-----------------|--------------------|
| Asistió | `u-12345` / `e-98765` | I-1: `asistio: true` |
| No asistió | `u-99999` / `e-98765` | I-1: `asistio: false` |
| Evento inexistente | `e-00000` | I-1 y I-2: `404` |
| Evento sin reseñas | `e-11111` | I-3: `promedio: null`, `resenas: []` |
| Evento con reseñas | `e-98765` | I-3: orden descendente por fecha |

---

## 8. Pendientes por acordar

| # | Pendiente | Con quién |
|---|-----------|-----------|
| 1 | Confirmar `GET` y respuesta `boolean` en I-1 (hoy `POST` y `String`) | Check-in |
| 2 | Elegir entre `404` o `existe: false` en I-2 | Catálogo de Eventos |
| 3 | Confirmar que I-3 siempre devuelve `200` sin validar existencia del evento | Catálogo de Eventos |
| 4 | Mecanismo de autenticación entre servicios (token de servicio, API key o red interna) | Los tres equipos |
| 5 | Paginación de I-3 y si Catálogo necesita el campo `imagenes` | Catálogo de Eventos |
| 6 | SLA, timeouts y política de reintentos definitivos | Los tres equipos |
| 7 | Entornos y datos de prueba (sección 7) | Check-in y Catálogo |
| 8 | Unificar numeración de historias de usuario: HU-02 aparece como "Adjuntar imagen" y como "Ver reseñas y promedio" según el documento | Reseñas |

---

## 9. Dueños del contrato

| Integración | Dueño del contrato | Consumidor principal |
|-------------|--------------------|----------------------|
| I-1 Verificar asistencia | Check-in | Reseñas |
| I-2 Datos del evento | Catálogo de Eventos | Reseñas |
| I-3 Reseñas y promedio | Reseñas | Catálogo de Eventos |

Contacto de Reseñas: constanzadiaz03 y equipo. Contactos de Check-in y Catálogo de Eventos: no hubo respuesta.
Se va a dar por hecho que al no responder estos microservicios **aceptan y llevarán a cabo** al pie de la letra lo consolidado mediante este contrato.