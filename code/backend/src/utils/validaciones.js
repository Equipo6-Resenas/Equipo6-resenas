const validarCrearResena = (datos) => {
  const errores = [];

  if (!datos.id_usuario || typeof datos.id_usuario !== 'number') {
    errores.push('id_usuario es obligatorio y debe ser un numero entero');
  }

  if (!datos.id_evento || typeof datos.id_evento !== 'number') {
    errores.push('id_evento es obligatorio y debe ser un numero entero');
  }

  if (!datos.clasificacion || typeof datos.clasificacion !== 'number' ||
      datos.clasificacion < 1 || datos.clasificacion > 5) {
    errores.push('clasificacion es obligatoria y debe estar entre 1 y 5');
  }

  if (datos.descripcion !== undefined && datos.descripcion !== null) {
    if (typeof datos.descripcion !== 'string') {
      errores.push('descripcion debe ser texto');
    } else if (datos.descripcion.length > 1000) {
      errores.push('descripcion no puede superar los 1000 caracteres');
    }
  }

  if (errores.length > 0) {
    const error = new Error(errores.join(', '));
    error.statusCode = 400;
    throw error;
  }
};

const normalizarDescripcion = (descripcion) => {
  if (descripcion === undefined || descripcion === null) return null;
  const limpia = String(descripcion).trim();
  return limpia.length === 0 ? null : limpia;
};

module.exports = {
  validarCrearResena,
  normalizarDescripcion
};
