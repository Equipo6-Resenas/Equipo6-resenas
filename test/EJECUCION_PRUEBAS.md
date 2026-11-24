# Guía de Ejecución de Pruebas - Entrega 4 (Módulo Reseñas)

## 📋 Requisitos Previos

| Herramienta | Versión | Instalación |
|-------------|---------|-------------|
| **Docker Desktop** | 4.x+ | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org/) |
| **Newman CLI** | 6.x+ | `npm install -g newman newman-reporter-htmlextra` |
| **Git Bash / WSL** | - | Para ejecutar `run-newman.sh` en Windows |

---

## 🚀 Inicio Rápido

### 1. Levantar Backend (Workstation Mode)

```bash
# Desde la raíz del proyecto
cd C:\Users\const\OneDrive\Escritorio\Equipo6-resenas\code\backend

# Levantar contenedores (postgres-resenas + ms-resenas)
docker compose up -d

# Verificar health (~5-10 segundos)
curl http://localhost:5000/health
# Respuesta esperada:
# {"status":"OK","modulo":"Resenas","base_datos":"conectada","db_hora":"..."}
```

### 2. Verificar que los contenedores estén corriendo

```bash
docker compose ps
# Debería mostrar:
# NAME                STATUS              PORTS
# postgres-resenas    Up                  5432/tcp
# ms-resenas          Up                  0.0.0.0:5000->3000/tcp
```

---

## 📦 Opciones de Ejecución - Script `run-newman.sh` (Git Bash / WSL)

### Ejecución recomendada: Reportes separados por carpeta

```bash
# Desde la raíz del proyecto (C:\Users\const\OneDrive\Escritorio\Equipo6-resenas)
bash test/run-newman.sh --separate
```

Esto genera:
```
test/newman-reports/
├── I1-Auth-Validacion-de-Sesion/
│   ├── newman-report-20261124-XXXXXX.html
│   ├── newman-report-20261124-XXXXXX.json
│   └── newman-junit-20261124-XXXXXX.xml
├── I2-Catalogo-Consumo-y-Provision/
│   ├── newman-report-20261124-XXXXXX.html
│   ├── newman-report-20261124-XXXXXX.json
│   └── newman-junit-20261124-XXXXXX.xml
├── I3-RabbitMQ-Publicacion-evento-resena.creada/
│   ├── newman-report-20261124-XXXXXX.html
│   ├── newman-report-20261124-XXXXXX.json
│   └── newman-junit-20261124-XXXXXX.xml
└── Utilitarios-y-Health-Checks/
    ├── newman-report-20261124-XXXXXX.html
    ├── newman-report-20261124-XXXXXX.json
    └── newman-junit-20261124-XXXXXX.xml
```

### Otras opciones

| Comando | Descripción |
|---------|-------------|
| `bash test/run-newman.sh` | Ejecución completa, reporte único combinado en `test/newman-reports/all/` |
| `bash test/run-newman.sh --folder "I2 - Catálogo: Consumo y Provisión"` | Solo una carpeta específica |
| `bash test/run-newman.sh --json-only` | Solo reporte JSON (para CI/CD) |
| `bash test/run-newman.sh --bail` | Para en primer fallo |
| `bash test/run-newman.sh --separate --bail` | Separado + para en primer fallo |
| `bash test/run-newman.sh --help` | Ver todas las opciones |

### Variables de entorno personalizadas

```bash
# Sobrescribir URLs por defecto
export gateway_url=http://mi-gateway:8080
export backend_url=http://mi-backend:5000
export evento_id=evt-102

bash test/run-newman.sh --separate
```

---

## 🖥️ Ejecución Directa con Newman (PowerShell / CMD)

Si prefieres no usar el script bash, puedes ejecutar Newman directamente:

```powershell
# Sintaxis base
npx newman run test\Entrega4-Integraciones.postman_collection.json `
  --folder "NOMBRE_EXACTO_DE_CARPETA" `
  --reporters cli,htmlextra,json,junit `
  --reporter-htmlextra-export test\newman-reports\REPORTE.html `
  --reporter-json-export test\newman-reports\REPORTE.json `
  --reporter-junit-export test\newman-reports\REPORTE.xml
