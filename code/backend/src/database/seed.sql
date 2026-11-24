INSERT INTO usuarios (id, nombre, email, creado_en) VALUES
    (1, 'Ana Lopez',         'ana.lopez@tec.mx',         '2026-01-10 09:00:00'),
    (2, 'Carlos Ramirez',    'carlos.ramirez@tec.mx',    '2026-01-12 14:30:00'),
    (3, 'Maria Gonzalez',    'maria.gonzalez@tec.mx',    '2026-02-01 11:15:00'),
    (4, 'Luis Hernandez',    'luis.hernandez@tec.mx',    '2026-02-15 10:00:00'),
    (5, 'Sofia Martinez',    'sofia.martinez@tec.mx',    '2026-02-20 16:30:00'),
    (6, 'Jorge Torres',      'jorge.torres@tec.mx',      '2026-03-01 09:45:00'),
    (7, 'Lucia Fernandez',   'lucia.fernandez@tec.mx',   '2026-03-05 14:20:00'),
    (8, 'Pedro Sanchez',     'pedro.sanchez@tec.mx',     '2026-03-10 11:00:00'),
    (9, 'Isabel Ramirez',    'isabel.ramirez@tec.mx',    '2026-03-15 13:30:00'),
    (10, 'Miguel Ortiz',     'miguel.ortiz@tec.mx',      '2026-03-20 15:45:00')
ON CONFLICT (id) DO NOTHING;

INSERT INTO eventos (id_evento, nombre_evento, descripcion_evento, fecha_evento, id_organizador) VALUES
    ('evt-1',   'Bienvenida TITEC 2026',                'Evento inaugural del semestre con presentacion de actividades', '2026-01-20 10:00:00', 1),
    ('evt-101', 'Taller de Inteligencia Artificial',    'Sesion practica de machine learning aplicada',                '2026-03-05 18:00:00', 1),
    ('evt-102', 'Conferencia de Ciberseguridad',        'Charlas sobre proteccion de datos y amenazas',                '2026-04-12 10:00:00', 2),
    ('evt-103', 'Hackathon TITEC 2026',                 'Competencia de programacion de 48 horas',                   '2026-05-20 08:00:00', 3),
    ('evt-104', 'Seminario de Computacion en la Nube',  'Introduccion a AWS, Azure y GCP con demos practicas',        '2026-06-10 14:00:00', 4),
    ('evt-105', 'Workshop de Desarrollo Movil',         'Creacion de apps multiplataforma con Flutter y React Native',  '2026-07-15 16:00:00', 5),
    ('evt-106', 'Mesa Redonda: Etica en la IA',         'Debate sobre sesgos, privacidad y responsabilidad en IA',      '2026-08-05 18:30:00', 6),
    ('evt-107', 'Bootcamp de DevOps',                   'CI/CD, contenedores, Kubernetes y infraestructura como codigo',  '2026-09-12 09:00:00', 7),
    ('evt-108', 'Feria de Proyectos Estudiantiles',     'Exposicion de proyectos finales de ingenieria y ciencias',     '2026-10-25 10:00:00', 8),
    ('evt-109', 'Conferencia de Blockchain',            'Fundamentos, contratos inteligentes y Web3',                  '2026-11-08 11:00:00', 9),
    ('evt-110', 'Clausura TITEC 2026',                  'Ceremonia de cierre, premiaciones y networking',              '2026-12-05 17:00:00', 10)
ON CONFLICT (id_evento) DO NOTHING;

