const { query } = require('../config/db');

const obtenerEventoPorId = async (idEvento) => {
  const { rows } = await query(
    `SELECT id_evento, nombre_evento, descripcion_evento, fecha_evento, id_organizador
     FROM eventos
     WHERE id_evento = $1`,
    [idEvento]
  );
  return rows[0] || null;
};

const sincronizarEventoDelCatalogo = async ({ eventoId, nombre, fecha }) => {
  const { rows } = await query(
    `INSERT INTO eventos (id_evento, nombre_evento, descripcion_evento, fecha_evento)
     VALUES ($1, $2, '', $3)
     ON CONFLICT (id_evento) DO UPDATE
       SET nombre_evento = EXCLUDED.nombre_evento,
           fecha_evento = EXCLUDED.fecha_evento
     RETURNING id_evento, nombre_evento, fecha_evento, id_organizador`,
    [eventoId, nombre, fecha]
  );
  return rows[0];
};

module.exports = {
  obtenerEventoPorId,
  sincronizarEventoDelCatalogo
};