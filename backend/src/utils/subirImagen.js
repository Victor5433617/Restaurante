const fs = require('fs');
const path = require('path');
const { subirBuffer } = require('../config/cloudinary');

const usaCloudinary = Boolean(process.env.CLOUDINARY_CLOUD_NAME);

async function guardarLogo(req) {
  if (!req.file) return null;

  if (usaCloudinary) {
    const resultado = await subirBuffer(req.file.buffer, 'comensa-app/logos');
    return resultado.secure_url;
  }

  // sin Cloudinary configurado: ya quedó guardado en disco por multer (diskStorage)
  return req.file.filename;
}

module.exports = { guardarLogo, usaCloudinary };
