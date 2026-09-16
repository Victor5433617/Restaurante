const pool = require('../config/db');


async function obtenerTodos(empresa_id) {
  if (empresa_id) {
    const restulado = await pool.query(
      'SELECT * FROM pedidos_diarios WHERE empresa_id = $1', [empresa_id]);
    return restulado.rows;
  }
  const restulado = await pool.query(
    'SELECT * FROM pedidos_diarios ');

  return restulado.rows;
}


async function obtenerPorId(id) {
  const resultado = await pool.query('SELECT * FROM pedidos_diarios WHERE id = $1', [id]);
  return resultado.rows[0];
}

async function obtenerDetallePorId(id) {
  const pedido = await obtenerPorId(id);
  if (!pedido) return null;

  const detalles = await pool.query(
    `SELECT
           dp.id,
           dp.funcionario_id,
           f.nombre_completo,
           dp.tipo_comida,
           dp.menu_semanal_id,
           ms.opcion_numero,
           ms.plato_nombre,
           dp.observacion
         FROM detalles_pedidos dp
         JOIN funcionarios f ON f.id = dp.funcionario_id
         LEFT JOIN menu_semanal ms ON ms.id = dp.menu_semanal_id
         WHERE dp.pedido_id = $1
         ORDER BY f.nombre_completo`,
    [id]
  );

  return { ...pedido, detalles: detalles.rows };
}

async function CrearPedido(dato) {
  const resultado = await pool.query(
    'INSERT INTO pedidos_diarios (empresa_id, fecha) values ($1, $2) RETURNING *',
    [dato.empresa_id, dato.fecha]);

  return resultado.rows[0];

}

async function crearCompleto(dato) {
  const client = await pool.connect();// abre una conexion solo para esta funcion
  try {
    await client.query('BEGIN');//se inicia en modo borrador

    const resCabecera = await client.query(
      'INSERT INTO pedidos_diarios (empresa_id, fecha) VALUES ($1, $2) RETURNING *',
      [dato.empresa_id, dato.fecha]
    );
    const pedido = resCabecera.rows[0];

    const detallesInsertados = [];
    for (const item of dato.detalles) {
      const resDetalle = await client.query(
        'INSERT INTO detalles_pedidos (pedido_id, funcionario_id, menu_semanal_id, observacion) VALUES ($1, $2, $3, $4) RETURNING *',
        [pedido.id, item.funcionario_id, item.menu_semanal_id, item.observacion]
      );
      detallesInsertados.push(resDetalle.rows[0]);
    }

    await client.query('COMMIT'); // guardar en la base de datos

    return { ...pedido, detalles: detallesInsertados };
  } catch (error) {
    await client.query('ROLLBACK'); //elimina el historial de begin
    throw error;
  } finally {
    client.release();
  }
}


async function anotarFuncionario(dato) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const resPedido = await client.query(
      `INSERT INTO pedidos_diarios (empresa_id, fecha)
       VALUES ($1, COALESCE($2::date, CURRENT_DATE))
       ON CONFLICT (empresa_id, fecha) DO UPDATE SET fecha = EXCLUDED.fecha
       RETURNING *`,
      [dato.empresa_id, dato.fecha || null]
    );
    const pedido = resPedido.rows[0];
    const tipoComida = dato.tipo_comida || 'almuerzo';

    const resDetalle = await client.query(
      `INSERT INTO detalles_pedidos (pedido_id, funcionario_id, tipo_comida, menu_semanal_id, observacion)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (pedido_id, funcionario_id, tipo_comida)
       DO UPDATE SET menu_semanal_id = EXCLUDED.menu_semanal_id, observacion = EXCLUDED.observacion
       RETURNING *`,
      [pedido.id, dato.funcionario_id, tipoComida, dato.menu_semanal_id || null, dato.observacion || '']
    );

    await client.query('COMMIT');
    return { pedido, detalle: resDetalle.rows[0] };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function quitarFuncionario(dato) {
  const resultado = await pool.query(
    `DELETE FROM detalles_pedidos dp
     USING pedidos_diarios pd
     WHERE dp.pedido_id = pd.id
       AND pd.empresa_id = $1
       AND pd.fecha = COALESCE($3::date, CURRENT_DATE)
       AND dp.funcionario_id = $2
       AND dp.tipo_comida = $4
     RETURNING dp.id`,
    [dato.empresa_id, dato.funcionario_id, dato.fecha || null, dato.tipo_comida || 'almuerzo']
  );
  return resultado.rows;
}

module.exports = {
  obtenerTodos,
  CrearPedido,
  crearCompleto,
  obtenerPorId,
  obtenerDetallePorId,
  anotarFuncionario,
  quitarFuncionario,
};