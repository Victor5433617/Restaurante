const express = require('express');
const router = express.Router();
const empresaController = require('../controllers/empresaController');
const upload = require ('../middlewares/uploadLogo');
const verificarToken = require('../middlewares/verificarToken');
const verificarRol = require('../middlewares/verificarRol');

router.get('/', verificarToken, empresaController.listar);
router.get('/conteo-hoy', verificarToken, empresaController.conteoHoy);
router.post('/', verificarToken, verificarRol('admin'), empresaController.Crear);
router.put('/:id', verificarToken, verificarRol('admin'), empresaController.editar);
router.delete('/:id', verificarToken, verificarRol('admin'), empresaController.eliminar);
router.post('/:id/logo', verificarToken, verificarRol('admin', 'encargada'), upload.single('logo'), empresaController.subirLogo)

module.exports = router;