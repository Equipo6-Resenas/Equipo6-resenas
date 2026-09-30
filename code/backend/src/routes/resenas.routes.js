const express = require('express');
const resenasController = require('../controllers/resenas.controller');

const router = express.Router();

router.post('/', resenasController.crearResena);
router.get('/', resenasController.listarResenas);

module.exports = router;
