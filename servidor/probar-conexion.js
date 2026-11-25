
const { pool, verificarConexion } = require('./config/database');

async function probarConexion() {
    try {
        await verificarConexion();
    } catch (error) {
        console.error('No se pudo conectar a Supabase.');
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

probarConexion();
