
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Navbar from './Navbar'; 
import ProductoPage from './Producto'; 
import ClientePage from './ClientePage'; 
import './App.css'; 


const Inicio = () => (
  <div className="flex flex-col items-center">
    
    <div className="md:w-1/2 text-center md:text-left mb-12 mt-10 px-6">
      <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-4">
        Mueblería <span className="text-indigo-600">El Márquez</span>
      </h1>
      <p className="text-xl italic text-gray-600 mb-6">
        "Donde cada pieza cuenta una historia"
      </p>
      <p className="text-gray-700 text-lg mb-8 max-w-lg">
        Descubre nuestra exclusiva colección de muebles diseñados para transformar tu espacio. 
        Calidad, confort y estilo para el hogar de tus sueños.
      </p>
      <Link to="/clientes" className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-full font-bold hover:bg-indigo-700 transition shadow-lg">
        VENDER
      </Link>
    </div>

    
  </div>
);

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        {/* El Navbar se mantiene fijo en todas las rutas */}
        <Navbar />
        
        <main className="py-6">
          <Routes>
            {/* La ruta principal "/" ahora carga el componente Inicio */}
            <Route path="/" element={<Inicio />} />
            
            {/* Rutas para tus otras páginas */}
            <Route path="/productos" element={<ProductoPage />} />
            <Route path="/clientes" element={<ClientePage />} />
            
            {/* Manejo de errores 404 */}
            <Route path="*" element={
              <div className="text-center mt-20">
                <h2 className="text-3xl font-bold text-red-500">Error 404</h2>
                <p className="text-gray-600 mt-2">Página No Encontrada</p>
                <Link to="/" className="text-indigo-600 underline mt-4 inline-block">Volver al Inicio</Link>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;