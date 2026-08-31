const express = require('express');
const funcionariosController = require('../controllers/funcionarioController');
const router = express.Router();
const verificarToken = require('../middlewares/verificarToken');
const verificarRol = require('../middlewares/verificarRol');
const { validarFuncionario } = require('../middlewares/validacion');

router.get('/', verificarToken, funcionariosController.listar);
router.post('/', verificarToken, verificarRol('admin', 'encargada'), validarFuncionario, funcionariosController.Crear);
router.put('/:id', verificarToken, verificarRol('admin', 'encargada'), validarFuncionario, funcionariosController.editar);
router.delete('/:id', verificarToken, verificarRol('admin', 'encargada'), funcionariosController.eliminar);




module.exports = router;