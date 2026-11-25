
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Link,
    Navigate,
    useLocation,
    useNavigate
} from 'react-router-dom';

import ProductoPage from './Producto';
import ClientePage from './ClientePage';
import Login from './Login';
import Dashboard from './Dashboard';

import { AuthProvider, useAuth } from './context/AuthContext';

import './App.css';

// ==========================================
// COMPONENTE HEADER
// ==========================================

const Header = () => {

    const { usuario, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    const iniciales = usuario?.nombre_usuario
        ? usuario.nombre_usuario.substring(0, 2).toUpperCase()
        : 'AD';

    return (
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
                    <h1 className="text-sm font-bold leading-tight uppercase tracking-tight">
                        Mueblería
                    </h1>

                    <p className="text-[10px] text-red-200 font-bold uppercase tracking-widest">
                        El Márquez
                    </p>
                </div>

            </div>

            <div className="flex items-center gap-3">

                <div className="hidden sm:block text-right">
                    <p className="text-xs font-semibold text-white">
                        {usuario?.nombre_completo || usuario?.usuario || 'Administrador'}
                    </p>

                    <p className="text-[10px] text-slate-400 uppercase">
                        Administrador
                    </p>
                </div>

                <div className="h-9 w-9 rounded-full border-2 border-slate-700 bg-slate-800 flex items-center justify-center">
                    <span className="text-xs font-bold text-slate-300">
                        {iniciales}
                    </span>
                </div>

                <button
                    onClick={handleLogout}
                    title="Cerrar sesión"
                    className="h-9 w-9 rounded-lg bg-red-600 hover:bg-red-700 flex items-center justify-center transition"
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1"
                        />
                    </svg>
                </button>

            </div>

        </header>
    );
};

// ==========================================
// PROTECCIÓN DE RUTAS
// ==========================================

const ProtectedRoute = ({ children }) => {

    const { autenticado } = useAuth();

    if (!autenticado) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

// ==========================================
// COMPONENTE FOOTER MÓVIL
// ==========================================

const MobileFooter = () => {

    const location = useLocation();

    const menuItems = [
        {
            path: '/',
            label: 'Dashboard',
            icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
        },
        {
            path: '/productos',
            label: 'Muebles',
            icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
        },
        {
            path: '/clientes',
            label: 'Vender',
            icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z'
        }
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
                            isActive
                                ? 'text-indigo-600'
                                : 'text-slate-400'
                        }`}
                    >

                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d={item.icon}
                            />
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

// ==========================================
// CONTENIDO PRINCIPAL
// ==========================================

function AppContent() {

    const location = useLocation();

    const isLogin = location.pathname === '/login';

    const { autenticado } = useAuth();

    return (

        <div className="min-h-screen bg-slate-50 flex flex-col">

            {/* RUTAS DE NAVEGACIÓN */}
            <main className={!isLogin && autenticado ? 'pt-16 pb-20 flex-1' : 'flex-1'}>

                <Routes>

                    {/* LOGIN */}
                    <Route
                        path="/login"
                        element={
                            autenticado
                                ? <Navigate to="/" replace />
                                : <Login />
                        }
                    />

                    {/* DASHBOARD */}
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* PRODUCTOS */}
                    <Route
                        path="/productos"
                        element={
                            <ProtectedRoute>
                                <ProductoPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* CLIENTES Y VENTAS */}
                    <Route
                        path="/clientes"
                        element={
                            <ProtectedRoute>
                                <ClientePage />
                            </ProtectedRoute>
                        }
                    />

                    {/* PÁGINA NO ENCONTRADA */}
                    <Route
                        path="*"
                        element={
                            <ProtectedRoute>
                                <div className="text-center mt-20 px-6">
                                    <h2 className="text-2xl font-bold text-slate-900">
                                        Página no encontrada
                                    </h2>

                                    <Link
                                        to="/"
                                        className="text-indigo-600 font-bold mt-4 inline-block"
                                    >
                                        Volver al Dashboard
                                    </Link>
                                </div>
                            </ProtectedRoute>
                        }
                    />

                </Routes>

            </main>

            {/* HEADER Y FOOTER PARA USUARIOS AUTENTICADOS */}
            {!isLogin && autenticado && (
                <>
                    <Header />
                    <MobileFooter />
                </>
            )}

        </div>
    );
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

function App() {

    return (
        <AuthProvider>
            <Router>
                <AppContent />
            </Router>
        </AuthProvider>
    );
}

export default App;
