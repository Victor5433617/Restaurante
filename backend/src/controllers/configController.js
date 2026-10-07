const configModel = require('../models/configModel');
const { guardarLogo } = require('../utils/subirImagen');

async function obtener(req, res) {
  try {
    const configuracion = await configModel.obtener();
    res.status(200).json({ success: true, data: configuracion });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function subirLogoComedor(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No se subió ningún archivo' });
    }
    const urlLogo = await guardarLogo(req);
    const configuracion = await configModel.actualizarLogoComedor(urlLogo);
    res.status(200).json({ success: true, data: configuracion });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function obtenerPublico(req, res) {
  try {
    const configuracion = await configModel.obtener();
    res.status(200).json({ success: true, data: { logo_comedor_url: configuracion?.logo_comedor_url ?? null } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = { obtener, subirLogoComedor, obtenerPublico };
