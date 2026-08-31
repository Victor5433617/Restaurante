const authModel = require('../models/authModel');

async function registrarU(req, res) {
    try {
        const dato = { ...req.body };
        if (req.usuario.rol !== 'admin') {
            if (dato.rol === 'admin') {
                return res.status(403).json({ success: false, error: 'No podés crear usuarios administradores' });
            }
            dato.empresa_id = req.usuario.empresa_id;
        }
        const registrarU = await authModel.registrar(dato);
        res.status(201).json({ success: true, data: registrarU });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function listarUsuarios(req, res) {
    try {
        const empresaId = req.usuario.rol !== 'admin' ? req.usuario.empresa_id : (req.query.empresa_id || null);
        const usuarios = await authModel.listarPorEmpresa(empresaId);
        res.status(200).json({ success: true, data: usuarios });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function LoginU(req, res) {
    try {
        const LoginU = await authModel.login(req.body);
        res.status(200).json({ success: true, data: LoginU });
    } catch (error) {
        res.status(401).json({ success: false, error: error.message });
    }
}

async function ActualizarContraseña(req, res) {
    try {
        if (req.usuario.rol !== 'admin') {
            const objetivo = await authModel.obtenerPorEmail(req.body.email);
            if (!objetivo) {
                return res.status(404).json({ success: false, error: 'Email no encontrado' });
            }
            if (objetivo.rol === 'admin' || objetivo.empresa_id !== req.usuario.empresa_id) {
                return res.status(403).json({ success: false, error: 'No podés cambiar la contraseña de ese usuario' });
            }
        }
        const ActualizarContraseña = await authModel.actualizarContraseña(req.body.email, req.body.nueva_password);
        if (!ActualizarContraseña) {
            return res.status(404).json({ success: false, error: 'Email no encontrado' });
        }
        res.status(200).json({ success: true, data: ActualizarContraseña });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = { registrarU, LoginU, ActualizarContraseña, listarUsuarios };
