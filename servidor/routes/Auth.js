
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

module.exports = function (db) {
    const router = express.Router();

    // POST: iniciar sesión
    router.post('/login', async (req, res) => {
        try {
            const { usuario, password } = req.body;

            if (!usuario || !password) {
                return res.status(400).json({
                    message: 'Debes ingresar usuario y contraseña'
                });
            }

            // Buscar administrador
            const resultado = await db.query(
                `SELECT
                    id_administrador,
                    usuario,
                    password_hash,
                    activo
                 FROM administradores
                 WHERE usuario = $1`,
                [usuario]
            );

            if (resultado.rows.length === 0) {
                return res.status(401).json({
                    message: 'Usuario o contraseña incorrectos'
                });
            }

            const administrador = resultado.rows[0];

            // Verificar si la cuenta está activa
            if (!administrador.activo) {
                return res.status(403).json({
                    message: 'La cuenta está deshabilitada'
                });
            }

            // Comparar contraseña con bcrypt
            const passwordValida = await bcrypt.compare(
                password,
                administrador.password_hash
            );

            if (!passwordValida) {
                return res.status(401).json({
                    message: 'Usuario o contraseña incorrectos'
                });
            }

            // Generar JWT
            const token = jwt.sign(
                {
                    id: administrador.id_administrador,
                    usuario: administrador.usuario,
                    rol: 'administrador'
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: process.env.JWT_EXPIRES_IN || '8h'
                }
            );

            res.json({
                message: 'Inicio de sesión exitoso',
                token,
                administrador: {
                    id: administrador.id_administrador,
                    usuario: administrador.usuario,
                    rol: 'administrador'
                }
            });

        } catch (error) {
            console.error('Error en login:', error.message);

            res.status(500).json({
                message: 'Error interno al iniciar sesión'
            });
        }
    });

    return router;
};
