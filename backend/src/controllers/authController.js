const authModel = require('../models/authModel');

async function registrarU(req, res) {
    try {
        const dato = { ...req.body };
        if (req.usuario.rol !== 'admin') {
            if (dato.rol === 'admin') {
                return res.status(403).json({ succes: false, error: 'No podés crear usuarios administradores' });
            }
            dato.empresa_id = req.usuario.empresa_id;
        }
        const registrarU = await authModel.registrar(dato);
        res.status(201).json({ succes: true, data: registrarU });
        console.log(registrarU);
    } catch (error) {
        res.status(500).json({ succes: false, error: error.message }),
            console.log(error);
    }
}

async function listarUsuarios(req, res) {
    try {
        const empresaId = req.usuario.rol !== 'admin' ? req.usuario.empresa_id : (req.query.empresa_id || null);
        const usuarios = await authModel.listarPorEmpresa(empresaId);
        res.status(200).json({ succes: true, data: usuarios });
    } catch (error) {
        res.status(500).json({ succes: false, error: error.message });
    }
}

async function LoginU(req, res) {
    try {
        const LoginU = await authModel.login(req.body);
        res.status(200).json({succes: true, data: LoginU});
        console.log(LoginU)
    } catch (error) {
        res.status(401).json({succes: false, error: error.message});
        console.log(error);
    }
}

async function ActualizarContraseña(req, res) {
    try {
        if (req.usuario.rol !== 'admin') {
            const objetivo = await authModel.obtenerPorEmail(req.body.email);
            if (!objetivo) {
                return res.status(404).json({succes: false, error: 'Email No encontrado'});
            }
            if (objetivo.rol === 'admin' || objetivo.empresa_id !== req.usuario.empresa_id) {
                return res.status(403).json({succes: false, error: 'No podés cambiar la contraseña de ese usuario'});
            }
        }
        const ActualizarContraseña = await authModel.actualizarContraseña(req.body.email, req.body.nueva_password );
        if(!ActualizarContraseña){
            return res.status(404).json({succes: false, error: 'Email No encontrado'});
        }

        res.status(200).json({succes: true, data: ActualizarContraseña});
        console.log(ActualizarContraseña);
    } catch (error) {
        res.status(500).json({succes: false, error: error.message});
        console.log(error);
    }
}


module.exports = { registrarU , LoginU, ActualizarContraseña, listarUsuarios};