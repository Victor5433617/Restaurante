require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const empresasRoutes = require('./routes/empresaRoutes');
const funcionarioRoutes = require('./routes/funcionarioRoutes');
const menuRoutes = require('./routes/menuRoutes');
const pedidoRoutes = require('./routes/pedidoRoutes');
const authRoutes = require('./routes/authRoutes');
const configRoutes = require('./routes/configRoutes');
const manejarErrores = require('./middlewares/manejarErrores');

const app = express();

const CORS_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origen) => origen.trim());

app.use(helmet({
    contentSecurityPolicy: false,
}));

app.use(cors({
    origin: CORS_ORIGINS,
}));

app.use(morgan('dev'));
app.use(express.json());

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Demasiados intentos de inicio de sesión. Intentá de nuevo en 15 minutos.' },
});

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Demasiadas solicitudes. Intentá de nuevo más tarde.' },
});

// endpoint liviano para servicios de ping (evitar que Render duerma la instancia free)
app.get('/health', (req, res) => {
    res.status(200).json({ success: true, status: 'ok' });
});

// rutas
app.use('/uploads', (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
}, express.static('uploads'));
app.use('/api/empresas', apiLimiter, empresasRoutes);
app.use('/api/funcionarios', apiLimiter, funcionarioRoutes);
app.use('/api/menu', apiLimiter, menuRoutes);
app.use('/api/pedidos', apiLimiter, pedidoRoutes);
app.use('/api/auth', (req, res, next) => {
    if (req.path === '/login') return loginLimiter(req, res, next);
    next();
});
app.use('/api/auth', apiLimiter, authRoutes);
app.use('/api/config', apiLimiter, configRoutes);

app.use(manejarErrores);

module.exports = app;
