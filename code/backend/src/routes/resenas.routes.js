const express = require('express');
const resenasController = require('../controllers/resenas.controller');

const router = express.Router();

router.post('/', resenasController.crearResena);
router.get('/', resenasController.listarResenas);

// Nuevo endpoint para obtener el promedio de calificaciones de un evento
router.get('/promedio', resenasController.obtenerPromedio);

// Nuevo endpoint para crear una respuesta a una reseña específica
router.post('/:idResena/respuestas', resenasController.crearRespuesta);

module.exports = router;