INSERT INTO usuarios (id, nombre, email, creado_en) VALUES
    (1, 'Ana Lopez',      'ana.lopez@tec.mx',      '2026-01-10 09:00:00'),
    (2, 'Carlos Ramirez', 'carlos.ramirez@tec.mx', '2026-01-12 14:30:00'),
    (3, 'Maria Gonzalez', 'maria.gonzalez@tec.mx', '2026-02-01 11:15:00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO eventos (id_evento, nombre_evento, descripcion_evento, fecha_evento, id_organizador) VALUES
    ('evt-101', 'Taller de Inteligencia Artificial', 'Sesion practica de machine learning aplicada',   '2026-03-05 18:00:00', 1),
    ('evt-102', 'Conferencia de Ciberseguridad',    'Charlas sobre proteccion de datos y amenazas',   '2026-04-12 10:00:00', 1),
    ('evt-103', 'Hackathon TITEC 2026',              'Competencia de programacion de 48 horas',       '2026-05-20 08:00:00', 2)
ON CONFLICT (id_evento) DO NOTHING;

INSERT INTO asistencia_eventos (id_asistencia, id_usuario, id_evento, fecha_asistencia) VALUES
    (1, 1, 'evt-101', '2026-03-05 18:30:00'),
    (2, 1, 'evt-102', '2026-04-12 10:20:00'),
    (3, 2, 'evt-101', '2026-03-05 19:00:00')
ON CONFLICT (id_asistencia) DO NOTHING;

INSERT INTO resenas (num_resena, id_usuario, id_evento, clasificacion, descripcion, fecha_reseña) VALUES
    (1, 1, 'evt-101', 5, 'Excelente organizacion y contenido.', '2026-09-08 18:30:00'),
    (2, 2, 'evt-101', 4, 'Muy buena experiencia, aunque inicio tarde.', '2026-09-05 12:00:00'),
    (3, 3, 'evt-102', 5, 'Tema muy actualizado y ponentes claros.', '2026-09-07 15:00:00')
ON CONFLICT (num_resena) DO NOTHING;

SELECT setval(pg_get_serial_sequence('usuarios', 'id'),                COALESCE((SELECT MAX(id) FROM usuarios), 1),                EXISTS(SELECT 1 FROM usuarios));
SELECT setval(pg_get_serial_sequence('asistencia_eventos', 'id_asistencia'), COALESCE((SELECT MAX(id_asistencia) FROM asistencia_eventos), 1), EXISTS(SELECT 1 FROM asistencia_eventos));
SELECT setval(pg_get_serial_sequence('resenas', 'num_resena'),        COALESCE((SELECT MAX(num_resena) FROM resenas), 1),        EXISTS(SELECT 1 FROM resenas));