const express = require('express');
const funcionariosController = require('../controllers/funcionarioController');
const router = express.Router();
const verificarToken = require('../middlewares/verificarToken');
const verificarRol = require('../middlewares/verificarRol');

router.get('/', verificarToken, funcionariosController.listar);
router.post('/', verificarToken, verificarRol('admin', 'encargada'), funcionariosController.Crear);
router.put('/:id', verificarToken, verificarRol('admin', 'encargada'), funcionariosController.editar);
router.delete('/:id', verificarToken, verificarRol('admin', 'encargada'), funcionariosController.eliminar);




module.exports = router;