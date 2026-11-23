const { query } = require('../config/db');

const obtenerUsuarioPorId = async (idUsuario) => {
  const { rows } = await query(
    'SELECT id, nombre, email, creado_en FROM usuarios WHERE id = $1',
    [idUsuario]
  );
  return rows[0] || null;
};

const obtenerOCrearUsuarioAuth = async ({ authUuid, nombre }) => {
  const { rows } = await query(
    `INSERT INTO usuarios (auth_uuid, nombre)
     VALUES ($1, $2)
     ON CONFLICT (auth_uuid) DO UPDATE
       SET nombre = EXCLUDED.nombre
     RETURNING id, auth_uuid, nombre, email, creado_en`,
    [authUuid, nombre]
  );
  return rows[0];
};

const obtenerUsuarioPorAuthUuid = async (authUuid) => {
  const { rows } = await query(
    `SELECT id, auth_uuid, nombre, email, creado_en
     FROM usuarios
     WHERE auth_uuid = $1`,
    [authUuid]
  );
  return rows[0] || null;
};

module.exports = {
  obtenerUsuarioPorId,
  obtenerOCrearUsuarioAuth,
  obtenerUsuarioPorAuthUuid
};
