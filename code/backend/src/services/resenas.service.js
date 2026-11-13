const { validarCrearResena, normalizarDescripcion, validarReporteResena, validarEliminarResena } = require('../utils/validaciones');
const usuariosRepo = require('../repositories/usuarios.repo');
const eventosRepo = require('../repositories/eventos.repo');
const asistenciaRepo = require('../repositories/asistencia.repo');
const resenasRepo = require('../repositories/resenas.repo');
const catalogoService = require('./catalogo.service');

const crearResena = async (datos) => {
  const { id_usuario, id_evento, clasificacion, descripcion } = datos;

  validarCrearResena(datos);

  await catalogoService.obtenerEventoDelCatalogo(id_evento);

  const usuario = await usuariosRepo.obtenerUsuarioPorId(id_usuario);
  if (!usuario) {
    const error = new Error('Usuario no encontrado');
    error.statusCode = 404;
    throw error;
  }

  const evento = await eventosRepo.obtenerEventoPorId(id_evento);
  if (!evento) {
    const error = new Error('Evento no encontrado');
    error.statusCode = 404;
    throw error;
  }

  const asistio = await asistenciaRepo.verificarAsistencia(id_usuario, id_evento);
  if (!asistio) {
    const error = new Error('El usuario no asistio al evento');
    error.statusCode = 403;
    throw error;
  }

  const existentes = await resenasRepo.listarResenas({ id_usuario, id_evento });
  if (existentes.length > 0) {
    const error = new Error('El usuario ya realizo una resena para este evento');
    error.statusCode = 409;
    throw error;
  }

  const nuevaResena = await resenasRepo.crearResena({
    id_usuario,
    id_evento,
    clasificacion,
    descripcion: normalizarDescripcion(descripcion)
  });

  return {
    ...nuevaResena,
    nombre_usuario: usuario.nombre,
    nombre_evento: evento.nombre_evento,
    fecha_evento: evento.fecha_evento
  };
};

const listarResenas = async (filtros = {}) => {
  return resenasRepo.listarResenas(filtros);
};

const obtenerPromedioPorEvento = async (idEvento) => {
  const promedio = await resenasRepo.obtenerPromedioPorEvento(idEvento);
  return { promedio };
};

const obtenerResenasPorEvento = async (idEvento, pagina = 1, tamano = 20) => {
  const resumen = await resenasRepo.obtenerResumenPorEvento(idEvento, pagina, tamano);

  return {
    id_evento: idEvento,
    promedio: resumen.promedio,
    total_resenas: resumen.total,
    resenas: resumen.resenas.map((resena) => {
      const item = {
        usuario_id: String(resena.id_usuario),
        calificacion: resena.clasificacion,
        fecha: new Date(resena.fecha_reseña).toISOString()
      };
      if (resena.descripcion !== null) item.comentario = resena.descripcion;
      return item;
    })
  };
};

const crearRespuesta = async ({ id_resena, texto }, idUsuarioAutenticado) => {
  // Validar entrada
  if (!id_resena || !texto || texto.trim() === '') {
    const error = new Error('ID de reseña y texto de respuesta son requeridos');
    error.statusCode = 400;
    throw error;
  }

  // Obtener la reseña para verificar existencia y obtener id_evento
  const resena = await resenasRepo.obtenerResenaPorId(id_resena);
  if (!resena) {
    const error = new Error('Reseña no encontrada');
    error.statusCode = 404;
    throw error;
  }

  // Obtener el evento para verificar el organizador
  const evento = await eventosRepo.obtenerEventoPorId(resena.id_evento);
  if (!evento) {
    const error = new Error('Evento asociado a la reseña no encontrado');
    error.statusCode = 404;
    throw error;
  }

  // Verificar que el usuario autenticado sea el organizador del evento
  if (evento.id_organizador !== idUsuarioAutenticado) {
    const error = new Error('Solo el organizador del evento puede responder a la reseña');
    error.statusCode = 403;
    throw error;
  }

  // Actualizar la reseña con la respuesta
  const respuestaActualizada = await resenasRepo.actualizarRespuesta({
    idResena: Number(id_resena),
    textoRespuesta: texto.trim(),
    idUsuarioResponsable: idUsuarioAutenticado
  });

  // Obtener nombre del usuario que respondió (organizador)
  const usuario = await usuariosRepo.obtenerUsuarioPorId(idUsuarioAutenticado);
  const nombreResponsable = usuario ? usuario.nombre : null;

  return {
    id: respuestaActualizada.num_resena, // para mantener compatibilidad con la respuesta anterior
    id_resena: respuestaActualizada.num_resena,
    id_usuario: respuestaActualizada.respuesta_id_usuario,
    texto: respuestaActualizada.respuesta_texto,
    fecha_respuesta: respuestaActualizada.respuesta_fecha,
    nombre_responsable: nombreResponsable
  };
};

