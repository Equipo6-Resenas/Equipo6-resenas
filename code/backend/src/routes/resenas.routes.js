const express = require('express');
const resenasController = require('../controllers/resenas.controller');
const autenticarUsuario = require('../middlewares/autenticarUsuario');

const router = express.Router();

router.get('/me', autenticarUsuario, resenasController.obtenerSesion);
router.get('/eligibilidad', autenticarUsuario, resenasController.verificarElegibilidad);
router.post('/', autenticarUsuario, resenasController.crearResena);
router.get('/', resenasController.listarResenas);

// Nuevo endpoint para obtener el promedio de calificaciones de un evento
router.get('/promedio', resenasController.obtenerPromedio);

// Endpoint integrado con el catálogo: reseñas y promedio de un evento
router.get('/evento/:eventoId', resenasController.obtenerResenasPorEvento);

// Nuevo endpoint para crear una respuesta a una reseña específica
router.post('/:idResena/respuestas', autenticarUsuario, resenasController.crearRespuesta);

module.exports = router;