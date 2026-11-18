const validarCrearResena = (datos) => {
  const errores = [];

  if (!datos || typeof datos !== 'object' || Array.isArray(datos)) {
    const error = new Error('El cuerpo debe ser un objeto JSON');
    error.statusCode = 400;
    throw error;
  }

  if (Object.prototype.hasOwnProperty.call(datos, 'id_usuario')) {
    errores.push('id_usuario no se acepta; la identidad se obtiene de la sesión Auth');
  }

  if (
    typeof datos.id_evento !== 'string' ||
    datos.id_evento.trim() !== datos.id_evento ||
    datos.id_evento.length === 0 ||
    datos.id_evento.length > 64
  ) {
    errores.push('id_evento es obligatorio y debe ser un identificador de hasta 64 caracteres');
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
