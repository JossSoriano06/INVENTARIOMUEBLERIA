
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { pool, verificarConexion } = require('./config/database');

const app = express();

const PORT = process.env.PORT || 3004;

// Middlewares
app.use(express.json());

const allowedOrigins = (
    process.env.CORS_ORIGINS ||
    'https://muebleriaelmarquez.vercel.app,http://localhost:3000'
).split(',').map(origin => origin.trim());

// Configuración CORS
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error('Bloqueado por CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// Ruta principal
app.get('/', (req, res) => {
    res.send('API de Mueblería funcionando con PostgreSQL.');
});

// Iniciar servidor
async function iniciarServidor() {
    try {
        await verificarConexion();

        // Middleware de autenticación
        const verificarToken = require('./middleware/authMiddleware');

        // =====================================
        // RUTA PÚBLICA DE AUTENTICACIÓN
        // =====================================
        const authRoutes = require('./routes/Auth')(pool);
        app.use('/api/auth', authRoutes);

        // =====================================
        // RUTAS PROTEGIDAS
        // =====================================

        // Productos
        const productoRoutes = require('./routes/Productos')(pool);
        app.use('/api/productos', verificarToken, productoRoutes);

        // Clientes y ventas
        const clientesRoutes = require('./routes/Clientes')(pool);
        app.use('/api/clientes', verificarToken, clientesRoutes);

        // Dashboard
        const dashboardRoutes = require('./routes/Dashboard')(pool);
        app.use('/api/dashboard', verificarToken, dashboardRoutes);

        // =====================================
        // INICIAR SERVIDOR
        // =====================================
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Servidor corriendo en el puerto: ${PORT}`);
        });

    } catch (error) {
        console.error('Error al iniciar el servidor:', error.message);
        process.exit(1);
    }
}

iniciarServidor();
