const express = require('express');
const authController = require ('../controllers/authController');
const verificarToken = require('../middlewares/verificarToken');
const verificarRol = require('../middlewares/verificarRol');
const { validarRegistro, validarContrasena } = require('../middlewares/validacion');
const router = express.Router();

router.post('/registro', verificarToken, verificarRol('admin', 'encargada'), validarRegistro, authController.registrarU);
router.post('/login', authController.LoginU);
router.get('/usuarios', verificarToken, verificarRol('admin', 'encargada'), authController.listarUsuarios);
router.put('/usuarios/contrasena', verificarToken, verificarRol('admin', 'encargada'), validarContrasena, authController.ActualizarContraseña);


module.exports = router;