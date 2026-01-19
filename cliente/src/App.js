// src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './Navbar'; // Importar la nueva barra de navegación
import ProductoPage from './Producto'; // Tu componente Producto.js renombrado/importado
import ClientePage from './ClientePage'; // Nuevo componente para Clientes y Ventas
import './App.css'; 

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        
        <Navbar />
        
        <main className="py-6">
          <Routes>
            
           
            <Route path="/" element={<h2 className="text-center text-3xl font-bold text-gray-800 mt-10"></h2>} />

          
            <Route path="/productos" element={<ProductoPage />} />

            
            <Route path="/clientes" element={<ClientePage/>} />
            
           
            <Route path="*" element={<h2 className="text-center text-red-500 mt-10">Error 404: Página No Encontrada</h2>} />
            
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;