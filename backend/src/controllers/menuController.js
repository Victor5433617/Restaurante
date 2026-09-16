const menuModel = require('../models/menuModel');

async function listarM(req, res) {
    try {
        const MenuListar = await menuModel.ObtenerTodos();
        res.status(200).json({ success: true, data: MenuListar });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function crearM(req, res) {
    try {
        if (Array.isArray(req.body)) {
            const resultados = await Promise.all(
                req.body.map((item) => menuModel.crear(item))
            );
            return res.status(201).json({ success: true, data: resultados });
        }
        const Menucrear = await menuModel.crear(req.body);
        res.status(201).json({ success: true, data: Menucrear });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function editarM(req, res) {
    try {
        const menuEditar = await menuModel.editar(req.params.id, req.body);
        if (!menuEditar) {
            return res.status(404).json({ success: false, error: 'Menú no encontrado' });
        }
        res.status(200).json({ success: true, data: menuEditar });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function menuHoyM(req, res) {
    try {
        const menuHoy = await menuModel.menuHoy();
        res.status(200).json({ success: true, data: menuHoy });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function menuPorFechaM(req, res) {
    try {
        const { fecha } = req.query;
        if (!fecha) {
            return res.status(400).json({ success: false, error: 'Falta la fecha' });
        }
        const menuDia = await menuModel.menuPorFecha(fecha);
        res.status(200).json({ success: true, data: menuDia });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = { listarM, crearM, menuHoyM, menuPorFechaM, editarM };
