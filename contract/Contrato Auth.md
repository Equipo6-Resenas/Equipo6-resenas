# Contrato de integración: Módulo de Reseñas con Auth

**Versión:** 1.0  
**Equipo dueño del documento:** Reseñas (Equipo6-Resenas)  
**Fecha:** 2026-11-23  
**Tipo de integración:** A — Autenticación (validación de sesión)  
**Contraparte:** Auth  
**Dirección:** Reseñas → Auth (consume endpoint interno de introspección)

---

## 1. Descripción general

Reseñas valida la sesión del usuario en cada solicitud protegida consultando el endpoint interno de Auth `GET /internal/validar-sesion`. El navegador envía la cookie HttpOnly `jwt` (entregada por Auth al hacer login) con `credentials: "include"`. El backend de Reseñas reenvía esa cookie junto con su `x-api-key` compartida a Auth para introspección. **Reseñas nunca decodifica ni valida el JWT por su cuenta.**

- **Endpoint Auth:** `GET /internal/validar-sesion` (privado, no expuesto en API Gateway público)
- **Protocolo:** REST sobre HTTP, cuerpo `application/json; charset=utf-8`
- **Autenticación servicio a servicio:** Header `x-api-key` (clave compartida por entorno, nunca en Git ni frontend)
- **Trazabilidad:** Header `X-Correlation-Id` (UUID v4) propagado en toda la cadena

---

## 2. Request (Reseñas → Auth)

```
GET {AUTH_SERVICE_URL}/internal/validar-sesion
```

### Headers obligatorios

| Header | Valor | Descripción |
|---|---|---|
| `Cookie` | `jwt=<token>` | Cookie HttpOnly original del navegador (reenvida tal cual) |
| `x-api-key` | `<AUTH_INTERNAL_API_KEY>` | Secreto compartido entre Reseñas y Auth (configurado por entorno) |
| `Accept` | `application/json` | |
| `X-Correlation-Id` | `<uuid-v4>` | Generado por Reseñas al recibir la petición del cliente |

### Parámetros
Ninguno (todo va en headers).

---

## 3. Response 200 — Sesión válida

```json
{
  "valido": true,
  "usuario": {
    "id_usuario": "3f1e2c1a-4b8d-4a2e-9c3f-7d1e2f9b2d4a",
    "nombre_completo": "Juan Pérez",
    "correo_electronico": "juan.perez@estudiante.uv.cl",
    "rol": "usuario"
  }
}
```

### Campos obligatorios

| Campo | Tipo | Descripción |
|---|---|---|
| `valido` | `boolean` | Siempre `true` en 200 |
| `usuario.id_usuario` | `string` (UUID v4) | Identificador único del usuario en Auth |
| `usuario.nombre_completo` | `string` | Nombre completo para mostrar |
| `usuario.correo_electronico` | `string` \| `null` | Email del usuario (opcional en respuesta) |
| `usuario.rol` | `string` | Uno de: `usuario`, `organizador`, `staff` |

### Validaciones que hace Reseñas (código: `auth.service.js`)
- `valido === true`
- `id_usuario` es UUID v4 válido
- `nombre_completo` es string no vacío
- `rol` ∈ {`usuario`, `organizador`, `staff`}

Si alguna validación falla → **502 Bad Gateway** (perfil inválido).

---

## 4. Errores

| HTTP | Código | Cuándo | Acción en Reseñas |
|---|---|---|---|
| **401** | `SESION_INVALIDA` / `SESION_EXPIRADA` | Cookie `jwt` ausente, inválida o expirada | Propaga 401 al cliente: "La sesión no es válida o expiró; inicia sesión nuevamente" |
| **403** | `CREDENCIAL_INTERNA_RECHAZADA` | `x-api-key` inválida o no autorizada | **503 Service Unavailable** — error de configuración, no permite la operación |
| **500** | `ERROR_INTERNO` | Falla interna en Auth | **503** — "No fue posible validar la sesión con Auth" |
| **503** / timeout | `SERVICIO_NO_DISPONIBLE` | Auth no responde / timeout | **503** — "Auth no está disponible; intenta nuevamente" |
| **502** | `PERFIL_INVALIDO` | Respuesta 200 pero cuerpo no cumple esquema | **502** — "Auth devolvió un perfil de sesión inválido" |

### Formato de error (estándar)
```json
{
  "codigo": "SESION_INVALIDA",
  "mensaje": "La sesión no es válida o expiró; inicia sesión nuevamente",
  "correlationId": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
}
```

---

## 5. Reglas del lado Reseñas

