SET TIME ZONE 'America/Santiago';
SELECT now() AS fecha_consulta;

SELECT id_evento, COUNT(*) AS total_antes
FROM resenas
WHERE id_evento = 'evt-102'
GROUP BY id_evento;

SELECT num_resena, id_usuario, clasificacion, descripcion
FROM resenas
WHERE id_evento = 'evt-102'
ORDER BY num_resena;