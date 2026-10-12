const { query } = require('../config/db');

const SELECT_RESENAS = `
    SELECT r.num_resena,
           r.id_usuario,
           r.id_evento,
           r.clasificacion,
           r.descripcion,
           r.fecha_reseña,
           u.nombre AS nombre_usuario,
           e.nombre_evento AS nombre_evento,
           r.respuesta_texto,
           r.respuesta_fecha,
           ru.nombre AS nombre_responsable
    FROM resenas r
    JOIN usuarios u ON u.id = r.id_usuario
    JOIN eventos  e ON e.id_evento = r.id_evento
    LEFT JOIN usuarios ru ON ru.id = r.respuesta_id_usuario
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

const listarResenas = async (filtros = {}, orden = 'fecha_reseña DESC') => {
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
    `${SELECT_RESENAS} ${where} ORDER BY ${orden}`,
    valores
  );
  return rows;
};

const obtenerPromedioPorEvento = async (idEvento) => {
  const { rows } = await query(
    `SELECT COALESCE(AVG(clasificacion), 0) AS promedio
     FROM resenas
     WHERE id_evento = $1`,
    [idEvento]
  );
  return parseFloat(rows[0].promedio);
};

const obtenerResenaPorId = async (idResena) => {
  const { rows } = await query(
    `${SELECT_RESENAS} WHERE r.num_resena = $1`,
    [idResena]
  );
  return rows[0] || null;
};

const actualizarRespuesta = async ({ idResena, textoRespuesta, idUsuarioResponsable }) => {
  const { rows } = await query(
    `UPDATE resenas
     SET respuesta_texto = $1,
         respuesta_fecha = CURRENT_TIMESTAMP,
         respuesta_id_usuario = $2
     WHERE num_resena = $3
     RETURNING num_resena, respuesta_texto, respuesta_fecha, respuesta_id_usuario`,
    [textoRespuesta, idUsuarioResponsable, idResena]
  );
  return rows[0];
};

module.exports = {
  crearResena,
  listarResenas,
  obtenerPromedioPorEvento,
  obtenerResenaPorId,
  actualizarRespuesta
};