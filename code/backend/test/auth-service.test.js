const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');

process.env.AUTH_SERVICE_URL = 'http://auth-service:10000';
process.env.AUTH_INTERNAL_API_KEY = 'test-internal-key';
process.env.AUTH_TIMEOUT_MS = '100';

const authService = require('../src/services/auth.service');
const fetchOriginal = global.fetch;
const uuid = '3f1e2c1a-4b8d-4a2e-9c3f-7d1e2f9b2d4a';

afterEach(() => {
  global.fetch = fetchOriginal;
  process.env.AUTH_INTERNAL_API_KEY = 'test-internal-key';
});

test('valida la cookie con Auth y devuelve la identidad contractual', async () => {
  let llamada;
  global.fetch = async (url, options) => {
    llamada = { url: String(url), options };
    return new Response(JSON.stringify({
      valido: true,
      usuario: {
        id_usuario: uuid,
        nombre_completo: 'Usuario de prueba',
        correo_electronico: 'usuario@example.test',
        rol: 'usuario'
      }
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  const user = await authService.validarSesion('jwt=test-session', 'correlation-test');

  assert.deepEqual(user, {
    id: uuid,
    nombre: 'Usuario de prueba',
    email: 'usuario@example.test',
    rol: 'usuario'
  });
  assert.equal(llamada.url, 'http://auth-service:10000/internal/validar-sesion');
  assert.equal(llamada.options.headers.Cookie, 'jwt=test-session');
  assert.equal(llamada.options.headers['x-api-key'], 'test-internal-key');
  assert.equal(llamada.options.headers['X-Correlation-Id'], 'correlation-test');
});

test('rechaza la solicitud sin cookie antes de llamar a Auth', async () => {
  let llamadas = 0;
  global.fetch = async () => {
    llamadas += 1;
    throw new Error('No debe llamar al proveedor');
  };

  await assert.rejects(
    authService.validarSesion(undefined),
    (error) => error.statusCode === 401
  );
  assert.equal(llamadas, 0);
});

test('falla de forma segura si Auth rechaza la clave interna', async () => {
  global.fetch = async () => new Response('{}', { status: 403 });

  await assert.rejects(
    authService.validarSesion('jwt=test-session'),
    (error) => error.statusCode === 503
  );
});

test('no confía en un perfil de Auth con UUID o rol inválido', async () => {
  global.fetch = async () => new Response(JSON.stringify({
    valido: true,
    usuario: {
      id_usuario: '2',
      nombre_completo: 'Usuario',
      rol: 'admin'
    }
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  await assert.rejects(
    authService.validarSesion('jwt=test-session'),
    (error) => error.statusCode === 502
  );
});
