require('dotenv').config();
const app = require('../src/app');
const pool = require('../src/config/db');
const request = require('supertest');

const BASE = '/api';

function tokenAdmin(email, rol = 'admin') {
    const jwt = require('jsonwebtoken');
    return jwt.sign({ id: 1, rol, empresa_id: null }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

let contador = 0;
function unico(prefijo) {
    contador += 1;
    return `${prefijo}_${Date.now()}_${contador}`;
}

async function crearEmpresa(nombre, ruc) {
    const resultado = await pool.query(
        'INSERT INTO empresas (nombre, ruc_identificador) VALUES ($1, $2) RETURNING *',
        [nombre, unico(ruc || nombre)]
    );
    return resultado.rows[0];
}

async function crearUsuario({ email = 'usuario@test.com', password = 'secreto123', rol = 'encargada', empresa_id = null }) {
    const hash = require('bcrypt').hashSync(password, 10);
    const emailFinal = unico(email);
    const resultado = await pool.query(
        'INSERT INTO usuarios (email, password_hash, rol, empresa_id) VALUES ($1, $2, $3, $4) RETURNING id, email, rol, empresa_id',
        [emailFinal, hash, rol, empresa_id]
    );
    return resultado.rows[0];
}

async function crearFuncionario(empresaId, nombre) {
    const resultado = await pool.query(
        'INSERT INTO funcionarios (empresa_id, nombre_completo) VALUES ($1, $2) RETURNING *',
        [empresaId, unico(nombre || 'Funcionario Test')]
    );
    return resultado.rows[0];
}

async function crearMenu(fecha, opcion_numero, plato_nombre) {
    const resultado = await pool.query(
        'INSERT INTO menu_semanal (fecha, opcion_numero, plato_nombre, descripcion) VALUES ($1, $2, $3, $4) RETURNING *',
        [fecha, opcion_numero, plato_nombre || 'Plato test', '']
    );
    return resultado.rows[0];
}

async function login(email, password) {
    const res = await request(app)
        .post(`${BASE}/auth/login`)
        .send({ email, password });
    if (res.status !== 200) {
        throw new Error(`Login falló: ${res.status} ${JSON.stringify(res.body)}`);
    }
    return res.body.data.token;
}

async function limpiarTodo() {
    await pool.query('DELETE FROM detalles_pedidos');
    await pool.query('DELETE FROM pedidos_diarios');
    await pool.query('DELETE FROM menu_semanal WHERE plato_nombre LIKE \'%test%\' OR plato_nombre LIKE \'%test_%\'');
    await pool.query('DELETE FROM funcionarios');
    await pool.query('DELETE FROM usuarios WHERE email LIKE \'_%test%\' OR email LIKE \'%test.com%\'');
    await pool.query('DELETE FROM empresas');
}

module.exports = {
    app,
    pool,
    request,
    BASE,
    tokenAdmin,
    unico,
    crearEmpresa,
    crearUsuario,
    crearFuncionario,
    crearMenu,
    login,
    limpiarTodo,
};
