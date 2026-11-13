# Diccionario de Datos - Tabla `reportes_resenas`

## Descripción
Tabla que almacena los reportes realizados por organizadores de eventos sobre reseñas que consideran falsas, injustas u ofensivas.

## Estructura de la Tabla

| Columna | Tipo | Nulo | Clave | Por Defecto | Descripción |
|---------|------|------|-------|-------------|-------------|
| `id_reporte` | SERIAL | NO | PK | nextval('reportes_resenas_id_reporte_seq') | Identificador único autoincremental del reporte |
| `num_resena` | INTEGER | NO | FK | - | Referencia a la reseña reportada (FK a `resenas.num_resena`) |
| `id_evento` | TEXT | NO | FK | - | Referencia al evento al que pertenece la reseña (FK a `eventos.id_evento`) |
| `id_organizador` | INTEGER | NO | FK | - | Referencia al organizador que realiza el reporte (FK a `usuarios.id`) |
| `motivo` | VARCHAR(500) | NO | - | - | Motivo del reporte (máximo 500 caracteres) |
| `fecha_reporte` | TIMESTAMP | NO | - | CURRENT_TIMESTAMP | Fecha y hora en que se realizó el reporte |

## Restricciones

### Clave Primaria
- `pk_reportes_resenas`: `id_reporte` - Identificador único

### Claves Foráneas
1. `fk_reportes_resena`: `num_resena` → `resenas(num_resena)` **ON DELETE CASCADE**
   - Si se elimina la reseña, el reporte se elimina automáticamente
2. `fk_reportes_evento`: `id_evento` → `eventos(id_evento)` **ON DELETE CASCADE**
   - Si se elimina el evento, los reportes asociados se eliminan
3. `fk_reportes_organizador`: `id_organizador` → `usuarios(id)` **ON DELETE CASCADE**
   - Si se elimina el usuario organizador, sus reportes se eliminan

### Índices
- `idx_reportes_resena` ON `num_resena` - Para búsquedas rápidas por reseña
- `idx_reportes_evento` ON `id_evento` - Para búsquedas rápidas por evento

## Reglas de Negocio

1. **Unicidad implícita**: Una reseña solo puede ser reportada una vez (validado en capa de servicio)
2. **Autorización**: Solo el organizador del evento puede reportar reseñas de su evento
3. **Eliminación en cascada**: Al eliminar una reseña, su reporte asociado se elimina automáticamente
4. **Eliminación condicional**: Solo se puede eliminar una reseña que haya sido reportada previamente

## Ejemplos de Datos

```sql
INSERT INTO reportes_resenas (num_resena, id_evento, id_organizador, motivo, fecha_reporte)
VALUES (2, 'evt-101', 1, 'Contenido ofensivo e inapropiado', '2026-09-10 10:00:00');
```

## Consultas Comunes

### Obtener reporte por reseña
```sql
SELECT * FROM reportes_resenas WHERE num_resena = 2;
```

### Obtener reportes por evento
```sql
SELECT * FROM reportes_resenas WHERE id_evento = 'evt-101';
```

### Obtener reportes por organizador
```sql
SELECT * FROM reportes_resenas WHERE id_organizador = 1;
```