```

### Comandos por carpeta (copia y pega en PowerShell):

```powershell
# I1 - Auth: Validación de Sesión
npx newman run test\Entrega4-Integraciones.postman_collection.json `
  --folder "I1 - Auth: Validación de Sesión" `
  --reporters cli,htmlextra,json,junit `
  --reporter-htmlextra-export test\newman-reports\I1-report.html `
  --reporter-json-export test\newman-reports\I1-report.json `
  --reporter-junit-export test\newman-reports\I1-report.xml

# I2 - Catálogo: Consumo y Provisión
npx newman run test\Entrega4-Integraciones.postman_collection.json `
  --folder "I2 - Catálogo: Consumo y Provisión" `
  --reporters cli,htmlextra,json,junit `
  --reporter-htmlextra-export test\newman-reports\I2-report.html `
  --reporter-json-export test\newman-reports\I2-report.json `
  --reporter-junit-export test\newman-reports\I2-report.xml

# I3 - RabbitMQ: Publicación evento resena.creada
npx newman run test\Entrega4-Integraciones.postman_collection.json `
  --folder "I3 - RabbitMQ: Publicación evento resena.creada" `
  --reporters cli,htmlextra,json,junit `
  --reporter-htmlextra-export test\newman-reports\I3-report.html `
  --reporter-json-export test\newman-reports\I3-report.json `
  --reporter-junit-export test\newman-reports\I3-report.xml

# Utilitarios y Health Checks
npx newman run test\Entrega4-Integraciones.postman_collection.json `
  --folder "Utilitarios y Health Checks" `
  --reporters cli,htmlextra,json,junit `
  --reporter-htmlextra-export test\newman-reports\Utilitarios-report.html `
  --reporter-json-export test\newman-reports\Utilitarios-report.json `
  --reporter-junit-export test\newman-reports\Utilitarios-report.xml
```

### Ejecución completa (todo en uno):

```powershell
npx newman run test\Entrega4-Integraciones.postman_collection.json `
  --reporters cli,htmlextra,json,junit `
  --reporter-htmlextra-export test\newman-reports\Full-report.html `
  --reporter-json-export test\newman-reports\Full-report.json `
  --reporter-junit-export test\newman-reports\Full-report.xml
