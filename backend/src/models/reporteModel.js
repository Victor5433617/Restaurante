const pool = require('../config/db');

async function obtenerReporte(empresaId, desde, hasta) {
  const resultado = await pool.query(
    `SELECT
       fechas.fecha,
       f.id AS funcionario_id,
       f.nombre_completo,
       CASE WHEN dp.id IS NOT NULL THEN '1' ELSE 'X' END AS estado
     FROM generate_series($2::date, $3::date, '1 day'::interval) AS fechas(fecha)
     CROSS JOIN funcionarios f
     LEFT JOIN pedidos_diarios pd
       ON pd.empresa_id = f.empresa_id AND pd.fecha = fechas.fecha
     LEFT JOIN detalles_pedidos dp
       ON dp.pedido_id = pd.id AND dp.funcionario_id = f.id
     WHERE f.empresa_id = $1
     ORDER BY fechas.fecha, f.nombre_completo`,
    [empresaId, desde, hasta]
  );
  return resultado.rows;
}

module.exports = { obtenerReporte };
