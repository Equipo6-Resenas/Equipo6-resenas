const resenasService = require('../services/resenas.service');

const leerEnteroPositivo = (valor, campo) => {
  const numero = Number(valor);
  if (!Number.isSafeInteger(numero) || numero <= 0) {
    const error = new Error(`${campo} debe ser un número entero positivo`);
    error.statusCode = 400;
    throw error;
  }
  return numero;
};

const leerIdEventoContrato = (valor) => {
  if (typeof valor !== 'string' || !/^evt-[a-zA-Z0-9_-]{1,64}$/.test(valor)) {
    const error = new Error('eventoId debe usar el formato evt-{id}');
    error.statusCode = 400;
    throw error;
  }
  return valor;
};

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
      filtros.id_usuario = leerEnteroPositivo(req.query.id_usuario, 'id_usuario');
    }
    if (req.query.id_evento !== undefined) {
      filtros.id_evento = leerIdEventoContrato(req.query.id_evento);
    }
    if (req.query.clasificacion !== undefined) {
      filtros.clasificacion = leerEnteroPositivo(req.query.clasificacion, 'clasificacion');
      if (filtros.clasificacion > 5) {
        const error = new Error('clasificacion debe estar entre 1 y 5');
        error.statusCode = 400;
        throw error;
      }
    }

    const resenas = await resenasService.listarResenas(filtros);
    return res.status(200).json(resenas);
  } catch (error) {
    return next(error);
  }
};

const obtenerPromedio = async (req, res, next) => {
  try {
    const idEvento = leerIdEventoContrato(req.query.id_evento);
    const resultado = await resenasService.obtenerPromedioPorEvento(idEvento);
    return res.status(200).json(resultado);
  } catch (error) {
    return next(error);
  }
};

const obtenerResenasPorEvento = async (req, res, next) => {
  try {
    const idEvento = leerIdEventoContrato(req.params.eventoId);

    let pagina = 1;
    if (req.query.pagina !== undefined) {
      pagina = leerEnteroPositivo(req.query.pagina, 'pagina');
    }

    let tamano = 20;
    if (req.query.tamano !== undefined) {
      tamano = leerEnteroPositivo(req.query.tamano, 'tamano');
      if (tamano > 100) {
        const error = new Error('tamano debe ser menor o igual a 100');
        error.statusCode = 400;
        throw error;
      }
    }

    const resultado = await resenasService.obtenerResenasPorEvento(idEvento, pagina, tamano);
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
  obtenerResenasPorEvento,
  crearRespuesta
};