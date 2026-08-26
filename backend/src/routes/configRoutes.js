const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
const upload = require('../middlewares/uploadLogo');
const verificarToken = require('../middlewares/verificarToken');
const verificarRol = require('../middlewares/verificarRol');

router.get('/', verificarToken, configController.obtener);
router.post('/logo-comedor', verificarToken, verificarRol('admin'), upload.single('logo'), configController.subirLogoComedor);

module.exports = router;
