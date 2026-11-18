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
| I1 | A | Catálogo | `GET /api/catalogo/eventos/:id/info-servicio` | [Contrato Catalogo de eventos](https://github.com/Equipo6-Resenas/Equipo6-resenas/blob/main/contract/Contrato%20Cat%C3%A1logo%20de%20eventos.md) | https://github.com/Equipo6-Resenas/Equipo6-resenas/issues/12 |
| I2 | B | Catálogo | `GET /api/v1/resenas/evento/:id_evento`| [Contrato Promedio Reseñas](https://github.com/Equipo6-Resenas/Equipo6-resenas/blob/main/contract/Contrato%20Catalogo%20Promedio%20Rese%C3%B1as.md) | https://github.com/Equipo6-Resenas/Equipo6-resenas/issues/16 |



## Docentes
 
- Rodrigo Alfaro
- René Noël
- Sheyla Torres

## Dependencias de equipos 
- Check-in
- Catálogo de eventos

## Integraciones REST y Docker

Reseñas consume Catálogo y Check-in desde el backend; el navegador solo llama al
API Gateway.

| Flujo | Endpoint utilizado |
|---|---|
| Reseñas → Catálogo | `GET /api/catalogo/eventos/{eventoId}/info-servicio` |
| Reseñas → Check-in | `GET /api/checkin/asistencia?usuarioId={id}&eventoId={id}` |
| Catálogo → Reseñas | `POST /api/v1/resenas/calificaciones-basicas` |
| Catálogo → Reseñas | `GET /api/v1/resenas/evento/{eventoId}` |
| Front → Gateway → Reseñas | `/api/resenas/...` |

El backend envía `Accept: application/json` y `X-Correlation-Id` a los servicios
externos, aplica timeout y falla de forma cerrada: si Catálogo o Check-in no
responden, no se permite crear una reseña. El formulario del front consulta la
elegibilidad al backend y no usa un check-in simulado.

### Ejecutar con Docker

1. Crear una vez la red compartida indicada por Platform Team:

   ```powershell
   docker network create plataforma-eventos-net
   ```

2. En `code/backend`, configurar `.env` (copiar `.env.example`) con la URL
   interna del Gateway para contenedores:

   ```env
   API_GATEWAY_DOCKER_URL=http://api-gateway:8080
   CATALOGO_SERVICE_DOCKER_URL=http://catalogo-service:3000
   CHECKIN_SERVICE_DOCKER_URL=http://api-gateway:8080/api/checkin
   ```

   Los nombres deben coincidir con los aliases reales de los servicios en
   Docker. `API_GATEWAY_URL` permanece como `http://localhost:8080` para ejecución directa desde el host;
   ese `localhost` no sirve desde dentro de un contenedor.

3. Levantar Reseñas:

   ```powershell
   docker compose up --build -d
   ```

   El servicio API se publica en el host como `http://localhost:5000`, escucha
   en el puerto interno `3000` (mapeado al `5000` del host) y se conecta a
   Postgres por la red interna de Compose. Su alias compartido es `ms-resenas` /
   `resenas-service`.

4. Levantar Gateway, Catálogo y Check-in en `plataforma-eventos-net`. En el
   `.env` de Catálogo, configurar `RESENAS_SERVICE_URL=http://ms-resenas:3000`.
   El Gateway debe dirigir `/api/resenas/*` a `http://resenas-service:3000`.

Docker se ocupa de ejecutar el backend y su base de datos en contenedores
aislados, y de conectarlos por la red compartida; no es una dependencia del
front. Para este contrato REST no hace falta levantar RabbitMQ.


## Ejecución de implementación
### Comandos para **front-end**
1. Ingresar a directorio correspondiente al front-end: cd code/frontend
2. Instalar dependecias: npm install
3. Copiar `.env.example` a `.env.local` (PowerShell: `Copy-Item .env.example .env.local`).
4. Lanzar dependencias: npm run dev
5. Abrir http://localhost:3000/catalogo/evt-101/resenas para probar reseñas del evento de ejemplo.


### Comandos para **back-end**
**Requiere PostgreSQL instalado y una base de datos llamada `resenas` ya creada.**
1. Ingresar a directorio correspondiente al back-end: cd code/backend
2. Instalar dependecias: npm install
3. Crear el archivo `.env` a partir de `.env.example` y configurar PostgreSQL. Asegurarse de que exista la base `resenas`; `FRONTEND_ORIGIN` debe ser `http://localhost:3000`.
4. Ingresar los datos previos de pruebas a la base de datos: npm run db:init
5. Recargar los datos iniciales (opcional): npm run db:seed
6. Lanzar dependencias: npm start
**La API estará levantada en el puerto 5000**


### Comandos para probar el docker 
1. acceder a directorio cd Equipo6-resenas\code\backend
2. `Copy-Item .env.example .env -ErrorAction SilentlyContinue` para **`PowerShell`** o bien `copy .env.example .env` para **`CMD`** 
esto se encarga de guardar los datos del .env.example en .env para las variables de entorno e indica que ignore el error en caso de que el archivo ya este creado y continue ejecutando
3. docker network create plataforma-eventos-net     se crea la red virutal en donde se ejecutara
4. docker compose up --build -d      lee el archivo de docker-compuse.yml y los pone en marcha
5. docker compose ps     muestra la tabla del estado actual del docker
