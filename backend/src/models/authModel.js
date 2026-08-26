const bcrypt  = require ('bcrypt');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');

async function registrar(dato) {
    const hash = await bcrypt.hash(dato.password, 10);

    const resultado = await pool.query(
        'INSERT INTO usuarios (email, password_hash, rol, empresa_id) VALUES ($1,$2,$3,$4) RETURNING id, email, rol, empresa_id',
        [dato.email, hash, dato.rol, dato.empresa_id]
    );
    return resultado.rows[0];
}

async function login(dato) {
    const resultado = await pool.query('SELECT * FROM usuarios where email = $1', [dato.email]);
    const usuario = resultado.rows[0];

    if (!usuario) {
        throw new Error('Credenciales Invalidas');
    }

    const passwordCorrecto = await bcrypt.compare(dato.password, usuario.password_hash);
    if (!passwordCorrecto) {
        throw new Error('Credenciales Invalidas');
    }

    const token = jwt.sign(
        { id: usuario.id, rol: usuario.rol, empresa_id: usuario.empresa_id },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
    );

    return {token, usuario: {id : usuario.id, email: usuario.email, rol: usuario.rol, empresa_id: usuario.empresa_id }};

}


async function listarPorEmpresa(empresaId) {
    if (empresaId) {
        const resultado = await pool.query(
            'SELECT id, email, rol, empresa_id FROM usuarios WHERE empresa_id = $1 ORDER BY email',
            [empresaId]
        );
        return resultado.rows;
    }
    const resultado = await pool.query('SELECT id, email, rol, empresa_id FROM usuarios ORDER BY email');
    return resultado.rows;
}

async function obtenerPorEmail(email) {
    const resultado = await pool.query(
        'SELECT id, email, rol, empresa_id FROM usuarios WHERE email = $1',
        [email]
    );
    return resultado.rows[0];
}

async function actualizarContraseña(email, nuevaPassword) {
    const hash = await bcrypt.hash(nuevaPassword, 10);

    const resultado = await pool.query
    ('UPDATE usuarios SET password_hash = $1 WHERE email = $2 RETURNING id, email, rol, empresa_id',
        [hash , email]);
    return resultado.rows[0];

}


module.exports = {registrar, login, actualizarContraseña, obtenerPorEmail, listarPorEmpresa};