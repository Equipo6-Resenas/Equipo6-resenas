const { validarCrearResena, normalizarDescripcion } = require('../utils/validaciones');
const usuariosRepo = require('../repositories/usuarios.repo');
const eventosRepo = require('../repositories/eventos.repo');
const asistenciaRepo = require('../repositories/asistencia.repo');
const resenasRepo = require('../repositories/resenas.repo');

const crearResena = async (datos) => {
  const { id_usuario, id_evento, clasificacion, descripcion } = datos;

  validarCrearResena(datos);

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
    nombre_evento: evento.nombre_evento
  };
};

const listarResenas = async (filtros = {}) => {
  return resenasRepo.listarResenas(filtros);
};

module.exports = {
  crearResena,
  listarResenas
};
