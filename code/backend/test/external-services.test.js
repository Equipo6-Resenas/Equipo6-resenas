const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');

process.env.API_GATEWAY_URL = 'http://gateway:8080';
process.env.CATALOGO_SERVICE_URL = ''; // force fallback to gateway /api/catalogo
process.env.CHECKIN_SERVICE_URL = 'http://gateway:8080/api/checkin';
process.env.SERVICE_TO_SERVICE_TOKEN = '';
process.env.CATALOGO_TIMEOUT_MS = '100';
process.env.CHECKIN_TIMEOUT_MS = '100';

const catalogo = require('../src/services/catalogo.service');
const checkin = require('../src/services/checkin.service');

const fetchOriginal = global.fetch;
const authUuid = '3f1e2c1a-4b8d-4a2e-9c3f-7d1e2f9b2d4a';

afterEach(() => {
  global.fetch = fetchOriginal;
});

test('consulta los datos mínimos del evento y propaga el correlation ID', async () => {
  let llamada;
  global.fetch = async (url, options) => {
    llamada = { url: String(url), options };
    return new Response(JSON.stringify({
      success: true,
      data: {
        id_evento: 'evento-7',
        nombre_evento: 'Feria',
        fecha_evento: '2026-09-21'
      }
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  const evento = await catalogo.obtenerEventoDelCatalogo('evento-7', 'correlation-test');

  assert.equal(evento.eventoId, 'evento-7');
  assert.equal(evento.nombre, 'Feria');
  assert.equal(evento.fecha, '2026-09-21');
  assert.equal(new URL(llamada.url).pathname, '/api/catalogo/eventos/evento-7/info-servicio');
  assert.equal(llamada.options.headers['X-Correlation-Id'], 'correlation-test');
});

test('consulta asistencia por usuario y evento y acepta asistio=false', async () => {
  let llamada;
  global.fetch = async (url, options) => {
    llamada = { url: String(url), options };
    return new Response(JSON.stringify({ asistio: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  const asistio = await checkin.verificarAsistencia(authUuid, 'evento-7', 'correlation-test');
  const url = new URL(llamada.url);

  assert.equal(asistio, false);
  assert.equal(llamada.options.method, 'GET');
  assert.equal(url.pathname, '/api/checkin/asistencia');
  assert.equal(url.searchParams.get('usuarioId'), authUuid);
  assert.equal(url.searchParams.get('eventoId'), 'evento-7');
  assert.equal(llamada.options.headers['X-Correlation-Id'], 'correlation-test');
  assert.equal(llamada.options.headers.Authorization, undefined);
});

test('falla de forma cerrada cuando Check-in aún no implementa la ruta contractual', async () => {
  global.fetch = async () => new Response(JSON.stringify({
    error: { code: 'ROUTE_NOT_FOUND', message: 'Ruta no encontrada.' }
  }), { status: 404, headers: { 'Content-Type': 'application/json' } });

  await assert.rejects(
    checkin.verificarAsistencia(authUuid, 'evento-7'),
    (error) => error.statusCode === 503
      && error.message.includes('todavía no implementa')
  );
});
