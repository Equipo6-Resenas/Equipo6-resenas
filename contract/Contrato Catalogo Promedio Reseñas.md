# Contrato de interfaz: Catálogo de Eventos ↔ Reseñas

**Versión:** 1.0

**Equipo consumidor:** Catálogo de Eventos

**Equipo proveedor:** Reseñas

**Basado en:** Diagrama de secuencia HU-02 (Ver reseñas y calificación promedio de un evento)

---

## 1. Propósito

El módulo de Catálogo de Eventos necesita mostrar, en el detalle de un evento, la calificación promedio y el listado de reseñas con comentarios, ordenado de la más reciente a la menos reciente. Reseñas expone esta información ya calculada y ordenada, para que Catálogo de Eventos no tenga que acceder a los datos crudos de reseñas.

---

## 2. Operación: Obtener reseñas y promedio de un evento

### 2.1 Descripción
Dado un evento, retorna la calificación promedio (calculada a partir de todas las reseñas con estrellas) y el listado de reseñas con comentario, ordenado de más reciente a menos reciente.

### 2.2 Quién la expone
Equipo Reseñas.

### 2.3 Quién la consume
Equipo Catálogo de Eventos, al cargar el detalle de un evento.

### 2.4 Endpoint propuesto
```
GET /resenas/evento/{eventoId}
```
*(Formato exacto —REST, gRPC o evento asíncrono— a acordar con el backend de Reseñas. Se propone REST por simplicidad.)*

### 2.5 Request

| Campo     | Tipo   | Obligatorio | Descripción                     |
|-----------|--------|:-----------:|-----------------------------------|
| eventoId  | string | Sí           | Identificador único del evento    |

**Ejemplo:**
```json
{
  "eventoId": "e-98765"
}
```

### 2.6 Response

| Campo         | Tipo          | Obligatorio | Descripción                                                        |
|---------------|---------------|:-----------:|----------------------------------------------------------------------|
| promedio      | number \| null | Sí          | Calificación promedio del evento. `null` si no hay reseñas aún       |
| totalResenas  | number        | Sí           | Cantidad total de reseñas del evento                                  |
| resenas       | array          | Sí           | Listado de reseñas, ordenado de más reciente a menos reciente. Lista vacía `[]` si no hay reseñas |

**Cada elemento de `resenas` contiene:**

| Campo        | Tipo   | Obligatorio | Descripción                          |
|--------------|--------|:-----------:|---------------------------------------|
| usuarioId    | string | Sí           | Identificador del usuario que reseñó  |
| calificacion | number | Sí           | Calificación en estrellas (1 a 5)     |
| comentario   | string | No           | Comentario opcional dejado por el usuario |
| fecha        | string (ISO 8601) | Sí | Fecha y hora de publicación de la reseña |

**Ejemplo (evento con reseñas):**
```json
{
  "promedio": 4.3,
  "totalResenas": 3,
  "resenas": [
    {
      "usuarioId": "u-12345",
      "calificacion": 5,
      "comentario": "Excelente organización",
      "fecha": "2026-09-08T18:30:00Z"
    },
    {
      "usuarioId": "u-22222",
      "calificacion": 4,
      "comentario": "Muy bueno, faltó puntualidad",
      "fecha": "2026-09-05T12:00:00Z"
    },
    {
      "usuarioId": "u-33333",
      "calificacion": 4,
      "fecha": "2026-09-01T09:15:00Z"
    }
  ]
}
```

**Ejemplo (evento sin reseñas):**
```json
{
  "promedio": null,
  "totalResenas": 0,
  "resenas": []
}
```

> **Nota de diseño:** Reseñas entrega el `promedio` ya calculado y el listado ya ordenado — Catálogo de Eventos no debe recalcular ni reordenar. Cuando no hay reseñas, se retorna `promedio: null` y `resenas: []` (nunca un error ni un objeto vacío ambiguo), para que Catálogo de Eventos pueda mostrar directamente un estado "sin reseñas aún" sin lógica adicional.

### 2.7 Códigos de error

| Código | Significado                                  |
|--------|-----------------------------------------------|
| 400    | `eventoId` ausente o inválido                 |
| 404    | Evento no existe                              |
| 500    | Error interno del servicio de Reseñas         |

### 2.8 Tiempo de respuesta esperado (SLA)
A definir con el equipo de Reseñas (propuesta inicial: < 300 ms, ya que esta llamada puede bloquear la carga del detalle del evento en la UI).

---

## 3. Reglas de uso (lado Catálogo de Eventos)

Según los criterios de aceptación de HU-02:

1. Al abrir el detalle de un evento, Catálogo de Eventos llama a esta operación con `eventoId`.
2. Si `totalResenas = 0` (o `resenas` está vacío) → se muestra un **estado vacío/nulo** explícito (ej. "Este evento aún no tiene reseñas"), nunca un error ni una pantalla en blanco.
3. Si `totalResenas > 0` → se muestra el `promedio` junto al listado de `resenas`, respetando el orden recibido (más reciente a menos reciente) sin reordenar en el frontend.
4. El campo `comentario` es opcional; si no viene, solo se muestra la calificación en estrellas de esa reseña.

---

## 4. Versionado y cambios

- Cualquier cambio en la forma del request/response de esta operación debe ser **versionado** (ej. `1.0`, `1.1`) y comunicado con anticipación al equipo de Catálogo de Eventos.
- Cambios que rompan compatibilidad (breaking changes) requieren período de transición acordado entre ambos equipos.

## 5. Dueños del contrato

| Rol                  | Equipo               |
|-----------------------|------------------------|
| Dueño del contrato     | Reseñas                | 
| Consumidor principal   | Catálogo de Eventos     |

---

## 6. Pendientes a acordar con el equipo de Catálogo de Eventos

- [ ] Confirmar protocolo (REST vs evento asíncrono vs gRPC).
- [ ] Confirmar nombre exacto del endpoint y formato de autenticación.
- [ ] Confirmar si se requiere paginación cuando `totalResenas` es muy alto.
- [ ] Confirmar SLA de tiempo de respuesta.
- [ ] Confirmar manejo de reintentos si Reseñas no responde.
