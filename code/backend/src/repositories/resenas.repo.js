const { query } = require('../config/db');

const SELECT_RESENAS = `
    SELECT r.num_resena,
           r.id_usuario,
           r.id_evento,
           r.clasificacion,
           r.descripcion,
           r.fecha_reseña,
           u.nombre AS nombre_usuario,
           e.nombre_evento AS nombre_evento
    FROM resenas r
    JOIN usuarios u ON u.id = r.id_usuario
    JOIN eventos  e ON e.id_evento = r.id_evento
`;

const crearResena = async ({ id_usuario, id_evento, clasificacion, descripcion }) => {
  const { rows } = await query(
    `INSERT INTO resenas (id_usuario, id_evento, clasificacion, descripcion)
     VALUES ($1, $2, $3, $4)
     RETURNING num_resena, id_usuario, id_evento, clasificacion, descripcion, fecha_reseña`,
    [id_usuario, id_evento, clasificacion, descripcion]
  );
  return rows[0];
};

const listarResenas = async (filtros = {}) => {
  const condiciones = [];
  const valores = [];

  const agregarFiltro = (columna, valor) => {
    valores.push(valor);
    condiciones.push(`${columna} = $${valores.length}`);
  };

  if (filtros.id_usuario !== undefined) agregarFiltro('r.id_usuario', filtros.id_usuario);
  if (filtros.id_evento !== undefined) agregarFiltro('r.id_evento', filtros.id_evento);
  if (filtros.clasificacion !== undefined) agregarFiltro('r.clasificacion', filtros.clasificacion);

  const where = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

  const { rows } = await query(
    `${SELECT_RESENAS} ${where} ORDER BY r.num_resena ASC`,
    valores
  );
  return rows;
};

module.exports = {
  crearResena,
  listarResenas
};
