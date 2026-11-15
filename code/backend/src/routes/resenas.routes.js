const express = require('express');
const resenasController = require('../controllers/resenas.controller');
const { upload, handleMulterError } = require('../middlewares/upload');

const router = express.Router();

// POST / - Crear reseña (con imagen opcional via multipart/form-data)
// El middleware upload.single('imagen') procesa el archivo si viene
router.post('/', upload.single('imagen'), handleMulterError, resenasController.crearResena);
router.get('/', resenasController.listarResenas);

// Nuevo endpoint para obtener el promedio de calificaciones de un evento
router.get('/promedio', resenasController.obtenerPromedio);

// Endpoint integrado con el catálogo: reseñas y promedio de un evento
router.get('/evento/:eventoId', resenasController.obtenerResenasPorEvento);

// Nuevo endpoint para crear una respuesta a una reseña específica
router.post('/:idResena/respuestas', resenasController.crearRespuesta);

// Nuevos endpoints para reportar y eliminar reseñas
router.post('/:idResena/reportes', resenasController.reportarResena);
router.delete('/:idResena', resenasController.eliminarResenaReportada);

module.exports = router;