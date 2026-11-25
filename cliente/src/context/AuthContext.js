
import React, {
    createContext,
    useContext,
    useState,
    useEffect
} from 'react';

import axios from 'axios';

const AuthContext = createContext(null);

const API_URL = 'http://localhost:3004/api';

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

    // Configurar automáticamente el JWT en las peticiones Axios
    useEffect(() => {

        if (token) {
            axios.defaults.headers.common.Authorization = `Bearer ${token}`;
        } else {
            delete axios.defaults.headers.common.Authorization;
        }

        return () => {
            delete axios.defaults.headers.common.Authorization;
        };

    }, [token]);

    // Iniciar sesión
    const login = async (usuario, password) => {

        const response = await axios.post(
            `${API_URL}/auth/login`,
            { usuario, password }
        );

        const { token: nuevoToken, administrador } = response.data;

        if (!nuevoToken || !administrador) {
            throw new Error('La respuesta del servidor no contiene los datos esperados.');
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

    // Cerrar sesión
    const logout = () => {

        localStorage.removeItem('token');
        localStorage.removeItem('administrador');

        setToken(null);
        setUsuario(null);
    };

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
