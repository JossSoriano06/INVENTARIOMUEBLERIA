import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import ProductoPage from './Producto'; 
import ClientePage from './ClientePage'; 
import './App.css'; 

// === COMPONENTE HEADER MÓVIL ===
const Header = () => (
  <header className="fixed top-0 left-0 right-0 bg-slate-900 text-white h-16 px-4 flex items-center justify-between z-50 shadow-lg">
    <div className="flex items-center gap-3">
      <div className="bg-white p-1 rounded-lg shadow-sm flex items-center justify-center w-12 h-12">
  <img 
    src="/logoo.png" 
    alt="Logo El Márquez" 
    className="w-full h-full object-cover" 
  />
</div>
      <div>
        <h1 className="text-sm font-bold leading-tight uppercase tracking-tight">Mueblería</h1>
        <p className="text-[10px] text-red-200 font-bold uppercase tracking-widest">El Márquez</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-full border-2 border-slate-700 bg-slate-800 flex items-center justify-center">
        <span className="text-xs font-bold text-slate-300">DM</span>
      </div>
    </div>
  </header>
);

// === COMPONENTE FOOTER MÓVIL (NAVBAR) ===
const MobileFooter = () => {
  const location = useLocation();
  
  const menuItems = [
    { path: '/', label: 'Inicio', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/productos', label: 'Muebles', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { path: '/clientes', label: 'Vender', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-16 flex items-center justify-around z-50 pb-safe">
      {menuItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex flex-col items-center justify-center w-full h-full transition-all relative ${
              isActive ? 'text-indigo-600' : 'text-slate-400'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
            </svg>
            <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">
              {item.label}
            </span>
            {isActive && (
              <div className="absolute bottom-0 w-8 h-1 bg-indigo-600 rounded-t-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
};

const Inicio = () => (
  <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
    <div className="bg-indigo-100 p-4 rounded-3xl mb-6">
       <span className="text-4xl">🏠</span>
    </div>
    <h1 className="text-4xl font-black text-slate-900 leading-tight mb-4">
      Bienvenido a <br/>
      <span className="text-indigo-600">El Márquez</span>
    </h1>
    <p className="text-slate-500 text-lg mb-8">
      Gestión de inventario y ventas en tiempo real.
    </p>
    <Link to="/clientes" className="w-full max-w-xs bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition active:scale-95">
      INICIAR VENTA
    </Link>
  </div>
);

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Encabezado Fijo */}
        <Header />
        
        {/* Contenido Principal con Scroll */}
        <main className="flex-1 pt-20 pb-24"> 
          <Routes>
            <Route path="/" element={<Inicio />} />
            <Route path="/productos" element={<ProductoPage />} />
            <Route path="/clientes" element={<ClientePage />} />
            <Route path="*" element={
              <div className="text-center mt-20 px-6">
                <h2 className="text-2xl font-bold text-slate-900">Página no encontrada</h2>
                <Link to="/" className="text-indigo-600 font-bold mt-4 inline-block">Volver al Inicio</Link>
              </div>
            } />
          </Routes>
        </main>

        {/* Navegación Inferior Fija */}
        <MobileFooter />
      </div>
    </Router>
  );
}

export default App;