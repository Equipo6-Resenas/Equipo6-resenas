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
    // req.body contiene los campos de texto (multer los parsea como strings)
    // req.file contiene la imagen subida (si hay)
    // Convertir campos numéricos
    const datos = {
      id_usuario: Number(req.body.id_usuario),
      id_evento: req.body.id_evento,
      clasificacion: Number(req.body.clasificacion),
      descripcion: req.body.descripcion
    };
    const nuevaResena = await resenasService.crearResena(datos, req.file);
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

// --- New controller methods for reporting and deleting reviews ---

const reportarResena = async (req, res, next) => {
  try {
    const { idResena } = req.params;
    const { motivo, id_usuario } = req.body;

    if (!idResena) {
      const error = new Error('ID de reseña es requerido en la ruta');
      error.statusCode = 400;
      throw error;
    }

    if (!motivo || typeof motivo !== 'string' || motivo.trim() === '') {
      const error = new Error('Motivo del reporte es requerido');
      error.statusCode = 400;
      throw error;
    }

    if (!id_usuario || typeof id_usuario !== 'number') {
      const error = new Error('ID de organizador es requerido');
      error.statusCode = 400;
      throw error;
    }

    // Get the review to find its event
    const resena = await resenasService.obtenerResenaPorId(Number(idResena));
    if (!resena) {
      const error = new Error('Reseña no encontrada');
      error.statusCode = 404;
      throw error;
    }

    const reporte = await resenasService.reportarResena({
      num_resena: Number(idResena),
      id_evento: resena.id_evento,
      id_organizador: Number(id_usuario),
      motivo: motivo.trim()
    });

    return res.status(201).json(reporte);
  } catch (error) {
    return next(error);
  }
};

const eliminarResenaReportada = async (req, res, next) => {
  try {
    const { idResena } = req.params;
    const { id_usuario, id_evento } = req.body;

    if (!idResena) {
      const error = new Error('ID de reseña es requerido en la ruta');
      error.statusCode = 400;
      throw error;
    }

    if (!id_evento || typeof id_evento !== 'string') {
      const error = new Error('ID de evento es requerido');
      error.statusCode = 400;
      throw error;
    }

    if (!id_usuario || typeof id_usuario !== 'number') {
      const error = new Error('ID de organizador es requerido');
      error.statusCode = 400;
      throw error;
    }

    const resultado = await resenasService.eliminarResenaReportada({
      num_resena: Number(idResena),
      id_evento: id_evento,
      id_organizador: Number(id_usuario)
    });

    return res.status(200).json(resultado);
  } catch (error) {
    return next(error);
  }
};

const obtenerCalificacionesBasicas = async (req, res, next) => {
  try {
    const ids = req.body && req.body.lista_id_eventos;
    if (!Array.isArray(ids) || ids.length === 0) {
      const error = new Error('lista_id_eventos debe ser un arreglo no vacio');
      error.statusCode = 400;
      throw error;
    }
    ids.forEach(leerIdEventoContrato);
    return res.status(200).json(await resenasService.obtenerCalificacionesBasicas(ids));
  } catch (error) { return next(error); }
};

module.exports = {
  crearResena,
  listarResenas,
  obtenerPromedio,
  obtenerResenasPorEvento,
  obtenerCalificacionesBasicas,
  crearRespuesta,
  reportarResena,
  eliminarResenaReportada
};