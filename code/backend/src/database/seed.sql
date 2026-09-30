INSERT INTO usuarios (id, nombre, email, creado_en) VALUES
    (1, 'Ana Lopez',      'ana.lopez@tec.mx',      '2026-01-10 09:00:00'),
    (2, 'Carlos Ramirez', 'carlos.ramirez@tec.mx', '2026-01-12 14:30:00'),
    (3, 'Maria Gonzalez', 'maria.gonzalez@tec.mx', '2026-02-01 11:15:00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO eventos (id_evento, nombre_evento, descripcion_evento, fecha_evento) VALUES
    (1, 'Taller de Inteligencia Artificial', 'Sesion practica de machine learning aplicada',   '2026-03-05 18:00:00'),
    (2, 'Conferencia de Ciberseguridad',    'Charlas sobre proteccion de datos y amenazas',   '2026-04-12 10:00:00'),
    (3, 'Hackathon TITEC 2026',              'Competencia de programacion de 48 horas',       '2026-05-20 08:00:00')
ON CONFLICT (id_evento) DO NOTHING;

INSERT INTO asistencia_eventos (id_asistencia, id_usuario, id_evento, fecha_asistencia) VALUES
    (1, 1, 1, '2026-03-05 18:30:00'),
    (2, 1, 2, '2026-04-12 10:20:00'),
    (3, 2, 1, '2026-03-05 19:00:00')
ON CONFLICT (id_asistencia) DO NOTHING;

SELECT setval(pg_get_serial_sequence('usuarios', 'id'),                COALESCE((SELECT MAX(id) FROM usuarios), 1),                EXISTS(SELECT 1 FROM usuarios));
SELECT setval(pg_get_serial_sequence('eventos', 'id_evento'),         COALESCE((SELECT MAX(id_evento) FROM eventos), 1),         EXISTS(SELECT 1 FROM eventos));
SELECT setval(pg_get_serial_sequence('asistencia_eventos', 'id_asistencia'), COALESCE((SELECT MAX(id_asistencia) FROM asistencia_eventos), 1), EXISTS(SELECT 1 FROM asistencia_eventos));
SELECT setval(pg_get_serial_sequence('resenas', 'num_resena'),        COALESCE((SELECT MAX(num_resena) FROM resenas), 1),        EXISTS(SELECT 1 FROM resenas));
