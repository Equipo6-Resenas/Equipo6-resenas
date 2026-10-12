const resenasService = require('../services/resenas.service');

const crearResena = async (req, res, next) => {
  try {
    const nuevaResena = await resenasService.crearResena(req.body);
    return res.status(201).json(nuevaResena);
  } catch (error) {
    return next(error);
  }
};

const listarResenas = async (req, res, next) => {
  try {
    const filtros = {};

    if (req.query.id_usuario !== undefined) {
      filtros.id_usuario = Number(req.query.id_usuario);
    }
    if (req.query.id_evento !== undefined) {
      filtros.id_evento = Number(req.query.id_evento);
    }
    if (req.query.clasificacion !== undefined) {
      filtros.clasificacion = Number(req.query.clasificacion);
    }

    const resenas = await resenasService.listarResenas(filtros);
    return res.status(200).json(resenas);
  } catch (error) {
    return next(error);
  }
};

const obtenerPromedio = async (req, res, next) => {
  try {
    const { id_evento } = req.query;
    if (!id_evento) {
      const error = new Error('ID de evento es requerido');
      error.statusCode = 400;
      throw error;
    }
    const resultado = await resenasService.obtenerPromedioPorEvento(Number(id_evento));
    return res.status(200).json(resultado);
  } catch (error) {
    return next(error);
  }
};

const crearRespuesta = async (req, res, next) => {
  try {
    const { idResena } = req.params;
    const { texto, id_usuario } = req.body;

    if (!idResena) {
      const error = new Error('ID de reseña es requerido en la ruta');
      error.statusCode = 400;
      throw error;
    }

    const datos = {
      id_resena: Number(idResena),
      texto: texto
    };

    const respuesta = await resenasService.crearRespuesta(datos, Number(id_usuario));
    return res.status(201).json(respuesta);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  crearResena,
  listarResenas,
  obtenerPromedio,
  crearRespuesta
};