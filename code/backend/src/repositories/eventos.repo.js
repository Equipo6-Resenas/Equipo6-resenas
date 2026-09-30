const { query } = require('../config/db');

const obtenerEventoPorId = async (idEvento) => {
  const { rows } = await query(
    `SELECT id_evento, nombre_evento, descripcion_evento, fecha_evento
     FROM eventos
     WHERE id_evento = $1`,
    [idEvento]
  );
  return rows[0] || null;
};

module.exports = {
  obtenerEventoPorId
};
