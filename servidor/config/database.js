
const { Pool } = require('pg');
require('dotenv').config();

// Configuración del pool de conexiones PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,

    // Conexión segura con Supabase
    ssl: {
        rejectUnauthorized: false
    },

    // Número máximo de conexiones simultáneas
    max: Number(process.env.PG_POOL_MAX) || 5,

    // Tiempo máximo para establecer una conexión
    connectionTimeoutMillis: 10000,

    // Tiempo que una conexión puede permanecer inactiva
    idleTimeoutMillis: 30000
});

// Detectar errores inesperados en conexiones inactivas
pool.on('error', (error) => {
    console.error('Error inesperado en PostgreSQL:', error);
});

// Función para comprobar la conexión
const verificarConexion = async () => {
    try {
        const resultado = await pool.query(
            'SELECT NOW() AS fecha_actual, current_database() AS base_datos'
        );

        console.log('Conexión a Supabase PostgreSQL exitosa.');
        console.log('Base de datos:', resultado.rows[0].base_datos);
        console.log('Fecha del servidor:', resultado.rows[0].fecha_actual);

        return true;

    } catch (error) {
        console.error('Error conectando a PostgreSQL:', error.message);
        throw error;
    }
};

module.exports = {
    pool,
    verificarConexion
};
