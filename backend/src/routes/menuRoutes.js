const menuController = require ('../controllers/menuController');
const express = require ('express');
const router = express.Router();
const verificarToken = require('../middlewares/verificarToken');
const verificarRol = require('../middlewares/verificarRol');
const { validarMenu, validarEditarMenu } = require('../middlewares/validacion');

router.get('/', verificarToken, menuController.listarM);
router.put('/:id', verificarToken, verificarRol('admin'), validarEditarMenu, menuController.editarM);
router.get('/hoy', verificarToken, menuController.menuHoyM);
router.get('/dia', verificarToken, verificarRol('admin', 'encargada'), menuController.menuPorFechaM);
router.post('/', verificarToken, verificarRol('admin'), validarMenu, menuController.crearM);



module.exports = router;
