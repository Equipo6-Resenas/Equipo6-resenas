# Equipo 6 Reseñas
 
Repositorio del proyecto **Reseñas**, desarrollado por el Grupo 6 del ramo **Taller de Integración Tecnológica I (TITEC)**.
 
## Integrantes
 
| Nombre | Correo | Rol |
|---|---|---|
| Vicente Cruces Collao | vicente.cruces@estudiantes.uv.cl | Integración |
| Constanza Díaz Pulgar | constanza.diazpu@estudiantes.uv.cl | Scrum Master; QA |
| Bruno González Luke | bruno.gonzalez@estudiantes.uv.cl | Frontend |
| Rodrigo Pino Araya | rodrigo.pino@estudiantes.uv.cl | Backend; Base de Datos |


## Avance entrega 02

## Docentes
 
- Eliana Providel/Rodrigo Alfaro
- René Noël
- Sheyla Torres

## Dependencias de equipos 
- Check-in
- Catálogo de eventos

## Ejecución de implementación
### Comandos para **front-end**
1. Ingresar a directorio correspondiente al front-end: cd code/frontend
2. Instalar dependecias: npm install
3. Copiar `.env.example` a `.env.local` (PowerShell: `Copy-Item .env.example .env.local`).
4. Lanzar dependencias: npm run dev
5. Abrir http://localhost:3000/catalogo/1/resenas para probar reseñas del evento de ejemplo (ID 1).


### Comandos para **back-end**
**Requiere PostgreSQL instalado y una base de datos llamada `resenas` ya creada.**
1. Ingresar a directorio correspondiente al back-end: cd code/backend
2. Instalar dependecias: npm install
3. Crear el archivo `.env` a partir de `.env.example` y configurar PostgreSQL. Asegurarse de que exista la base `resenas`; `FRONTEND_ORIGIN` debe ser `http://localhost:3000`.
4. Ingresar los datos previos de pruebas a la base de datos: npm run db:init
5. Recargar los datos iniciales (opcional): npm run db:seed
6. Lanzar dependencias: npm start
**La API estará levantada en el puerto 5000**
