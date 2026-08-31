const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = ['admin', 'encargada', 'funcionario'];
const MAX_NOMBRE = 100;
const MAX_RUC = 50;
const MAX_LONG = 200;
const MIN_PASSWORD = 4;

function validarEmpresa(req, res, next) {
    const { nombre, ruc_identificador } = req.body;
    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
        return res.status(400).json({ success: false, error: 'El nombre de la empresa es obligatorio' });
    }
    if (nombre.length > MAX_NOMBRE) {
        return res.status(400).json({ success: false, error: `El nombre no puede superar ${MAX_NOMBRE} caracteres` });
    }
    if (ruc_identificador !== undefined && ruc_identificador !== null && String(ruc_identificador).length > MAX_RUC) {
        return res.status(400).json({ success: false, error: `El RUC no puede superar ${MAX_RUC} caracteres` });
    }
    next();
}

function validarFuncionario(req, res, next) {
    const { nombre_completo } = req.body;
    if (!nombre_completo || typeof nombre_completo !== 'string' || !nombre_completo.trim()) {
        return res.status(400).json({ success: false, error: 'El nombre del funcionario es obligatorio' });
    }
    if (nombre_completo.length > MAX_LONG) {
        return res.status(400).json({ success: false, error: `El nombre no puede superar ${MAX_LONG} caracteres` });
    }
    next();
}

function validarRegistro(req, res, next) {
    const { email, password, rol } = req.body;
    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
        return res.status(400).json({ success: false, error: 'Email inválido' });
    }
    if (!password || typeof password !== 'string' || password.length < MIN_PASSWORD) {
        return res.status(400).json({ success: false, error: `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres` });
    }
    if (rol !== undefined && rol !== null && !ROLES.includes(rol)) {
        return res.status(400).json({ success: false, error: 'Rol inválido' });
    }
    next();
}

function validarContrasena(req, res, next) {
    const { nueva_password } = req.body;
    if (!nueva_password || typeof nueva_password !== 'string' || nueva_password.length < MIN_PASSWORD) {
        return res.status(400).json({ success: false, error: `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres` });
    }
    next();
}

function validarMenu(req, res, next) {
    const validarItem = (item) => {
        if (!item || typeof item !== 'object') return 'Cada plato debe ser un objeto';
        if (!item.plato_nombre || typeof item.plato_nombre !== 'string' || !item.plato_nombre.trim()) {
            return 'El nombre del plato es obligatorio';
        }
        if (item.fecha === undefined || item.fecha === null || item.fecha === '') {
            return 'La fecha es obligatoria';
        }
        if (item.opcion_numero === undefined || item.opcion_numero === null) {
            return 'El número de opción es obligatorio';
        }
        return null;
    };

    if (Array.isArray(req.body)) {
        if (req.body.length === 0) {
            return res.status(400).json({ success: false, error: 'La lista de platos no puede estar vacía' });
        }
        for (const item of req.body) {
            const error = validarItem(item);
            if (error) return res.status(400).json({ success: false, error });
        }
        return next();
    }
    const error = validarItem(req.body);
    if (error) return res.status(400).json({ success: false, error });
    next();
}

function validarEditarMenu(req, res, next) {
    const { plato_nombre } = req.body;
    if (plato_nombre !== undefined && (!plato_nombre || typeof plato_nombre !== 'string' || !plato_nombre.trim())) {
        return res.status(400).json({ success: false, error: 'El nombre del plato no puede estar vacío' });
    }
    next();
}

function validarPedidoCompleto(req, res, next) {
    const { empresa_id, fecha, detalles } = req.body;
    if (!empresa_id) {
        return res.status(400).json({ success: false, error: 'Falta empresa_id' });
    }
    if (!fecha) {
        return res.status(400).json({ success: false, error: 'Falta fecha' });
    }
    if (!Array.isArray(detalles) || detalles.length === 0) {
        return res.status(400).json({ success: false, error: 'Faltan detalles del pedido' });
    }
    for (const detalle of detalles) {
        if (!detalle || typeof detalle !== 'object') {
            return res.status(400).json({ success: false, error: 'Cada detalle debe ser un objeto' });
        }
        if (!detalle.funcionario_id || !detalle.menu_semanal_id) {
            return res.status(400).json({ success: false, error: 'Cada detalle requiere funcionario_id y menu_semanal_id' });
        }
    }
    next();
}

module.exports = {
    validarEmpresa,
    validarFuncionario,
    validarRegistro,
    validarContrasena,
    validarMenu,
    validarEditarMenu,
    validarPedidoCompleto,
};