1. **Solo rutas protegidas consultan a Auth:**
   - `GET /api/resenas/me`
   - `GET /api/resenas/eligibilidad`
   - `POST /api/resenas` (crear reseña)
   - `POST /api/resenas/:idResena/respuestas` (responder reseña)
   
   Las lecturas públicas (`GET /api/resenas`, `GET /api/resenas/promedio`, `GET /api/resenas/evento/:eventoId`, rutas `/api/v1/resenas/*`) **no requieren sesión**.

2. **Roles y permisos:**
   - `usuario` → puede crear reseñas
   - `organizador` → puede responder reseñas (además valida propiedad del evento en BD)
   - `staff` → sin permisos especiales en Reseñas (recibe 403 en operaciones de usuario/organizador)
   - Cualquier otro rol → 403

3. **Falla cerrada:** Si Auth no está disponible (503/timeout), **no se permite** la operación protegida. Nunca se asume una identidad.

4. **Configuración (variables de entorno):**
   - `AUTH_SERVICE_URL` — URL base de Auth (en Docker: `http://auth-service:10000`)
   - `AUTH_INTERNAL_API_KEY` — Clave compartida (canal seguro, solo en `.env`)
   - `AUTH_TIMEOUT_MS` — Timeout de la llamada (default: 1000 ms)

5. **Seguridad:**
   - La cookie `jwt` **nunca** se loguea ni expone en frontend
   - La `x-api-key` **nunca** llega al navegador
   - El endpoint `/internal/validar-sesion` **no debe** exponerse en el API Gateway público

---

## 6. Cómo verificarlo en workstation

1. **Login en frontend** → Auth setea cookie `jwt` (HttpOnly, SameSite=Lax, Secure en prod)
2. **Con sesión válida:**
   ```bash
   curl -i -b "jwt=<cookie>" -H "X-Correlation-Id: $(uuidgen)" \
     http://localhost:8080/api/resenas/me
   # → 200 { user: { id: "<uuid>", name: "...", role: "usuario|organizador|staff" } }
   ```
3. **Sin cookie (debe dar 401):**
   ```bash
   curl -i -H "X-Correlation-Id: $(uuidgen)" \
     http://localhost:8080/api/resenas/me
   # → 401 { codigo: "SESION_INVALIDA", ... }
   ```
4. **Rol distinto de `usuario` intentando crear reseña:**
   ```bash
   curl -i -b "jwt=<cookie-organizador>" -H "Content-Type: application/json" \
     -d '{"id_evento":"evt-101","clasificacion":5}' \
     http://localhost:8080/api/resenas
   # → 403 "Solo una cuenta de usuario puede crear reseñas"
   ```
5. **Logs backend (`docker compose logs ms-resenas`):**
   - Debe aparecer `X-Correlation-Id` en cada línea
   - **No** deben aparecer cookies, JWT ni `x-api-key`
6. **Verificar que el Gateway conserva la cookie:**
   - En DevTools → Network → Cookies: `jwt` presente en requests a `/api/resenas/*`
   - Gateway debe permitir `Access-Control-Allow-Credentials: true` para el origen del frontend

---

## 7. Dependencias y acuerdos

| Qué | Estado | Con quién |
|---|---|---|
| `x-api-key` compartida configurada en ambos lados | ⚠️ Por canal seguro | Auth |
| Auth expone `GET /internal/validar-sesion` (no en Gateway público) | ✅ Confirmado en auditoría | Auth |
| Auth devuelve `rol` normalizado (`usuario` \| `organizador` \| `staff`) | ✅ Confirmado | Auth |
| Catálogo entrega `id_organizador` como UUID de Auth (para validar propiedad en respuestas) | ❌ Pendiente | Catálogo |

> **Nota:** La validación de propiedad del evento para respuestas de organizador requiere que Catálogo asocie el evento con el `id_usuario` (UUID de Auth). Mientras no exista esa asociación, las respuestas de organizador permanecerán bloqueadas (403).

---

## 8. Versionado y cambios

- Formato `MAYOR.MENOR`. Cambio incompatible (quitar/renombrar campos, cambiar tipos, cambiar semántica de errores) → versión mayor + período de transición acordado.
- Agregar campos opcionales en respuesta → versión menor (no rompe consumidor).
- Pruebas de contrato: Auth debe proveer entorno/mock con datos fijos:
  - Usuario `usuario` → 200 con `rol: "usuario"`
  - Usuario `organizador` → 200 con `rol: "organizador"`
  - Sesión expirada → 401
  - `x-api-key` inválida → 403

---

## 9. Dueños del contrato

| Integración | Dueño del contrato | Consumidor principal |
|---|---|---|
| I1 Autenticación (validar sesión) | **Auth** | Reseñas |
