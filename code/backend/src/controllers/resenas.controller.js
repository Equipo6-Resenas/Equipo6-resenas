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

module.exports = {
  crearResena,
  listarResenas
};
