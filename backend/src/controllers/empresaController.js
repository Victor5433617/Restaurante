const empresaModel = require('../models/empresaModel');
const { guardarLogo } = require('../utils/subirImagen');

async function listar(req, res) {
    try {
        const empresaid = req.usuario.rol !== 'admin' ? req.usuario.empresa_id : null;
        const empresas = await empresaModel.ObtenerTodos(empresaid);
        res.status(200).json({ success: true, data: empresas });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function Crear(req, res) {
    try {
        const nuevaEmpresa = await empresaModel.CrearEmpresas(req.body);
        res.status(201).json({ success: true, data: nuevaEmpresa });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function editar(req, res) {
    try {
        const actualizarEmpresa = await empresaModel.editarEmpresas(req.params.id, req.body);
        if (!actualizarEmpresa) {
            return res.status(404).json({ success: false, error: 'Empresa no encontrada' });
        }
        res.status(200).json({ success: true, data: actualizarEmpresa });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function eliminar(req, res) {
    try {
        const resultado = await empresaModel.eliminar(req.params.id);
        if (resultado.length === 0) {
            return res.status(404).json({ success: false, error: 'Recurso no encontrado' });
        }
        res.status(200).json({ success: true, message: 'Empresa eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function subirLogo(req, res) {
    try {
        if (req.usuario.rol !== 'admin' && Number(req.params.id) !== req.usuario.empresa_id) {
            return res.status(403).json({ success: false, error: 'No podés modificar el logo de otra empresa' });
        }
        const urlLogo = await guardarLogo(req);
        const subirLogo = await empresaModel.subirLogo(req.params.id, urlLogo);
        if (!subirLogo) {
            return res.status(404).json({ success: false, error: 'No encontrada' });
        }
        res.status(200).json({ success: true, data: subirLogo });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function actualizarComidas(req, res) {
    try {
        const actualizada = await empresaModel.actualizarComidas(req.params.id, req.body);
        if (!actualizada) {
            return res.status(404).json({ success: false, error: 'Empresa no encontrada' });
        }
        res.status(200).json({ success: true, data: actualizada });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function conteoHoy(req, res) {
    try {
        const empresaId = req.usuario.rol !== 'admin' ? req.usuario.empresa_id : null;
        const conteoHoy = await empresaModel.conteoHoy(empresaId);
        res.status(200).json({ success: true, data: conteoHoy });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = { listar, Crear, editar, eliminar, subirLogo, conteoHoy, actualizarComidas };
