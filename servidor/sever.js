const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const cors = require('cors');


const app = express();

// AJUSTE 1: Puerto dinámico 
const PORT = process.env.PORT || 3004;

// Middlewares
app.use(bodyParser.json());
const allowedOrigins = [
'',
'http://localhost:3000'
];
// AJUSTE 2: CORS abierto o con tu futura URL de Vercel
app.use(cors({
  origin: function (origin, callback) {
if (!origin) return callback(null, true);
if (allowedOrigins.indexOf(origin) !== -1) {
callback(null, true);
} else {
callback(new Error('Bloqueado por CORS'));
}
},
methods: ['GET', 'POST', 'PUT', 'DELETE'],
credentials: true
}));

let db; 

(async () => {
  try {
    // Conexión flexible
    db = await mysql.createConnection({
      host: process.env.MYSQLHOST || 'localhost',
      user: process.env.MYSQLUSER || 'root',
      password: process.env.MYSQLPASSWORD || '061105',
      database: process.env.MYSQLDATABASE || 'muebles',
      port: parseInt(process.env.MYSQLPORT) || 3306,
    });

    console.log('Conexión a la base de datos exitosa.');

    // Rutas
    const productoRoutes = require('./routes/Productos')(db);
    app.use('/api/productos', productoRoutes);

    const clientesRoutes = require('./routes/Clientes')(db);
    app.use('/api/clientes', clientesRoutes);



    app.get('/', (req, res) => {
      res.send('API de Mueblería funcionando en la nube.');
    });

    // AJUSTE 3: Escuchar en todas las interfaces para Render
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor corriendo en puerto: ${PORT}`);
    });

  } catch (error) {
    console.error('Error conectando a la base de datos:', error);
  }
})();
