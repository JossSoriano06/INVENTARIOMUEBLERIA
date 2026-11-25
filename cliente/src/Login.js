
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [nombre_usuario, setNombreUsuario] = useState('');
    const [password, setPassword] = useState('');
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

    const manejarLogin = async (e) => {
        e.preventDefault();

        setError('');
        setCargando(true);

        try {
            await login(nombre_usuario, password);
            navigate('/', { replace: true });
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Usuario o contraseña incorrectos.'
            );
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">

            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

                {/* ENCABEZADO */}
                <div className="text-center mb-8">

                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm border border-slate-100 overflow-hidden p-1">
                        <img
                            src="/logoo.png"
                            alt="Logo Mueblería El Márquez"
                            className="w-full h-full object-contain"
                        />
                    </div>

                    <h1 className="text-2xl font-bold text-slate-900">
                        Mueblería El Márquez
                    </h1>

                </div>

                {/* FORMULARIO */}
                <form onSubmit={manejarLogin} className="space-y-5">

                    {/* USUARIO */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Usuario
                        </label>

                        <input
                            type="text"
                            value={nombre_usuario}
                            onChange={(e) => setNombreUsuario(e.target.value)}
                            placeholder="Ingresa tu usuario"
                            required
                            autoComplete="username"
                            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-slate-800 focus:ring-2 focus:ring-slate-100"
                        />
                    </div>

                    {/* CONTRASEÑA */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Contraseña
                        </label>

                        <div className="relative">

                            <input
                                type={mostrarPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Ingresa tu contraseña"
                                required
                                autoComplete="current-password"
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-12 outline-none transition focus:border-slate-800 focus:ring-2 focus:ring-slate-100"
                            />

                            {/* BOTÓN MOSTRAR / OCULTAR */}
                            <button
                                type="button"
                                onClick={() => setMostrarPassword(!mostrarPassword)}
                                className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 hover:text-slate-900 transition"
                                aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                title={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            >

                                {mostrarPassword ? (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-5 h-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M3 3l18 18M10.58 10.59a2 2 0 002.83 2.83M9.88 5.09A10.94 10.94 0 0112 4.9c5.05 0 8.27 3.11 9.5 7.1a10.65 10.65 0 01-4.12 5.3M6.61 6.61A10.7 10.7 0 002.5 12c.7 2.1 2.1 3.7 4.1 5.1A10.8 10.8 0 0012 19.1c.8 0 1.6-.1 2.3-.3"
                                        />
                                    </svg>
                                ) : (
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-5 h-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z"
                                        />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}

                            </button>
                        </div>
                    </div>

                    {/* MENSAJE DE ERROR */}
                    {error && (
                        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* BOTÓN INICIAR SESIÓN */}
                    <button
                        type="submit"
                        disabled={cargando}
                        className="w-full rounded-lg bg-slate-900 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {cargando ? 'Iniciando sesión...' : 'Iniciar sesión'}
                    </button>

                </form>

                {/* PIE */}
                <p className="mt-8 text-center text-xs text-gray-400">
                    © {new Date().getFullYear()} Mueblería El Márquez
                </p>

            </div>
        </div>
    );
}

export default Login;
