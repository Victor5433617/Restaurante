function verificarRol(...rolesPermitidos) {
    return function (req, res, next) {
        if (!rolesPermitidos.includes(req.usuario.rol)) {
            return res.status(403).json({ success: false, error: 'No tiene permiso para esta accion' });
        }
        next();
    };
}

module.exports = verificarRol;
