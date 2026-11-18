require('dotenv').config();
const crypto = require('crypto');

const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8080';
const CHECKIN_SERVICE_URL = (
  process.env.CHECKIN_SERVICE_URL || `${API_GATEWAY_URL}/api/checkin`
).replace(/\/+$/, '');
const CHECKIN_TIMEOUT_MS = Number(process.env.CHECKIN_TIMEOUT_MS) || 2000;

const verificarAsistencia = async (usuarioId, eventoId, correlationId = crypto.randomUUID()) => {
  const url = new URL(`${CHECKIN_SERVICE_URL}/asistencia`);
  url.searchParams.set('usuarioId', String(usuarioId));
  url.searchParams.set('eventoId', eventoId);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CHECKIN_TIMEOUT_MS);
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
      if (body?.error?.code === 'ROUTE_NOT_FOUND') {
        const error = new Error(
          'Check-in todavía no implementa GET /api/checkin/asistencia'
        );
        error.statusCode = 503;
        throw error;
      }

      const error = new Error('El usuario o el evento no existe en Check-in');
      error.statusCode = 404;
      throw error;
    }

    if (!response.ok) {
      const error = new Error('No se pudo verificar la asistencia en Check-in');
      error.statusCode = 503;
      throw error;
    }

    if (typeof body?.asistio !== 'boolean') {
      const error = new Error('Check-in devolvió una respuesta de asistencia inválida');
      error.statusCode = 502;
      throw error;
    }

    if (
      (body.usuarioId !== undefined && String(body.usuarioId) !== String(usuarioId)) ||
      (body.eventoId !== undefined && String(body.eventoId) !== eventoId)
    ) {
      const error = new Error('Check-in respondió por un usuario o evento distinto');
      error.statusCode = 502;
      throw error;
    }

    return body.asistio;
  } catch (error) {
    if (error.statusCode) throw error;

    const servicioNoDisponible = new Error(
      'No pudimos verificar tu asistencia con Check-in, intenta más tarde'
    );
    servicioNoDisponible.statusCode = 503;
    throw servicioNoDisponible;
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = {
  verificarAsistencia
};
