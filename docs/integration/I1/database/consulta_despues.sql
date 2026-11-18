SET TIME ZONE 'America/Santiago';
SELECT now() AS fecha_consulta;

SELECT num_resena, id_usuario, id_evento, clasificacion, descripcion, fecha_reseña
FROM resenas
WHERE id_evento = 'evt-102'
ORDER BY num_resena DESC;

-- Muestra que la reseña solo guarda el id del evento como referencia (BD1 d)
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'resenas'
ORDER BY ordinal_position;