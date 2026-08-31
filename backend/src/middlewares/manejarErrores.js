function manejarErrores(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }
    if (err.status || (err.name === 'MulterError')) {
        const mensaje = err.status === 400
            ? err.message
            : 'El archivo supera el tamaño máximo permitido (2MB)';
        return res.status(err.status || 400).json({ success: false, error: mensaje });
    }
    console.error(err);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
}

module.exports = manejarErrores;
