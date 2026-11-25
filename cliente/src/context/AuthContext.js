
import React, {
    createContext,
    useContext,
    useState,
    useEffect
} from 'react';

import axios from 'axios';

const AuthContext = createContext(null);

// =====================================
// CONFIGURACIÓN DE LA API
// =====================================

// En producción utiliza Render.
// En desarrollo local utiliza localhost.
// También permite configurar la URL mediante variables de entorno.

const API_BASE_URL =
    process.env.REACT_APP ||
    (process.env.NODE_ENV === 'production'
        ? 'https://muebleria-backend-9kfb.onrender.com'
        : 'http://localhost:3004');

const API_URL = `${API_BASE_URL.replace(/\/+$/, '')}/api`;

export function AuthProvider({ children }) {

    const [token, setToken] = useState(
        () => localStorage.getItem('token')
    );

    const [usuario, setUsuario] = useState(() => {
        try {
            const guardado = localStorage.getItem('administrador');
            return guardado ? JSON.parse(guardado) : null;
        } catch {
            localStorage.removeItem('administrador');
            return null;
        }
    });

    // =====================================
    // CONFIGURACIÓN AUTOMÁTICA DEL JWT
    // =====================================

    useEffect(() => {

        if (token) {
            axios.defaults.headers.common.Authorization =
                `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common.Authorization;
        }

        return () => {
            delete axios.defaults.headers.common.Authorization;
        };

    }, [token]);

    // =====================================
    // INICIAR SESIÓN
    // =====================================

    const login = async (usuario, password) => {

        const response = await axios.post(
            `${API_URL}/auth/login`,
            { usuario, password }
        );

        const {
            token: nuevoToken,
            administrador
        } = response.data;

        if (!nuevoToken || !administrador) {
            throw new Error(
                'La respuesta del servidor no contiene los datos esperados.'
            );
        }

        localStorage.setItem('token', nuevoToken);

        localStorage.setItem(
            'administrador',
            JSON.stringify(administrador)
        );

        setToken(nuevoToken);
        setUsuario(administrador);

        return response.data;
    };

    // =====================================
    // CERRAR SESIÓN
    // =====================================

    const logout = () => {

        localStorage.removeItem('token');
        localStorage.removeItem('administrador');

        setToken(null);
        setUsuario(null);
    };

    // =====================================
    // CONTEXTO DE AUTENTICACIÓN
    // =====================================

    return (
        <AuthContext.Provider
            value={{
                token,
                usuario,
                autenticado: Boolean(token),
                login,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
