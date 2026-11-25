
require('dotenv').config();

const bcrypt = require('bcrypt');
const { pool } = require('./config/database');

async function crearAdministrador() {
    try {
        const usuario = process.env.ADMIN_USER;
        const password = process.env.ADMIN_PASSWORD;

        if (!usuario || !password || password.length < 6) {
            throw new Error(
                'Configura ADMIN_USER y una contraseña de al menos 6 caracteres en .env'
            );
        }

        // Comprobar si el administrador ya existe
        const existente = await pool.query(
            'SELECT id_administrador FROM administradores WHERE usuario = $1',
            [usuario]
        );

        if (existente.rows.length > 0) {
            console.log('El administrador ya existe.');
            return;
        }

        // Generar hash seguro de la contraseña
        const passwordHash = await bcrypt.hash(password, 12);

        // Registrar administrador
        await pool.query(
            `INSERT INTO administradores (usuario, password_hash)
             VALUES ($1, $2)`,
            [usuario, passwordHash]
        );

        console.log('Administrador creado correctamente.');

    } catch (error) {
        console.error('Error:', error.message);
        process.exitCode = 1;

    } finally {
        await pool.end();
    }
}

crearAdministrador();
