const express = require('express');
const resenasRoutes = require('./routes/resenas.routes');
const errorHandler = require('./middlewares/errorHandler');
const { verificarConexion, cerrarPool } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

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