```

---

## 📊 Interpretación de Reportes

### HTML (Visual - Abrir en navegador)
- Verde ✅ = Test pasó
- Rojo ❌ = Test falló
- Clic en cada request para ver Request/Response completo
- Headers, Body, Cookies, Timings

### JSON (Para automatización)
```bash
# Ver resumen rápido con jq
jq '.run.stats' test/newman-reports/I2-Catalogo-.../newman-report-*.json
# {
#   "iterations": {"total": 1, "failed": 0},
#   "requests": {"total": 7, "failed": 0},
#   "tests": {"total": 35, "failed": 0},
#   "assertions": {"total": 35, "failed": 0}
# }
```

### JUnit XML (CI/CD)
- Compatible con GitHub Actions, GitLab CI, Jenkins, Azure DevOps

---

## ✅ Qué Valida Cada Carpeta (Detalle Completo)

### I1 - Auth: Validación de Sesión (3 requests)

| # | Test | Endpoint | Qué Verifica | Estado Esperado Workstation |
|---|------|----------|--------------|----------------------------|
| 1.1 | Con sesión válida | GET `/api/resenas/me` | Cookie `jwt` + x-api-key a Auth | **401 INVALID_REQUEST** ⚠️ |
| 1.2 | Sin cookie | GET `/api/resenas/me` | Debe retornar 401 | **401 INVALID_REQUEST** ✅ |
| 1.3 | Rol organizador | POST `/api/resenas` | Debe rechazar rol organizador | **401 INVALID_REQUEST** ⚠️ |

> **⚠️ IMPORTANTE:** Tests 1.1 y 1.3 dan 401 porque **Platform Team no proveyó `auth-service` en la red `plataforma-eventos-net`**. Es comportamiento **esperado y documentado**. El backend valida la cookie contra Auth; al no estar disponible, responde 401 `INVALID_REQUEST`.

### I2 - Catálogo: Consumo y Provisión (7 requests)

| # | Test | Endpoint | Qué Verifica |
|---|------|----------|--------------|
| 2.1 | Elegibilidad usuario | GET `/api/resenas/eligibilidad?eventoId=evt-101` | Consume Catálogo + Check-in (401 sin Auth) |
| 2.2 | Evento inexistente | GET `/api/resenas/eligibilidad?eventoId=evt-99999` | 404/503 cuando Catálogo no encuentra evento |
| 2.3 | **I-3 Principal** | GET `/api/resenas/evento/evt-101` | **Público** vía Gateway - ✅ FUNCIONA |
| 2.4 | Evento con reseñas | GET `/api/resenas/evento/evt-103` | evt-103 tiene 4 reseñas (promedio 4.25) |
| 2.5 | Validación tamano | GET `?tamano=500` directo a backend | 400 Bad Request (máx 50) ✅ |
| 2.6 | Lote para Catálogo | POST `/api/v1/resenas/calificaciones-basicas` | Snake_case, evt-101: 5 reseñas |
| 2.7 | Formato V1 | GET `/api/v1/resenas/evento/evt-101` | Snake_case en respuesta |

**Datos seed actuales (evt-101):**
- 5 reseñas: calificaciones 5, 4, 5, 5, 4 = **promedio 4.6**, total=5
- evt-103: 4 reseñas: 5, 4, 5, 3 = **promedio 4.25**, total=4

### I3 - RabbitMQ (4 requests)

| # | Test | Qué Verifica |
|---|------|--------------|
| 3.1 | POST `/api/resenas` | Crea reseña → publica `resena.creada` en `ticketu.events` (topic) |
| 3.2 | Verificar en BD | GET `/api/resenas/evento/evt-101?pagina=1&tamano=1` |
| 3.3 | Health PostgreSQL | GET `/health` → `base_datos: conectada` |
| 3.4 | RabbitMQ Management UI | http://localhost:15672 (ticketu/ticketu, vhost: ticketu) |

**Verificar publicación en RabbitMQ:**
```bash
# Opción 1: Logs del contenedor
docker compose logs ms-resenas | grep resena.creada

# Opción 2: RabbitMQ Management UI
# 1. Abrir http://localhost:15672 (user: ticketu, pass: ticketu)
# 2. Exchanges → ticketu.events (topic) → "Messages published" > 0
# 3. Queues → "Add queue" → test.resena.creada
# 4. Bind to exchange ticketu.events with routing key "resena.creada"
# 5. Get Messages → ver payload JSON
```

**Payload esperado:**
```json
{
  "resenaId": "35",
  "eventoId": "evt-101",
  "usuarioId": "3f1e2c1a-4b8d-4a2e-9c3f-7d1e2f9b2d4a",
  "calificacion": 5,
  "fecha": "2026-11-24T10:30:00.000Z"
}
```

### Utilitarios y Health Checks (5 requests)

| # | Test | Endpoint |
|---|------|----------|
| 1 | Health Backend | GET `http://localhost:5000/health` |
| 2 | Health Gateway | GET `http://localhost:8080/health` |
| 3 | Listar reseñas | GET `/api/resenas?id_evento=evt-101` (público) |
| 4 | Promedio simple | GET `/api/resenas/promedio?id_evento=evt-101` → **4.6** |
| 5 | Respuesta organizador | POST `/api/resenas/1/respuestas` (requiere Auth → 401) |

---

## 🧪 Pruebas Unitarias (Backend)

```bash
cd C:\Users\const\OneDrive\Escritorio\Equipo6-resenas\code\backend
npm test
```

**Salida esperada (9 tests):**

