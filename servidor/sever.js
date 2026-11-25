
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { pool, verificarConexion } = require('./config/database');

const app = express();

const PORT = process.env.PORT || 3004;

// =====================================
// MIDDLEWARES
// =====================================

app.use(express.json());

// Dominios autorizados mediante variables de entorno
const allowedOrigins = (
    process.env.CORS_ORIGINS ||
    'https://muebleriaelmarquez.vercel.app,http://localhost:3000'
)
    .split(',')
    .map(origin => origin.trim().replace(/\/$/, ''));

// Patrón para los dominios Preview de este proyecto en Vercel
const vercelPreviewPattern =
    /^https:\/\/muebleriaelmarquez-[a-z0-9-]+-josesorianos-projects\.vercel\.app$/i;

// =====================================
// CONFIGURACIÓN CORS
// =====================================

const corsOptions = {
    origin: function (origin, callback) {

        // Permitir peticiones sin origen, como Postman
        if (!origin) {
            return callback(null, true);
        }

        const originNormalizado = origin.replace(/\/$/, '');

        // Comprobar dominios autorizados
        if (allowedOrigins.includes(originNormalizado)) {
            return callback(null, true);
        }

        // Comprobar dominios Preview de Vercel
        if (vercelPreviewPattern.test(originNormalizado)) {
            return callback(null, true);
        }

        console.log('Origen bloqueado por CORS:', origin);

        return callback(new Error('Bloqueado por CORS'));
    },

    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],

    allowedHeaders: [
        'Content-Type',
        'Authorization'
    ],

    credentials: true
};

app.use(cors(corsOptions));

// =====================================
// RUTA PRINCIPAL
// =====================================

app.get('/', (req, res) => {
    res.send('API de Mueblería funcionando con PostgreSQL.');
});

// =====================================
// INICIAR SERVIDOR
// =====================================

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
            console.log('Configuración CORS cargada correctamente');
        });

    } catch (error) {
        console.error('Error al iniciar el servidor:', error.message);
        process.exit(1);
    }
}

iniciarServidor();
