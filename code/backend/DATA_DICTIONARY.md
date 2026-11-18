# Diccionario de Datos - Tabla `resenas`

## Descripción
Tabla que almacena las reseñas realizadas por los usuarios sobre los eventos a los que han asistido.

## Estructura de la Tabla

| Columna | Tipo | Nulo | Clave | Por Defecto | Descripción |
|---------|------|------|-------|-------------|-------------|
| `num_resena` | SERIAL | NO | PK | nextval('resenas_num_resena_seq') | Identificador único autoincremental de la reseña |
| `id_usuario` | INTEGER | NO | FK | - | Referencia al usuario que realizó la reseña (FK a `usuarios.id`) |
| `id_evento` | TEXT | NO | FK | - | Referencia al evento reseñado (FK a `eventos.id_evento`) |
| `clasificacion` | INTEGER | NO | - | - | Calificación del 1 al 5 (CHECK constraint) |
| `descripcion` | VARCHAR(200) | SÍ | - | NULL | Comentario opcional del usuario (máx. 200 caracteres) |
| `imagen_url` | VARCHAR(500) | SÍ | - | NULL | URL/ruta de la imagen adjunta opcional (máx. 500 caracteres) |
| `fecha_reseña` | TIMESTAMP | NO | - | CURRENT_TIMESTAMP | Fecha y hora en que se creó la reseña |
| `respuesta_texto` | VARCHAR(200) | SÍ | - | NULL | Respuesta del organizador a la reseña (máx. 200 caracteres) |
| `respuesta_fecha` | TIMESTAMP | SÍ | - | NULL | Fecha y hora de la respuesta del organizador |
| `respuesta_id_usuario` | INTEGER | SÍ | FK | NULL | Referencia al organizador que respondió (FK a `usuarios.id`) |

## Restricciones

### Clave Primaria
- `pk_resenas`: `num_resena` - Identificador único

### Claves Foráneas
1. `fk_resenas_usuario`: `id_usuario` → `usuarios(id)` **ON DELETE CASCADE**
   - Si se elimina el usuario, sus reseñas se eliminan automáticamente
2. `fk_resenas_evento`: `id_evento` → `eventos(id_evento)` **ON DELETE CASCADE**
   - Si se elimina el evento, las reseñas asociadas se eliminan
3. `fk_resenas_respuesta_usuario`: `respuesta_id_usuario` → `usuarios(id)`
   - Referencia al organizador que respondió

### Restricciones de Validación
- `ck_resenas_clasificacion`: `clasificacion BETWEEN 1 AND 5` - La calificación debe estar entre 1 y 5

### Unicidad
- `uk_resenas_usuario_evento`: `UNIQUE (id_usuario, id_evento)` - Un usuario solo puede reseñar una vez por evento

### Índices
- `idx_resenas_usuario` ON `id_usuario` - Para búsquedas rápidas por usuario
- `idx_resenas_evento` ON `id_evento` - Para búsquedas rápidas por evento
- `idx_resenas_respuesta` ON `respuesta_id_usuario` - Para búsquedas por organizador que respondió

## Reglas de Negocio

1. **Check-in requerido**: Solo usuarios con asistencia confirmada (`asistencia_eventos`) pueden crear reseñas
2. **Una reseña por usuario por evento**: La restricción única lo impide a nivel de BD
3. **Imagen opcional**: La imagen es opcional; la calificación es obligatoria
4. **Validación de imagen**: Formatos JPG/PNG, máx. 5MB (validado en capa de servicio)
5. **Respuesta solo organizador**: Solo el organizador del evento puede responder a reseñas
6. **Eliminación condicional**: Solo se puede eliminar una reseña que haya sido reportada previamente

## Ejemplos de Datos

```sql
INSERT INTO resenas (id_usuario, id_evento, clasificacion, descripcion, imagen_url, fecha_reseña)
VALUES (1, 'evt-101', 5, 'Excelente organización y contenido.', '/uploads/resenas/abc123-def456.jpg', '2026-09-08 18:30:00');

INSERT INTO resenas (id_usuario, id_evento, clasificacion, descripcion, fecha_reseña)
VALUES (2, 'evt-101', 4, 'Muy buena experiencia.', '2026-09-05 12:00:00');
```

## Consultas Comunes

### Obtener reseñas de un evento con paginación
```sql
SELECT r.*, u.nombre AS nombre_usuario
FROM resenas r
JOIN usuarios u ON u.id = r.id_usuario
WHERE r.id_evento = 'evt-101'
ORDER BY r.fecha_reseña DESC
LIMIT 20 OFFSET 0;
```

### Obtener promedio de calificaciones por evento
```sql
SELECT COALESCE(AVG(clasificacion), 0) AS promedio
FROM resenas
WHERE id_evento = 'evt-101';
```

### Verificar si usuario ya reseñó un evento
```sql
SELECT 1 FROM resenas WHERE id_usuario = 1 AND id_evento = 'evt-101';
```