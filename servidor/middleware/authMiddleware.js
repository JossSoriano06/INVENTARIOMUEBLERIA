
const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
    try {
        const authorization = req.headers.authorization;

        // Comprobar que exista el token
        if (!authorization || !authorization.startsWith('Bearer ')) {
            return res.status(401).json({
                message: 'Acceso denegado. Debes iniciar sesión.'
            });
        }

        // Extraer el token
        const token = authorization.split(' ')[1];

        // Verificar autenticidad y expiración
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Guardar los datos del administrador en la petición
        req.usuario = decoded;

        next();

    } catch (error) {
        return res.status(401).json({
            message: 'Token inválido o expirado. Inicia sesión nuevamente.'
        });
    }
}

module.exports = verificarToken;
