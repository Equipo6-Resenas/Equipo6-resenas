const { query } = require('../config/db');

const verificarAsistencia = async (idUsuario, idEvento) => {
  const { rows } = await query(
    `SELECT id_asistencia
     FROM asistencia_eventos
     WHERE id_usuario = $1 AND id_evento = $2`,
    [idUsuario, idEvento]
  );
  return rows.length > 0;
};

module.exports = {
  verificarAsistencia
};