// --- New methods for reporting and deleting reviews ---

const reportarResena = async ({ num_resena, id_evento, id_organizador, motivo }) => {
  // Validate input
  validarReporteResena({ motivo });

  // Obtener la reseña para verificar existencia
  const resena = await resenasRepo.obtenerResenaPorId(num_resena);
  if (!resena) {
    const error = new Error('Reseña no encontrada');
    error.statusCode = 404;
    throw error;
  }

  // Verificar que la reseña pertenezca al evento indicado
  if (resena.id_evento !== id_evento) {
    const error = new Error('La reseña no pertenece al evento indicado');
    error.statusCode = 400;
    throw error;
  }

  // Obtener el evento para verificar el organizador
  const evento = await eventosRepo.obtenerEventoPorId(id_evento);
  if (!evento) {
    const error = new Error('Evento no encontrado');
    error.statusCode = 404;
    throw error;
  }

  // Verificar que el usuario autenticado sea el organizador del evento
  if (evento.id_organizador !== id_organizador) {
    const error = new Error('Solo el organizador del evento puede reportar reseñas');
    error.statusCode = 403;
    throw error;
  }

  // Verificar si ya existe un reporte para esta reseña
  const reporteExistente = await resenasRepo.obtenerReportePorResena(num_resena);
  if (reporteExistente) {
    const error = new Error('Esta reseña ya ha sido reportada');
    error.statusCode = 409;
    throw error;
  }

  // Crear el reporte
  const reporte = await resenasRepo.crearReporteResena({
    num_resena,
    id_evento,
    id_organizador,
    motivo
  });

  return {
    ...reporte,
    num_resena: Number(reporte.num_resena),
    id_organizador: Number(reporte.id_organizador)
  };
};

const eliminarResenaReportada = async ({ num_resena, id_evento, id_organizador }) => {
  // Validar entrada
  validarEliminarResena({ num_resena, id_evento });

  // Obtener la reseña para verificar existencia
  const resena = await resenasRepo.obtenerResenaPorId(num_resena);
  if (!resena) {
    const error = new Error('Reseña no encontrada');
    error.statusCode = 404;
    throw error;
  }

  // Verificar que la reseña pertenezca al evento indicado
  if (resena.id_evento !== id_evento) {
    const error = new Error('La reseña no pertenece al evento indicado');
    error.statusCode = 400;
    throw error;
  }

  // Obtener el evento para verificar el organizador
  const evento = await eventosRepo.obtenerEventoPorId(id_evento);
  if (!evento) {
    const error = new Error('Evento no encontrado');
    error.statusCode = 404;
    throw error;
  }

  // Verificar que el usuario autenticado sea el organizador del evento
  if (evento.id_organizador !== id_organizador) {
    const error = new Error('Solo el organizador del evento puede eliminar reseñas');
    error.statusCode = 403;
    throw error;
  }

  // Verificar que existe un reporte previo para esta reseña (restricción de negocio)
  const reporte = await resenasRepo.obtenerReportePorResena(num_resena);
  if (!reporte) {
    const error = new Error('Solo se puede eliminar una reseña que haya sido reportada previamente');
    error.statusCode = 400;
    throw error;
  }

  // Eliminar la reseña (el reporte se elimina en cascada por la FK)
  await resenasRepo.eliminarResena(num_resena);

  // Recalcular el promedio del evento
  const nuevoPromedio = await resenasRepo.obtenerPromedioPorEvento(id_evento);

  return {
    mensaje: 'Reseña eliminada correctamente',
    num_resena: Number(num_resena),
    promedio_actualizado: nuevoPromedio
  };
};

const obtenerCalificacionesBasicas = async (ids) => {
  const filas = await resenasRepo.obtenerCalificacionesBasicas(ids);
  const calificaciones = {};
  ids.forEach((id) => { calificaciones[id] = { promedio: null, total_resenas: 0 }; });
  filas.forEach((f) => {
    calificaciones[f.id_evento] = { promedio: Math.round(Number(f.promedio) * 10) / 10, total_resenas: f.total };
  });
  return { calificaciones };
};

const obtenerResenaPorId = async (idResena) => {
  return resenasRepo.obtenerResenaPorId(idResena);
};

module.exports = {
  crearResena,
  listarResenas,
  obtenerPromedioPorEvento,
  obtenerResenasPorEvento,
  crearRespuesta,
  reportarResena,
  eliminarResenaReportada,
  obtenerCalificacionesBasicas,
  obtenerResenaPorId
};