INSERT INTO asistencia_eventos (id_asistencia, id_usuario, id_evento, fecha_asistencia) VALUES
    (1,  1, 'evt-1',   '2026-01-20 10:15:00'),
    (2,  2, 'evt-1',   '2026-01-20 10:10:00'),
    (3,  3, 'evt-1',   '2026-01-20 10:20:00'),
    (4,  4, 'evt-1',   '2026-01-20 10:05:00'),
    (5,  1, 'evt-101', '2026-03-05 18:30:00'),
    (6,  2, 'evt-101', '2026-03-05 18:25:00'),
    (7,  3, 'evt-101', '2026-03-05 19:00:00'),
    (8,  4, 'evt-101', '2026-03-05 18:35:00'),
    (9,  5, 'evt-101', '2026-03-05 18:40:00'),
    (10, 1, 'evt-102', '2026-04-12 10:20:00'),
    (11, 3, 'evt-102', '2026-04-12 10:15:00'),
    (12, 6, 'evt-102', '2026-04-12 10:30:00'),
    (13, 2, 'evt-103', '2026-05-20 08:10:00'),
    (14, 4, 'evt-103', '2026-05-20 08:05:00'),
    (15, 7, 'evt-103', '2026-05-20 08:15:00'),
    (16, 8, 'evt-103', '2026-05-20 08:20:00'),
    (17, 3, 'evt-104', '2026-06-10 14:10:00'),
    (18, 5, 'evt-104', '2026-06-10 14:05:00'),
    (19, 9, 'evt-104', '2026-06-10 14:15:00'),
    (20, 1, 'evt-105', '2026-07-15 16:10:00'),
    (21, 6, 'evt-105', '2026-07-15 16:05:00'),
    (22, 2, 'evt-106', '2026-08-05 18:40:00'),
    (23, 7, 'evt-106', '2026-08-05 18:35:00'),
    (24, 8, 'evt-106', '2026-08-05 18:45:00'),
    (25, 4, 'evt-107', '2026-09-12 09:10:00'),
    (26, 9, 'evt-107', '2026-09-12 09:05:00'),
    (27, 10, 'evt-107', '2026-09-12 09:15:00'),
    (28, 5, 'evt-108', '2026-10-25 10:10:00'),
    (29, 6, 'evt-108', '2026-10-25 10:15:00'),
    (30, 7, 'evt-109', '2026-11-08 11:10:00'),
    (31, 1, 'evt-110', '2026-12-05 17:10:00'),
    (32, 2, 'evt-110', '2026-12-05 17:05:00'),
    (33, 3, 'evt-110', '2026-12-05 17:15:00')
ON CONFLICT (id_asistencia) DO NOTHING;

