const pedidoModel = require('../models/pedidoModel');
const reporteModel = require('../models/reporteModel');

async function listarP(req, res) {
    try {
        const empresaId = req.usuario.rol !== 'admin' ? req.usuario.empresa_id : null;
        const pedidoListar = await pedidoModel.obtenerTodos(empresaId);
        res.status(200).json({ success: true, data: pedidoListar });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

function empresaNoAutorizada(req, empresaId) {
    return req.usuario.rol !== 'admin' && Number(empresaId) !== req.usuario.empresa_id;
}

async function crearP(req, res) {
    try {
        const cuerpos = Array.isArray(req.body) ? req.body : [req.body];
        const tieneNoAutorizado = cuerpos.some((item) => empresaNoAutorizada(req, item.empresa_id));
        if (tieneNoAutorizado) {
            return res.status(403).json({ success: false, error: 'No podés crear pedidos para otra empresa' });
        }

        if (Array.isArray(req.body)) {
            const resultado = await Promise.all(
                req.body.map((items) => pedidoModel.CrearPedido(items))
            );
            return res.status(201).json({ success: true, data: resultado });
        }
        const pedidoCreado = await pedidoModel.CrearPedido(req.body);
        res.status(201).json({ success: true, data: pedidoCreado });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function crearCompletoP(req, res) {
    try {
        if (empresaNoAutorizada(req, req.body.empresa_id)) {
            return res.status(403).json({ success: false, error: 'No podés crear pedidos para otra empresa' });
        }
        const pedidoCompletoCreado = await pedidoModel.crearCompleto(req.body);
        res.status(201).json({ success: true, data: pedidoCompletoCreado });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function reporteP(req, res) {
    try {
        const { empresa_id: empresaId, desde, hasta } = req.query;
        if (!empresaId || !desde || !hasta) {
            return res.status(400).json({ success: false, error: 'Faltan empresa_id, desde o hasta' });
        }
        if (empresaNoAutorizada(req, empresaId)) {
            return res.status(403).json({ success: false, error: 'No podés ver el reporte de otra empresa' });
        }
        const filas = await reporteModel.obtenerReporte(empresaId, desde, hasta);
        res.status(200).json({ success: true, data: filas });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function resumenComidasP(req, res) {
    try {
        const { empresa_id: empresaId, desde, hasta } = req.query;
        if (!empresaId || !desde || !hasta) {
            return res.status(400).json({ success: false, error: 'Faltan empresa_id, desde o hasta' });
        }
        if (empresaNoAutorizada(req, empresaId)) {
            return res.status(403).json({ success: false, error: 'No podés ver el reporte de otra empresa' });
        }
        const filas = await reporteModel.obtenerResumenPorTipo(empresaId, desde, hasta);
        res.status(200).json({ success: true, data: filas });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function obtenerDetalleP(req, res) {
    try {
        const pedido = await pedidoModel.obtenerDetallePorId(req.params.id);
        if (!pedido) {
            return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
        }
        if (empresaNoAutorizada(req, pedido.empresa_id)) {
            return res.status(403).json({ success: false, error: 'No podés ver el detalle de otra empresa' });
        }
        res.status(200).json({ success: true, data: pedido });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

function puedeElegirFecha(req) {
    return req.usuario.rol === 'admin' || req.usuario.rol === 'encargada';
}

const TIPOS_COMIDA = ['desayuno', 'almuerzo', 'merienda', 'cena'];

async function anotarP(req, res) {
    try {
        if (empresaNoAutorizada(req, req.body.empresa_id)) {
            return res.status(403).json({ success: false, error: 'No podés anotar funcionarios de otra empresa' });
        }
        const tipoComida = req.body.tipo_comida || 'almuerzo';
        if (!TIPOS_COMIDA.includes(tipoComida)) {
            return res.status(400).json({ success: false, error: 'tipo_comida inválido' });
        }
        if (tipoComida === 'almuerzo' && !req.body.menu_semanal_id) {
            return res.status(400).json({ success: false, error: 'Falta menu_semanal_id para el almuerzo' });
        }
        const dato = { ...req.body, tipo_comida: tipoComida };
        if (!puedeElegirFecha(req)) {
            delete dato.fecha;
        }
        const resultado = await pedidoModel.anotarFuncionario(dato);
        res.status(200).json({ success: true, data: resultado });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

async function quitarP(req, res) {
    try {
        if (empresaNoAutorizada(req, req.body.empresa_id)) {
            return res.status(403).json({ success: false, error: 'No podés modificar pedidos de otra empresa' });
        }
        const dato = { ...req.body };
        if (!puedeElegirFecha(req)) {
            delete dato.fecha;
        }
        const resultado = await pedidoModel.quitarFuncionario(dato);
        res.status(200).json({ success: true, data: resultado });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}

module.exports = { listarP, crearP, crearCompletoP, reporteP, resumenComidasP, obtenerDetalleP, anotarP, quitarP };
