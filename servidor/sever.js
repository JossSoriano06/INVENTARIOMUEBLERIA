const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 3004;

// Middlewares
app.use(bodyParser.json());
app.use(cors({
  origin: 'http://localhost:3000'
}));

let db; // conexión global

(async () => {
  try {
    // Conexión a MySQL (PROMISE)
    db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '061105',
      database: 'muebles',
    });

    console.log('Conexión a la base de datos exitosa.');

    // Rutas
    const productoRoutes = require('./routes/Productos')(db);
    app.use('/api/productos', productoRoutes);

    const clientesRoutes = require('./routes/Clientes')(db);
    app.use('/api/clientes', clientesRoutes);


    // Endpoint de prueba
    app.get('/', (req, res) => {
      res.send('API de Mueblería funcionando.');
    });

    // Iniciar servidor SOLO cuando la BD esté lista
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('Error conectando a la base de datos:', error);
  }
})();
