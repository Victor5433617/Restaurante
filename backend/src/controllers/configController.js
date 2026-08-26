const configModel = require('../models/configModel');

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
    const configuracion = await configModel.actualizarLogoComedor(req.file.filename);
    res.status(200).json({ success: true, data: configuracion });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = { obtener, subirLogoComedor };
