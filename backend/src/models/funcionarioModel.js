const pool = require('../config/db');

async function ObtenerTodosF(empresa_id) {
    const condiciones = ['activo = true'];
    const valores = [];
    if (empresa_id) {
        valores.push(empresa_id);
        condiciones.push(`empresa_id = $${valores.length}`);
    }
    const resultado = await pool.query(
        `SELECT * FROM funcionarios WHERE ${condiciones.join(' AND ')} ORDER BY nombre_completo`,
        valores
    );
    return resultado.rows;
}

async function obtenerPorId(id) {
    const resultado = await pool.query('SELECT * FROM funcionarios WHERE id = $1', [id]);
    return resultado.rows[0];
}

async function CrearF(dato) {
    const resultado = await pool.query(
        'INSERT INTO funcionarios (empresa_id, nombre_completo) VALUES ($1,$2) RETURNING *',
    [dato.empresa_id, dato.nombre_completo]);
    return resultado.rows[0];  
}

async function editarF(id,dato) {
    const restulado = await pool.query(
        'UPDATE funcionarios SET empresa_id = $1, nombre_completo =$2 WHERE id = $3 RETURNING *',
    [dato.empresa_id, dato.nombre_completo, id]);

    return restulado.rows[0];
    
}


async function eliminarF(id) {
    const restulado = await pool.query(
        'UPDATE funcionarios SET activo = false WHERE id = $1 RETURNING id',
        [id]
    );
    return restulado.rows;
}

module.exports = {ObtenerTodosF,CrearF, editarF,eliminarF, obtenerPorId};