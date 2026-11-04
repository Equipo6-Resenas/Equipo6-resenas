SELECT now() AT TIME ZONE 'America/Santiago' AS fecha_consulta_chile;

SELECT id_evento, COUNT(*) AS total_resenas, ROUND(AVG(clasificacion), 1) AS promedio
FROM resenas
WHERE id_evento = 'evt-101'
GROUP BY id_evento;

SELECT num_resena, id_usuario, id_evento, clasificacion, descripcion
FROM resenas
WHERE id_evento = 'evt-101'
ORDER BY fecha_reseña DESC;