INSERT INTO resenas (num_resena, id_usuario, id_evento, clasificacion, descripcion, fecha_reseña) VALUES
    -- evt-1: Bienvenida TITEC 2026 - Promedio ~3.75 (bueno pero no excelente)
    (1,  1, 'evt-1',   4, 'Buen inicio de semestre, motivador.',                           '2026-01-22 10:00:00'),
    (2,  2, 'evt-1',   3, 'Bienvenida correcta, aunque se hizo larga.',                    '2026-01-21 15:30:00'),
    (3,  3, 'evt-1',   5, 'Me encanto la energia del evento inaugural.',                   '2026-01-23 09:15:00'),
    (4,  4, 'evt-1',   3, 'Esperaba mas actividades interactivas.',                        '2026-01-24 11:00:00'),
    -- evt-101: Taller IA - Promedio ~4.6 (muy alto)
    (5,  1, 'evt-101', 5, 'Excelente organizacion y contenido de primer nivel.',           '2026-09-08 18:30:00'),
    (6,  2, 'evt-101', 4, 'Muy buena experiencia, aunque inicio tarde.',                   '2026-09-05 12:00:00'),
    (7,  3, 'evt-101', 5, 'Los ejercicios practicos fueron muy utiles y claros.',          '2026-09-07 15:00:00'),
    (8,  4, 'evt-101', 5, 'Mejor taller del semestre, instructores expertos.',             '2026-09-06 10:30:00'),
    (9,  5, 'evt-101', 4, 'Instructores muy preparados y pacientes.',                      '2026-09-09 14:00:00'),
    -- evt-102: Ciberseguridad - Promedio ~3.0 (medio/bajo)
    (10, 3, 'evt-102', 3, 'Tema interesante pero muy teorico, pocas demos.',               '2026-09-07 15:00:00'),
    (11, 1, 'evt-102', 2, 'Falto profundidad tecnica, muy basico.',                        '2026-09-08 11:00:00'),
    (12, 6, 'evt-102', 4, 'Me ayudo a entender mejor la seguridad basica.',                '2026-09-10 09:00:00'),
    -- evt-103: Hackathon - Promedio ~4.25 (alto)
    (13, 2, 'evt-103', 5, 'El hackathon fue increible, gran experiencia completa.',        '2026-09-12 16:00:00'),
    (14, 4, 'evt-103', 4, 'Muy intenso pero vale totalmente la pena.',                     '2026-09-11 13:00:00'),
    (15, 7, 'evt-103', 5, 'Gane el segundo lugar, excelente organizacion.',                '2026-09-13 10:00:00'),
    (16, 8, 'evt-103', 3, 'Bien organizado pero las comidas podrian mejorar.',             '2026-09-14 11:00:00'),
    -- evt-104: Cloud - Promedio ~2.75 (bajo)
    (17, 3, 'evt-104', 3, 'Seminario aceptable, pero muy enfocado solo en AWS.',           '2026-09-15 14:00:00'),
    (18, 5, 'evt-104', 2, 'Pocos ejemplos practicos, mucha teoria.',                       '2026-09-16 09:00:00'),
    (19, 9, 'evt-104', 3, 'Los laboratorios fallaban mucho, frustrante.',                  '2026-09-17 11:00:00'),
    -- evt-105: Movil - Promedio ~3.5 (medio)
    (20, 1, 'evt-105', 4, 'Workshop entretenido y practico, buen ritmo.',                  '2026-09-18 16:00:00'),
    (21, 6, 'evt-105', 3, 'Flutter bien pero React Native se explico muy rapido.',         '2026-09-19 10:00:00'),
    -- evt-106: Ética IA - Promedio ~4.0 (bueno)
    (22, 2, 'evt-106', 4, 'Debate muy necesario y bien moderado.',                         '2026-09-20 14:00:00'),
    (23, 7, 'evt-106', 4, 'Interesante, aunque falto tiempo para preguntas.',             '2026-09-21 12:00:00'),
    (24, 8, 'evt-106', 4, 'Me hizo reflexionar mucho sobre el tema.',                      '2026-09-22 15:00:00'),
    -- evt-107: DevOps - Promedio ~4.67 (muy alto)
    (25, 4, 'evt-107', 5, 'Bootcamp muy completo, aprendi Kubernetes de verdad.',          '2026-09-23 17:00:00'),
    (26, 9, 'evt-107', 4, 'Intenso pero muy bien explicado, buenos laboratorios.',         '2026-09-24 10:00:00'),
    (27, 10, 'evt-107', 5, 'Ahora entiendo CI/CD mucho mejor, mejor bootcamp.',            '2026-09-25 11:00:00'),
    -- evt-108: Feria Proyectos - Promedio ~3.5 (medio)
    (28, 5, 'evt-108', 4, 'Ver los proyectos de compañeros fue inspirador.',               '2026-09-26 12:00:00'),
    (29, 6, 'evt-108', 3, 'Buena feria pero habia poca variedad de temas.',                '2026-09-27 14:00:00'),
    -- evt-109: Blockchain - Promedio ~2.5 (bajo)
    (30, 7, 'evt-109', 2, 'Muy basico, no profundizaron en contratos inteligentes.',       '2026-09-28 16:00:00'),
    (31, 1, 'evt-109', 3, 'Blockchain explicado sencillo pero falto parte tecnica.',       '2026-09-29 10:00:00'),
    -- evt-110: Clausura - Promedio ~4.33 (alto)
    (32, 2, 'evt-110', 5, 'Hermosa clausura, gran cierre de semestre.',                    '2026-12-07 10:00:00'),
    (33, 3, 'evt-110', 4, 'Muy emotiva la premiacion, buen cierre.',                       '2026-12-08 09:00:00'),
    (34, 1, 'evt-110', 4, 'Perfecto final para un gran año en TITEC.',                     '2026-12-09 11:00:00')
ON CONFLICT (num_resena) DO NOTHING;

SELECT setval(pg_get_serial_sequence('usuarios', 'id'),                 COALESCE((SELECT MAX(id) FROM usuarios), 1),                 EXISTS(SELECT 1 FROM usuarios));
SELECT setval(pg_get_serial_sequence('asistencia_eventos', 'id_asistencia'), COALESCE((SELECT MAX(id_asistencia) FROM asistencia_eventos), 1), EXISTS(SELECT 1 FROM asistencia_eventos));
SELECT setval(pg_get_serial_sequence('resenas', 'num_resena'),          COALESCE((SELECT MAX(num_resena) FROM resenas), 1),          EXISTS(SELECT 1 FROM resenas));