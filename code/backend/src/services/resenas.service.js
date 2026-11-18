const { validarCrearResena, normalizarDescripcion } = require('../utils/validaciones');
const usuariosRepo = require('../repositories/usuarios.repo');
const eventosRepo = require('../repositories/eventos.repo');
const resenasRepo = require('../repositories/resenas.repo');
const catalogoService = require('./catalogo.service');
const checkinService = require('./checkin.service');
const brokerService = require('./broker.service'); // CAMBIO 1
const verificarElegibilidadResena = async ({ id_usuario, id_evento }, correlationId) => {
  const evento = await catalogoService.obtenerEventoDelCatalogo(id_evento, correlationId);
  const usuario = await usuariosRepo.obtenerUsuarioPorId(id_usuario);
  if (!usuario) {
    const error = new Error('Usuario no encontrado');
    error.statusCode = 404;
    throw error;
  }

  const asistio = await checkinService.verificarAsistencia(
    String(id_usuario),
    id_evento,
    correlationId
  );
  if (!asistio) return { puedeResenar: false, motivo: 'NO_ASISTIO', usuario, evento };

  const existentes = await resenasRepo.listarResenas({ id_usuario, id_evento });
  if (existentes.length > 0) {
    return { puedeResenar: false, motivo: 'YA_RESENO', usuario, evento };
  }

  return { puedeResenar: true, motivo: null, usuario, evento };
};

const crearResena = async (datos, correlationId) => {
  const { id_usuario, id_evento, clasificacion, descripcion } = datos;
  validarCrearResena(datos);

  const elegibilidad = await verificarElegibilidadResena(
    { id_usuario, id_evento },
    correlationId
  );
  if (elegibilidad.motivo === 'NO_ASISTIO') {
    const error = new Error('El usuario no asistio al evento');
    error.statusCode = 403;
    throw error;
  }
  if (elegibilidad.motivo === 'YA_RESENO') {
    const error = new Error('El usuario ya realizo una resena para este evento');
    error.statusCode = 409;
    throw error;
  }

  await eventosRepo.sincronizarEventoDelCatalogo(elegibilidad.evento);
  const nuevaResena = await resenasRepo.crearResena({
    id_usuario,
    id_evento,
    clasificacion,
    descripcion: normalizarDescripcion(descripcion)
  });

  brokerService.publicarResenaCreada(nuevaResena, correlationId);

  return {
    ...nuevaResena,
    nombre_usuario: elegibilidad.usuario.nombre,
    nombre_evento: elegibilidad.evento.nombre,
    fecha_evento: elegibilidad.evento.fecha
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
    eventoId: idEvento,
    promedio: resumen.promedio,
    totalResenas: resumen.total,
    pagina,
    tamano,
    resenas: resumen.resenas.map((resena) => {
      const item = {
        resenaId: String(resena.num_resena),
        usuarioId: String(resena.id_usuario),
        calificacion: resena.clasificacion,
        fecha: new Date(resena.fecha_reseña).toISOString()
      };
      if (resena.descripcion !== null) item.comentario = resena.descripcion;
      return item;
    })
  };
};

const obtenerCalificacionesBasicas = async (idEventos) => {
  const filas = await resenasRepo.obtenerCalificacionesBasicas(idEventos);
  const calificaciones = Object.fromEntries(
    filas.map((fila) => [
      fila.id_evento,
      {
        promedio: fila.promedio === null ? null : Number(fila.promedio),
        totalResenas: Number(fila.total)
      }
    ])
  );
  return idEventos.reduce((resultado, idEvento) => {
    resultado[idEvento] = calificaciones[idEvento] || { promedio: null, totalResenas: 0 };
    return resultado;
  }, {});
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

module.exports = {
  crearResena,
  verificarElegibilidadResena,
  listarResenas,
  obtenerPromedioPorEvento,
  obtenerResenasPorEvento,
  obtenerCalificacionesBasicas,
  crearRespuesta
};