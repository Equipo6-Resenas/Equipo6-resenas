CREATE TABLE IF NOT EXISTS usuarios (
    id        SERIAL PRIMARY KEY,
    nombre    TEXT NOT NULL,
    email     TEXT UNIQUE NOT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS eventos (
    id_evento          SERIAL PRIMARY KEY,
    nombre_evento      TEXT NOT NULL,
    descripcion_evento TEXT NOT NULL,
    fecha_evento       TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS resenas (
    num_resena    SERIAL PRIMARY KEY,
    id_usuario    INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    id_evento     INTEGER NOT NULL REFERENCES eventos(id_evento) ON DELETE CASCADE,
    clasificacion INTEGER NOT NULL CHECK (clasificacion BETWEEN 1 AND 5),
    descripcion   TEXT,
    fecha_reseña  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id_usuario, id_evento)
);

CREATE TABLE IF NOT EXISTS asistencia_eventos (
    id_asistencia    SERIAL PRIMARY KEY,
    id_usuario       INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    id_evento        INTEGER NOT NULL REFERENCES eventos(id_evento) ON DELETE CASCADE,
    fecha_asistencia TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (id_usuario, id_evento)
);

CREATE INDEX IF NOT EXISTS idx_resenas_usuario ON resenas(id_usuario);
CREATE INDEX IF NOT EXISTS idx_resenas_evento ON resenas(id_evento);
CREATE INDEX IF NOT EXISTS idx_asistencia_usuario ON asistencia_eventos(id_usuario);
CREATE INDEX IF NOT EXISTS idx_asistencia_evento ON asistencia_eventos(id_evento);
