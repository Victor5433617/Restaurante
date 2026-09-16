const pedidoController = require ('../controllers/pedidoController');
const pdfController = require('../controllers/pdfController');
const express = require ('express');
const router = express.Router();
const verificarToken = require('../middlewares/verificarToken');
const verificarRol = require('../middlewares/verificarRol');
const { validarPedidoCompleto } = require('../middlewares/validacion');

router.get('/', verificarToken, pedidoController.listarP);
router.get('/reporte', verificarToken, verificarRol('admin', 'encargada'), pedidoController.reporteP);
router.get('/resumen-comidas', verificarToken, verificarRol('admin', 'encargada'), pedidoController.resumenComidasP);
router.get('/reporte/pdf', verificarToken, verificarRol('admin', 'encargada'), pdfController.generarReportePdf);
router.get('/:id', verificarToken, pedidoController.obtenerDetalleP);
router.post('/', verificarToken, pedidoController.crearP);
router.post('/completo', verificarToken, validarPedidoCompleto, pedidoController.crearCompletoP);
router.post('/anotar', verificarToken, pedidoController.anotarP);
router.post('/quitar', verificarToken, pedidoController.quitarP);



module.exports = router;