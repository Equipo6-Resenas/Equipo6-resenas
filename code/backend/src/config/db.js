require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'resenas',
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

pool.on('error', (error) => {
  console.error('Error inesperado del pool de PostgreSQL:', error.message);
});

const query = async (text, params) => {
  const inicio = Date.now();
  try {
    return await pool.query(text, params);
  } finally {
    const duracion = Date.now() - inicio;
    if (duracion > 500) {
      console.warn(`Consulta lenta (${duracion}ms): ${text.trim().split('\n')[0]}`);
    }
  }
};

const ejecutarScript = async (sql) => {
  return pool.query(sql);
};

const contarRegistros = async (tabla) => {
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS total FROM ${tabla}`);
  return rows[0].total;
};

const verificarConexion = async () => {
  const resultado = await pool.query('SELECT NOW() AS ahora');
  return resultado.rows[0].ahora;
};

const cerrarPool = async () => {
  await pool.end();
};

module.exports = {
  query,
  ejecutarScript,
  contarRegistros,
  verificarConexion,
  cerrarPool
};
