const express = require('express');
const resenasRoutes = require('./routes/resenas.routes');
const errorHandler = require('./middlewares/errorHandler');
const { verificarConexion, cerrarPool } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin === FRONTEND_ORIGIN) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  return next();
});
app.use(express.json());

app.use('/api/resenas', resenasRoutes);

app.get('/health', async (req, res, next) => {
  try {
    const db = await verificarConexion();
    return res.json({ status: 'OK', modulo: 'Resenas', base_datos: 'conectada', db_hora: db });
  } catch (error) {
    return next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use(errorHandler);

const servidor = app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
  console.log(`  GET  /health`);
  console.log(`  GET  /api/resenas`);
  console.log(`  POST /api/resenas`);
});

const apagar = async (senal) => {
  console.log(`\n${senal} recibido, cerrando...`);
  servidor.close(async () => {
    await cerrarPool();
    console.log('Conexiones cerradas.');
    process.exit(0);
  });
};

process.on('SIGINT', () => apagar('SIGINT'));
process.on('SIGTERM', () => apagar('SIGTERM'));