```
✔ auth-service: valida la cookie con Auth y devuelve la identidad contractual
✔ auth-service: rechaza la solicitud sin cookie antes de llamar a Auth
✔ auth-service: falla de forma segura si Auth rechaza la clave interna
✔ auth-service: no confía en un perfil de Auth con UUID o rol inválido
✔ catalogo-service: consulta los datos mínimos del evento y propaga el correlation ID
✔ catalogo-service: consulta asistencia por usuario y evento y acepta asistio=false
✔ catalogo-service: falla de forma cerrada cuando Check-in aún no implementa la ruta contractual
✔ validaciones: validarCrearResena rechaza body inválido
✔ validaciones: validarRespuestaOrganizador rechaza body inválido
```

---

## 🐳 Arquitectura Workstation (Red `plataforma-eventos-net`)

| Contenedor | Puerto Interno | Puerto Host | Rol |
|------------|----------------|-------------|-----|
| `ticketu-rabbitmq` | 5672, 15672 | **15672** | **Broker compartido** (Platform Team) |
| `ticketu-api-gateway` | 8080 | **8080** | **Gateway** (Platform Team) |
| `ticketu-keycloak` | 8081 | 8081 | Auth/Keycloak (Platform Team) |
| `postgres-resenas` | 5432 | - | DB Reseñas (nuestro) |
| `ms-resenas` | 3000 | **5000** | **Backend Reseñas (nuestro)** |

> **⚠️ FALTA EN WORKSTATION:** `auth-service` (responsabilidad Platform Team)
> **⚠️ FALTA EN WORKSTATION:** `catalogo-service` y `checkin-service` (se consumen via Gateway)

---

## 🔧 Variables de Entorno Configurables

| Variable | Default | Descripción |
|----------|---------|-------------|
| `gateway_url` | `http://localhost:8080` | API Gateway (Platform Team) |
| `backend_url` | `http://localhost:5000` | Backend Reseñas (puerto host) |
| `evento_id` | `evt-101` | Evento de prueba con datos seed |

---

## 🆘 Troubleshooting Común

| Problema | Solución |
|----------|----------|
| `newman: command not found` | `npm install -g newman newman-reporter-htmlextra` |
| `docker compose up` falla | Verificar Docker Desktop corriendo; `docker compose down -v` y reintentar |
| `ECONNREFUSED localhost:5000` | Backend no levantado: `cd code/backend && docker compose up -d` |
| `502 Bad Gateway` en Gateway | Gateway no accesible (verificar `ticketu-api-gateway` en red `plataforma-eventos-net`) |
| Test I1 falla 401 | **ESPERADO** - Auth service no en red workstation |
| Test I2 2.3/2.4/2.6/2.7 fallan | Verificar que `ticketu-api-gateway` esté corriendo y accesible en :8080 |
| Reportes no se generan | `mkdir -p test/newman-reports` |
| Error sintaxis `run-newman.sh` | Usar Git Bash o WSL, no PowerShell/CMD |
| `jq: command not found` | `choco install jq` o `winget install jq` (solo para resumen JSON) |

---

## 📝 Verificación Rápida (Smoke Test)

```bash
# 1. Backend health
curl http://localhost:5000/health

# 2. Gateway health
curl http://localhost:8080/health

# 3. Endpoint I-3 público (debe responder 200 con JSON)
curl "http://localhost:8080/api/resenas/evento/evt-101?pagina=1&tamano=5"

# 4. Validación tamano (debe dar 400)
curl "http://localhost:5000/api/resenas/evento/evt-101?pagina=1&tamano=500"

# 5. RabbitMQ UI
# Abrir http://localhost:15672 en navegador
```

---

## 📚 Referencias

- `RESUMEN_ENTREGA4_ACTUALIZACIONES.md` - Detalle completo de implementación
- `INTEGRACIONES.md` - Especificación técnica I-1, I-2, I-3
- `contract/Contrato Auth.md` - Contrato I-1 Auth
- `docs/api/API de Reseñas.yaml` - OpenAPI v2.0.0
- `INSTALACION.md` - Paso a paso workstation

---

**Última actualización:** 24 de noviembre de 2026  
**Equipo:** Equipo 6 - Reseñas (TITEC 2026-2)