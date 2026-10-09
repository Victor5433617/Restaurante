const { Pool, types } = require('pg');

// Las columnas DATE vienen de Postgres sin horario (ej: "2026-10-09"). Por defecto
// pg las convierte a un objeto Date a medianoche UTC, y eso hace que al mostrarlas
// en el navegador (con otro huso horario) se corran un día. Las dejamos como texto
// plano para que nadie tenga que lidiar con husos horarios al mostrar una fecha.
types.setTypeParser(types.builtins.DATE, (valor) => valor);

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

module.exports = pool;