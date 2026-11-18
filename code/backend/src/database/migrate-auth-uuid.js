#!/usr/bin/env node
const { ejecutarScript, cerrarPool } = require('../config/db');

const migracion = `
BEGIN;

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS auth_uuid UUID;

ALTER TABLE usuarios
  ALTER COLUMN email DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS usuarios_auth_uuid_key
  ON usuarios (auth_uuid);

COMMIT;
`;

ejecutarScript(migracion)
  .then(() => console.log('Migración auth_uuid aplicada.'))
  .catch((error) => {
    console.error('No se pudo aplicar la migración auth_uuid:', error.message);
    process.exitCode = 1;
  })
  .finally(cerrarPool);
