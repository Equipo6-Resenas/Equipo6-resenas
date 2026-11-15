const { query } = require('../config/db');

const obtenerUsuarioPorId = async (idUsuario) => {
  const { rows } = await query(
    'SELECT id, nombre, email, creado_en FROM usuarios WHERE id = $1',
    [idUsuario]
  );
  return rows[0] || null;
};

module.exports = {
  obtenerUsuarioPorId
};
