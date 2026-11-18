const express = require('express');
const resenasController = require('../controllers/resenas.controller');

const router = express.Router();

router.post('/calificaciones-basicas', resenasController.obtenerCalificacionesBasicas);
router.get('/evento/:eventoId', resenasController.obtenerResenasPorEventoV1);

module.exports = router;
