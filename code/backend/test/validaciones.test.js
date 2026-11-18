const assert = require('node:assert/strict');
const { test } = require('node:test');
const { validarCrearResena } = require('../src/utils/validaciones');

test('acepta una reseña sin identidad enviada por el cliente', () => {
  assert.doesNotThrow(() => validarCrearResena({
    id_evento: 'evt-101',
    clasificacion: 5,
    descripcion: 'Buena experiencia'
  }));
});

test('rechaza una identidad de usuario enviada por el cliente', () => {
  assert.throws(
    () => validarCrearResena({
      id_usuario: 1,
      id_evento: 'evt-101',
      clasificacion: 5
    }),
    (error) => error.statusCode === 400 && error.message.includes('sesión Auth')
  );
});
