const pool = require('../config/db');

async function obtener() {
  const resultado = await pool.query('SELECT * FROM configuracion WHERE id = 1');
  return resultado.rows[0];
}

async function actualizarLogoComedor(logoUrl) {
  const resultado = await pool.query(
    'UPDATE configuracion SET logo_comedor_url = $1 WHERE id = 1 RETURNING *',
    [logoUrl]
  );
  return resultado.rows[0];
}

module.exports = { obtener, actualizarLogoComedor };
