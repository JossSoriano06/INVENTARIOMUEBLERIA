// src/Navbar.js

import React from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  return (
    <nav className="bg-indigo-800 p-4 shadow-xl">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-xl font-bold text-white">
          <Link to="/" className="hover:text-indigo-200 transition duration-150">
            Mueblería 
          </Link>
        </div>
        <div className="space-x-4">
     
          <Link to="/productos" className="text-white hover:text-indigo-200 transition duration-150 font-medium">
            Inventario
          </Link>
          
         
          <Link to="/clientes" className="text-white hover:text-indigo-200 transition duration-150 font-medium">
            Clientes
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;