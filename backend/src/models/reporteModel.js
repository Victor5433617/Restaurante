const pool = require('../config/db');

async function obtenerReporte(empresaId, desde, hasta, tipoComida = 'almuerzo') {
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
       ON dp.pedido_id = pd.id AND dp.funcionario_id = f.id AND dp.tipo_comida = $4
     WHERE f.empresa_id = $1
     ORDER BY fechas.fecha, f.nombre_completo`,
    [empresaId, desde, hasta, tipoComida]
  );
  return resultado.rows;
}

async function obtenerResumenPorTipo(empresaId, desde, hasta) {
  const resultado = await pool.query(
    `SELECT pd.fecha, dp.tipo_comida, COUNT(*)::int AS cantidad
     FROM detalles_pedidos dp
     JOIN pedidos_diarios pd ON pd.id = dp.pedido_id
     WHERE pd.empresa_id = $1 AND pd.fecha BETWEEN $2::date AND $3::date
     GROUP BY pd.fecha, dp.tipo_comida
     ORDER BY pd.fecha`,
    [empresaId, desde, hasta]
  );
  return resultado.rows;
}

module.exports = { obtenerReporte, obtenerResumenPorTipo };
