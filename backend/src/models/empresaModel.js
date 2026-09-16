const pool = require('../config/db');


async function ObtenerTodos(empresa_id){
    if(empresa_id){
        const restulado = await pool.query(
            'SELECT * FROM empresas WHERE id = $1', [empresa_id]);
            return restulado.rows;
    }
    const resultado = await pool.query('SELECT * FROM empresas');
    return resultado.rows;
}


async function CrearEmpresas(dato){
    const resultado = await pool.query(
        'INSERT INTO empresas (nombre, ruc_identificador ) VALUES ($1,$2) RETURNING *',
    [dato.nombre, dato.ruc_identificador]);

    return resultado.rows[0];
}

async function editarEmpresas(id,dato) {
    const resultado = await pool.query(
        'UPDATE empresas SET nombre = $1, ruc_identificador = $2 WHERE id = $3 RETURNING *',
        [dato.nombre, dato.ruc_identificador, id]
    );
    return resultado.rows[0];
}

async function eliminar(id) {
   const restulado = await pool.query('DELETE FROM empresas WHERE id = $1 RETURNING id', [id]);
   return restulado.rows;
}

async function actualizarComidas(id, dato) {
    const resultado = await pool.query(
        `UPDATE empresas
         SET habilita_desayuno = $1, habilita_almuerzo = $2, habilita_merienda = $3, habilita_cena = $4
         WHERE id = $5 RETURNING *`,
        [
            Boolean(dato.habilita_desayuno),
            Boolean(dato.habilita_almuerzo),
            Boolean(dato.habilita_merienda),
            Boolean(dato.habilita_cena),
            id,
        ]
    );
    return resultado.rows[0];
}

async function subirLogo(id,logoUrl) {
    const restulado = await pool.query('UPDATE empresas SET logo_url = $1 WHERE id = $2 RETURNING *',
         [logoUrl, id] );
    return restulado.rows[0];
}

async function conteoHoy(empresa_id) {
    const base =
        'select   e.id AS empresa_id,   e.nombre AS empresa_nombre, '
         + 'COUNT(dp.id) AS total_pedidos FROM empresas e  '
         +'LEFT JOIN pedidos_diarios pd ON pd.empresa_id = e.id AND pd.fecha = CURRENT_DATE '
         + "LEFT JOIN detalles_pedidos dp ON dp.pedido_id = pd.id AND dp.tipo_comida = 'almuerzo' ";

    if (empresa_id) {
        const resultado = await pool.query(
            base + 'WHERE e.id = $1 GROUP BY e.id, e.nombre ORDER BY e.nombre',
            [empresa_id]
        );
        return resultado.rows;
    }

    const resultado = await pool.query(base + 'GROUP BY e.id, e.nombre ORDER BY e.nombre');
    return resultado.rows;
}

module.exports = {ObtenerTodos, CrearEmpresas,editarEmpresas,eliminar, subirLogo, conteoHoy, actualizarComidas};

