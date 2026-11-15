#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { ejecutarScript, contarRegistros, verificarConexion, cerrarPool } = require('../config/db');

const TABLAS = ['usuarios', 'eventos', 'asistencia_eventos', 'resenas'];

const ejecutarArchivo = async (nombreArchivo) => {
  const sql = fs.readFileSync(path.join(__dirname, nombreArchivo), 'utf8');
  await ejecutarScript(sql);
  console.log(`  ${nombreArchivo} ejecutado`);
};

async function main() {
  const soloSemilla = process.argv.includes('--solo-semilla');

  console.log('Conectando a PostgreSQL...');
  console.log(`  Conectado. Hora del servidor: ${await verificarConexion()}\n`);

  if (!soloSemilla) {
    console.log('Creando esquema...');
    await ejecutarArchivo('schema.sql');
  }

  console.log('Cargando datos iniciales...');
  await ejecutarArchivo('seed.sql');

  console.log('\nResumen:');
  for (const tabla of TABLAS) {
    console.log(`  ${tabla.padEnd(21)} ${await contarRegistros(tabla)} registro(s)`);
  }

  console.log('\nListo. Arranca la API con: npm start');
}

main()
  .catch((error) => {
    console.error('\nError:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('\nNo hay conexion. Revisa que PostgreSQL este corriendo:');
      console.error('  sudo systemctl start postgresql');
      console.error('Y que las variables del archivo .env sean correctas.');
    } else if (error.code === '3D000') {
      console.error('\nLa base de datos no existe. Creala con:');
      console.error('  sudo -u postgres createdb resenas');
    } else if (error.code === '28P01') {
      console.error('\nUsuario o contrasena incorrectos en el archivo .env.');
    }
    process.exitCode = 1;
  })
  .finally(cerrarPool);
