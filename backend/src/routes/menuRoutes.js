const menuController = require ('../controllers/menuController');
const express = require ('express');
const router = express.Router();
const verificarToken = require('../middlewares/verificarToken');
const verificarRol = require('../middlewares/verificarRol');

router.get('/', verificarToken, menuController.listarM);
router.put('/:id', verificarToken, verificarRol('admin'), menuController.editarM);
router.get('/hoy', verificarToken, menuController.menuHoyM);
router.post('/', verificarToken, verificarRol('admin'), menuController.crearM);



module.exports = router;
