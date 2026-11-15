require('dotenv').config();
const crypto = require('crypto');

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8080';
const CATALOGO_TIMEOUT_MS = Number(process.env.CATALOGO_TIMEOUT_MS) || 2000;

const obtenerEventoDelCatalogo = async (eventoId) => {
  // Para desarrollo/testing local: si API_GATEWAY_URL apunta a localhost puerto inexistente,
  // validar contra la BD local directamente
  const isLocalDev = API_GATEWAY_URL.includes('localhost:9999') || API_GATEWAY_URL.includes('127.0.0.1:9999');

  if (isLocalDev) {
    const { query } = require('../config/db');
    const { rows } = await query(
      `SELECT id_evento, nombre_evento, fecha_evento
       FROM eventos WHERE id_evento = $1`,
      [eventoId]
    );
    if (rows.length === 0) {
      const error = new Error('El evento no existe en el catalogo');
      error.statusCode = 404;
      throw error;
    }
    const e = rows[0];
    return {
      eventoId: e.id_evento,
      nombre: e.nombre_evento,
      fecha: e.fecha_evento,
      tipo: null
    };
  }

  const correlationId = crypto.randomUUID();
  const url = `${API_GATEWAY_URL}/api/catalogo/eventos/${encodeURIComponent(eventoId)}/info-servicio`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CATALOGO_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Correlation-Id': correlationId
      },
      signal: controller.signal
    });

    const body = await response.json().catch(() => null);

    if (response.status === 404) {
      const error = new Error('El evento no existe en el catalogo');
      error.statusCode = 404;
      throw error;
    }

    if (!response.ok) {
      const error = new Error('No se pudo validar el evento con el catalogo');
      error.statusCode = 503;
      throw error;
    }

    const datos = body?.data || body;

    return {
      eventoId: String(datos.id_evento || datos.eventoId || eventoId),
      nombre: datos.nombre_evento || datos.nombre || datos.titulo,
      fecha: datos.fecha_evento || datos.fecha,
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
