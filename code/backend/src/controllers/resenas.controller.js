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

const esIdEventoValido = (valor) => (
  typeof valor === 'string' &&
  valor.trim() === valor &&
  valor.length > 0 &&
  valor.length <= 64
);

const leerIdEventoContrato = (valor) => {
  if (!esIdEventoValido(valor)) {
    const error = new Error('eventoId debe ser un identificador de hasta 64 caracteres');
    error.statusCode = 400;
    throw error;
  }
  return valor;
};

const leerIdUsuarioFiltro = (valor) => {
  const numero = Number(valor);
  if (Number.isSafeInteger(numero) && numero > 0) return numero;
  if (
    typeof valor === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(valor)
  ) {
    return valor;
  }
  const error = new Error('id_usuario debe ser un ID local positivo o un UUID de Auth');
  error.statusCode = 400;
  throw error;
};

const crearResena = async (req, res, next) => {
  try {
    const nuevaResena = await resenasService.crearResena(
      req.body,
      req.authUser,
      req.correlationId
    );
    return res.status(201).json(nuevaResena);
  } catch (error) {
    return next(error);
  }
};

const obtenerSesion = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    user: {
      id: req.authUser.id,
      name: req.authUser.nombre,
      role: req.authUser.rol
    }
  });
};

const verificarElegibilidad = async (req, res, next) => {
  try {
    const idEvento = leerIdEventoContrato(req.query.eventoId);
    const resultado = await resenasService.verificarElegibilidadResena(
      { id_evento: idEvento },
      req.authUser,
      req.correlationId
    );
    return res.status(200).json({
      puedeResenar: resultado.puedeResenar,
      motivo: resultado.motivo
    });
  } catch (error) {
    return next(error);
  }
};

const listarResenas = async (req, res, next) => {
  try {
    const filtros = {};

    if (req.query.id_usuario !== undefined) {
      filtros.id_usuario = leerIdUsuarioFiltro(req.query.id_usuario);
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
      if (tamano > 50) {
        const error = new Error('tamano debe ser menor o igual a 50');
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

const obtenerResenasPorEventoV1 = async (req, res, next) => {
  try {
    const idEvento = leerIdEventoContrato(req.params.eventoId);
    const pagina = req.query.pagina === undefined
      ? 1
      : leerEnteroPositivo(req.query.pagina, 'pagina');
    const tamano = req.query.tamano === undefined
      ? 20
      : leerEnteroPositivo(req.query.tamano, 'tamano');

    if (tamano > 50) {
      const error = new Error('tamano debe ser menor o igual a 50');
      error.statusCode = 400;
      throw error;
    }

    const resultado = await resenasService.obtenerResenasPorEvento(idEvento, pagina, tamano);
    return res.status(200).json({
      id_evento: resultado.eventoId,
      promedio: resultado.promedio,
      total_resenas: resultado.totalResenas,
      pagina: resultado.pagina,
      tamano: resultado.tamano,
      resenas: resultado.resenas.map((resena) => {
        const item = {
          resena_id: resena.resenaId,
          usuario_id: resena.usuarioId,
          calificacion: resena.calificacion,
          fecha: resena.fecha
        };
        if (resena.comentario !== undefined) item.comentario = resena.comentario;
        return item;
      })
    });
  } catch (error) {
    return next(error);
  }
};

const obtenerCalificacionesBasicas = async (req, res, next) => {
  try {
    const ids = req.body?.lista_id_eventos;
    if (
      !Array.isArray(ids) ||
      ids.length === 0 ||
      ids.length > 100 ||
      ids.some((id) => !esIdEventoValido(id))
    ) {
      const error = new Error('lista_id_eventos debe contener entre 1 y 100 IDs válidos');
      error.statusCode = 400;
      throw error;
    }

    const resultados = await resenasService.obtenerCalificacionesBasicas([...new Set(ids)]);
    const calificaciones = Object.fromEntries(
      Object.entries(resultados).map(([idEvento, valores]) => [
        idEvento,
        {
          promedio: valores.promedio,
          total_resenas: valores.totalResenas
        }
      ])
    );
    return res.status(200).json({ calificaciones });
  } catch (error) {
    return next(error);
  }
};

const crearRespuesta = async (req, res, next) => {
  try {
    const { idResena } = req.params;
    const { texto } = req.body || {};

    if (!idResena) {
      const error = new Error('ID de reseña es requerido en la ruta');
      error.statusCode = 400;
      throw error;
    }

    const idResenaNumero = leerEnteroPositivo(idResena, 'idResena');

    const respuesta = await resenasService.crearRespuesta(
      { id_resena: idResenaNumero, texto },
      req.authUser
    );
    return res.status(201).json(respuesta);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  crearResena,
  obtenerSesion,
  verificarElegibilidad,
  listarResenas,
  obtenerPromedio,
  obtenerResenasPorEvento,
  obtenerResenasPorEventoV1,
  obtenerCalificacionesBasicas,
  crearRespuesta
};