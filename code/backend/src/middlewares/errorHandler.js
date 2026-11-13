const CODIGOS_PG = {
  ECONNREFUSED: { status: 503, mensaje: 'Base de datos no disponible' },
  '23505': { status: 409, mensaje: 'El registro ya existe' },
  '23503': { status: 404, mensaje: 'Referencia no encontrada' },
  '23514': { status: 400, mensaje: 'Dato fuera de rango permitido' }
};

const errorHandler = (err, req, res, next) => {
  let statusCode;
  let mensaje;

  if (err.statusCode) {
    statusCode = err.statusCode;
    mensaje = err.message;
  } else if (CODIGOS_PG[err.code]) {
    const clasificado = CODIGOS_PG[err.code];
    statusCode = clasificado.status;
    mensaje = clasificado.mensaje;
  } else {
    statusCode = 500;
    mensaje = 'Error interno del servidor';
    console.error('Error no controlado:', err);
  }

  return res.status(statusCode).json({ error: mensaje });
};

module.exports = errorHandler;
