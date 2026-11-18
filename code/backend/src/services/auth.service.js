require('dotenv').config();
const crypto = require('crypto');

const AUTH_SERVICE_URL = (
  process.env.AUTH_SERVICE_URL || 'http://localhost:10000'
).replace(/\/+$/, '');
const AUTH_TIMEOUT_MS = Number(process.env.AUTH_TIMEOUT_MS) || 1000;
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ROLES = new Set(['usuario', 'organizador', 'staff']);

const validarSesion = async (cookie, correlationId = crypto.randomUUID()) => {
  if (typeof cookie !== 'string' || !/(?:^|;\s*)jwt=[^;]+/.test(cookie)) {
    const error = new Error('Debes iniciar sesión para realizar esta acción');
    error.statusCode = 401;
    throw error;
  }

  const apiKey = process.env.AUTH_INTERNAL_API_KEY;
  if (!apiKey) {
    const error = new Error('La integración con Auth no está configurada');
    error.statusCode = 503;
    throw error;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);

  try {
    const response = await fetch(`${AUTH_SERVICE_URL}/internal/validar-sesion`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Cookie: cookie,
        'x-api-key': apiKey,
        'X-Correlation-Id': correlationId
      },
      signal: controller.signal
    });
    const body = await response.json().catch(() => null);

    if (response.status === 401) {
      const error = new Error('La sesión no es válida o expiró; inicia sesión nuevamente');
      error.statusCode = 401;
      throw error;
    }

    if (response.status === 403) {
      const error = new Error('Auth rechazó la credencial interna de Reseñas');
      error.statusCode = 503;
      throw error;
    }

    if (!response.ok) {
      const error = new Error('No fue posible validar la sesión con Auth');
      error.statusCode = 503;
      throw error;
    }

    const usuario = body?.usuario;
    if (
      body?.valido !== true ||
      typeof usuario?.id_usuario !== 'string' ||
      !UUID_V4_PATTERN.test(usuario.id_usuario) ||
      typeof usuario.nombre_completo !== 'string' ||
      !ROLES.has(usuario.rol)
    ) {
      const error = new Error('Auth devolvió un perfil de sesión inválido');
      error.statusCode = 502;
      throw error;
    }

    return {
      id: usuario.id_usuario,
      nombre: usuario.nombre_completo,
      email: typeof usuario.correo_electronico === 'string'
        ? usuario.correo_electronico
        : null,
      rol: usuario.rol
    };
  } catch (error) {
    if (error.statusCode) throw error;

    const servicioNoDisponible = new Error('Auth no está disponible; intenta nuevamente');
    servicioNoDisponible.statusCode = 503;
    throw servicioNoDisponible;
  } finally {
    clearTimeout(timeout);
  }
};

module.exports = {
  validarSesion
};
