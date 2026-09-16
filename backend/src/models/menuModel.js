const pool = require('../config/db');

async function ObtenerTodos() {
    const restulado = await pool.query('SELECT * FROM menu_semanal');
    return restulado.rows;
}


async function crear(dato) {
    const resultado = await pool.query(
        'INSERT INTO menu_semanal (fecha, opcion_numero , plato_nombre, descripcion) VALUES ($1 ,$2, $3, $4) RETURNING *',
    [dato.fecha, dato.opcion_numero, dato.plato_nombre, dato.descripcion]);

    return resultado.rows[0];
}


async function editar(id,dato) {
    const resultado = await pool.query(
        'UPDATE menu_semanal SET plato_nombre = $1, descripcion = $2 WHERE id = $3 RETURNING * '
    , [dato.plato_nombre, dato.descripcion, id]);

    return resultado.rows[0];
}


async function menuHoy() {
    const resultado = await pool.query(
        'SELECT * FROM menu_semanal WHERE fecha = CURRENT_DATE ORDER BY opcion_numero');
    return resultado.rows;
}

async function menuPorFecha(fecha) {
    const resultado = await pool.query(
        'SELECT * FROM menu_semanal WHERE fecha = $1 ORDER BY opcion_numero', [fecha]);
    return resultado.rows;
}

module.exports = {ObtenerTodos, crear, menuHoy, menuPorFecha, editar};