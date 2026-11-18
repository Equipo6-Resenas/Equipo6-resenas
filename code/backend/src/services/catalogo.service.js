require('dotenv').config();
const crypto = require('crypto');

const API_GATEWAY_URL = (process.env.API_GATEWAY_URL || 'http://localhost:8080')
  .replace(/\/+$/, '');
const CATALOGO_SERVICE_URL = process.env.CATALOGO_SERVICE_URL
  ? process.env.CATALOGO_SERVICE_URL.replace(/\/+$/, '')
  : null;
const CATALOGO_TIMEOUT_MS = Number(process.env.CATALOGO_TIMEOUT_MS) || 2000;

const obtenerEventoDelCatalogo = async (eventoId, correlationId = crypto.randomUUID()) => {
  const baseUrl = CATALOGO_SERVICE_URL || `${API_GATEWAY_URL}/api/catalogo`;
  const url = `${baseUrl}/eventos/${encodeURIComponent(eventoId)}/info-servicio`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CATALOGO_TIMEOUT_MS);
  const headers = {
    Accept: 'application/json',
    'X-Correlation-Id': correlationId
  };
  if (process.env.SERVICE_TO_SERVICE_TOKEN) {
    headers.Authorization = `Bearer ${process.env.SERVICE_TO_SERVICE_TOKEN}`;
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal
    });

    const body = await response.json().catch(() => null);

    if (response.status === 404) {
      const error = new Error('El evento no existe en el catálogo');
      error.statusCode = 404;
      throw error;
    }

    if (!response.ok) {
      const error = new Error('No se pudo validar el evento con el catálogo');
      error.statusCode = 503;
      throw error;
    }

    const datos = body?.data || body;
    const nombre = datos.nombre_evento || datos.nombre || datos.titulo;
    const fecha = datos.fecha_evento || datos.fecha;
    if (typeof nombre !== 'string' || typeof fecha !== 'string') {
      const error = new Error('El catálogo devolvió información incompleta del evento');
      error.statusCode = 502;
      throw error;
    }

    const idEventoRespuesta = String(datos.id_evento || datos.eventoId || eventoId);
    if (idEventoRespuesta !== eventoId) {
      const error = new Error('El catálogo respondió por un evento distinto');
      error.statusCode = 502;
      throw error;
    }

    return {
      eventoId: idEventoRespuesta,
      nombre,
      fecha,
      tipo: datos.tipo_evento || datos.tipo || null
    };
  } catch (error) {
    if (error.statusCode) throw error;

    const servicioNoDisponible = new Error(
      'No pudimos verificar el evento en Catalogo, intenta mas tarde'
    );
    servicioNoDisponible.statusCode = 503;
    throw servicioNoDisponible;
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = {
  obtenerEventoDelCatalogo
};
