# Equipo 6 Reseñas
 
Repositorio del proyecto **Reseñas**, desarrollado por el Grupo 6 del ramo **Taller de Integración Tecnológica I (TITEC)**.
 
## Integrantes
 
| Nombre | Correo | Rol |
|---|---|---|
| Vicente Cruces Collao | vicente.cruces@estudiantes.uv.cl | Integración |
| Constanza Díaz Pulgar | constanza.diazpu@estudiantes.uv.cl | Scrum Master; QA |
| Bruno González Luke | bruno.gonzalez@estudiantes.uv.cl | Frontend |
| Rodrigo Pino Araya | rodrigo.pino@estudiantes.uv.cl | Backend; Base de Datos |


## Entrega 02
### Responsabilidad
| Responsable | Item/s de rúbrica | Rol |
|---|---|---|
| Vicente Cruces Collao | BE1 | Backend (Integración) |
| Constanza Díaz Pulgar | GE1, CA1 | Gestión; QA |
| Bruno González Luke | UI1 | Frontend |
| Rodrigo Pino Araya | BE1, BD1 | Backend; Base de Datos |

### Integraciones
| Integración | Tipo (A, B o C) | Módulo contraparte | Servicio, endpoint o tópico | Contrato | Ítem en GitHub |
|---|---|---|---|---|---|
| I1 | A | Catálogo | `GET /eventos/{eventoId}` | [Contrato Catalogo de eventos](https://github.com/Equipo6-Resenas/Equipo6-resenas/blob/main/Contratos/Contrato%20Cat%C3%A1logo%20de%20eventos.md) | https://github.com/Equipo6-Resenas/Equipo6-resenas/issues/12 |
| I2 | B | Catálogo | `GET /resenas/evento/{eventoId}`| [Contrato Promedio Reseñas](https://github.com/Equipo6-Resenas/Equipo6-resenas/blob/main/Contratos/Contrato%20Catalogo%20Promedio%20Rese%C3%B1as.md) | https://github.com/Equipo6-Resenas/Equipo6-resenas/issues/16 |

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
