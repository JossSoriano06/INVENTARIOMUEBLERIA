
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';

// URL del backend.
// También admite que REACT_APP_API_URL termine en /api/productos.
const API_BASE_URL = (
    process.env.REACT_APP_API_URL || 'http://localhost:3004'
).replace(/\/api\/productos\/?$/, '').replace(/\/$/, '');

const API_URL = `${API_BASE_URL}/api/dashboard`;

const COLORES_ESTADOS = ['#4f46e5', '#f59e0b', '#10b981', '#ef4444'];

const formatoMoneda = (valor) => {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN'
    }).format(Number(valor) || 0);
};

const Dashboard = () => {

    // Estados principales
    const [periodo, setPeriodo] = useState('mes');
    const [datos, setDatos] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Obtener información del Dashboard
    const obtenerDashboard = useCallback(async () => {
        try {
            setLoading(true);
            setError('');

            const response = await axios.get(API_URL, {
                params: { periodo }
            });

            setDatos(response.data);

        } catch (err) {
            console.error('Error al obtener el dashboard:', err);

            if (err.response?.status === 401) {
                setError('Tu sesión ha expirado. Vuelve a iniciar sesión.');
            } else {
                setError(
                    err.response?.data?.mensaje ||
                    'No se pudo cargar la información del Dashboard.'
                );
            }
        } finally {
            setLoading(false);
        }
    }, [periodo]);

    // Actualizar cuando cambia el periodo
    useEffect(() => {
        obtenerDashboard();
    }, [obtenerDashboard]);

    // Datos recibidos del backend
    const resumen = datos?.resumen || {};

    const grafico = datos?.grafico || [];

    const clientesRecurrentes = datos?.clientes_recurrentes || [];

    const productosMasVendidos = datos?.productos_mas_vendidos || [];

    const ventasPorEstado = datos?.ventas_por_estado || [];

    // Indicadores principales
    const indicadores = [
        {
            titulo: 'Ventas realizadas',
            valor: resumen.total_ventas ?? 0,
            descripcion: 'Cantidad de ventas registradas',
            icono: '🛒',
            color: 'bg-indigo-50 text-indigo-600'
        },
        {
            titulo: 'Ingresos por ventas',
            valor: formatoMoneda(resumen.ingresos),
            descripcion: 'Importe total de las ventas',
            icono: '💰',
            color: 'bg-emerald-50 text-emerald-600'
        },
        {
            titulo: 'Clientes compradores',
            valor: resumen.clientes_compradores ?? 0,
            descripcion: 'Clientes que realizaron compras',
            icono: '👥',
            color: 'bg-blue-50 text-blue-600'
        },
        {
            titulo: 'Productos registrados',
            valor: resumen.total_productos ?? 0,
            descripcion: 'Productos disponibles en el sistema',
            icono: '🪑',
            color: 'bg-amber-50 text-amber-600'
        },
        {
            titulo: 'Clientes registrados',
            valor: resumen.total_clientes ?? 0,
            descripcion: 'Total de clientes registrados',
            icono: '🤝',
            color: 'bg-purple-50 text-purple-600'
        }
    ];

    // Personalizar tooltip de ingresos
    const TooltipIngresos = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 rounded-xl shadow-lg border border-gray-100">
                    <p className="font-semibold text-gray-700 mb-1">
                        {label}
                    </p>

                    {payload.map((item, index) => (
                        <p
                            key={index}
                            className="text-sm"
                            style={{ color: item.color }}
                        >
                            {item.name}: {
                                item.dataKey === 'ingresos'
                                    ? formatoMoneda(item.value)
                                    : item.value
                            }
                        </p>
                    ))}
                </div>
            );
        }

        return null;
    };

    // Pantalla de carga
    if (loading && !datos) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>

                <p className="mt-4 text-gray-500 font-medium">
                    Cargando información del Dashboard...
                </p>
            </div>
        );
    }

    // Pantalla de error
    if (error && !datos) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
                <div className="text-5xl mb-4">⚠️</div>

                <h2 className="text-xl font-bold text-gray-800">
                    No se pudo cargar el Dashboard
                </h2>

                <p className="text-gray-500 text-center mt-2 mb-5">
                    {error}
                </p>

                <button
                    onClick={obtenerDashboard}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">

            {/* ENCABEZADO */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">

                <div>
                    <p className="text-sm font-semibold text-indigo-600 mb-1">
                        MUEBLERÍA EL MÁRQUEZ
                    </p>

                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                        Dashboard
                    </h1>

                
                </div>

                {/* FILTROS */}
                <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-xl shadow-sm border border-gray-100">

                    {[
                        { id: 'hoy', nombre: 'Hoy' },
                        { id: 'semana', nombre: 'Semana' },
                        { id: 'mes', nombre: 'Mes' },
                        { id: 'todo', nombre: 'Todo' }
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setPeriodo(item.id)}
                            disabled={loading}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                                periodo === item.id
                                    ? 'bg-indigo-600 text-white shadow-md'
                                    : 'text-gray-500 hover:bg-gray-100'
                            }`}
                        >
                            {item.nombre}
                        </button>
                    ))}

                    <button
                        onClick={obtenerDashboard}
                        disabled={loading}
                        title="Actualizar información"
                        className="ml-1 p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-indigo-600 transition"
                    >
                        <span className={loading ? 'inline-block animate-spin' : ''}>
                            ↻
                        </span>
                    </button>
                </div>
            </div>

            {/* ERROR DE ACTUALIZACIÓN */}
            {error && (
                <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                    {error}
                </div>
            )}

            {/* TARJETAS DE INDICADORES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">

                {indicadores.map((item, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition"
                    >
                        <div className="flex items-center justify-between mb-4">

                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${item.color}`}>
                                {item.icono}
                            </div>

                            <span className="text-xs font-semibold text-gray-400">
                                {periodo === 'todo' ? 'Histórico' : 'Periodo'}
                            </span>
                        </div>

                        <p className="text-sm text-gray-500 font-medium">
                            {item.titulo}
                        </p>

                        <h3 className="text-2xl font-bold text-gray-800 mt-1 break-words">
                            {item.valor}
                        </h3>

                        <p className="text-xs text-gray-400 mt-2">
                            {item.descripcion}
                        </p>
                    </div>
                ))}

            </div>

            {/* GRÁFICOS PRINCIPALES */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">

                {/* GRÁFICO DE INGRESOS */}
                <div className="xl:col-span-2 bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">

                        <div>
                            <h2 className="text-lg font-bold text-gray-800">
                                Evolución de ventas
                            </h2>

                            <p className="text-sm text-gray-400 mt-1">
                                Comportamiento de las ventas e ingresos
                            </p>
                        </div>

                        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg">
                            {periodo === 'hoy' && 'HOY'}
                            {periodo === 'semana' && 'ESTA SEMANA'}
                            {periodo === 'mes' && 'ESTE MES'}
                            {periodo === 'todo' && 'HISTÓRICO'}
                        </span>
                    </div>

                    <div className="w-full h-72">

                        {grafico.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">

                                <AreaChart
                                    data={grafico}
                                    margin={{
                                        top: 10,
                                        right: 10,
                                        left: 5,
                                        bottom: 5
                                    }}
                                >
                                    <defs>
                                        <linearGradient
                                            id="colorIngresos"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="#4f46e5"
                                                stopOpacity={0.25}
                                            />

                                            <stop
                                                offset="95%"
                                                stopColor="#4f46e5"
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                    </defs>

                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke="#e5e7eb"
                                    />

                                    <XAxis
                                        dataKey="fecha"
                                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />

                                    <YAxis
                                        yAxisId="left"
                                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                                        axisLine={false}
                                        tickLine={false}
                                        allowDecimals={false}
                                        width={35}
                                    />

                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(value) =>
                                            `S/${value}`
                                        }
                                        width={55}
                                    />

                                    <Tooltip content={<TooltipIngresos />} />

                                    <Legend />

                                    <Area
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="ingresos"
                                        name="Ingresos"
                                        stroke="#4f46e5"
                                        strokeWidth={3}
                                        fill="url(#colorIngresos)"
                                        activeDot={{ r: 6 }}
                                    />

                                    <Area
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="cantidad_ventas"
                                        name="Cantidad de ventas"
                                        stroke="#10b981"
                                        strokeWidth={2}
                                        fill="transparent"
                                    />

                                </AreaChart>

                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                                No hay ventas registradas en este periodo.
                            </div>
                        )}

                    </div>
                </div>

                {/* ESTADOS DE PAGO */}
                <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">

                    <h2 className="text-lg font-bold text-gray-800">
                        Estados de pago
                    </h2>

                    <p className="text-sm text-gray-400 mt-1">
                        Distribución de las ventas
                    </p>

                    <div className="w-full h-64 mt-4">

                        {ventasPorEstado.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">

                                <PieChart>

                                    <Pie
                                        data={ventasPorEstado}
                                        dataKey="cantidad"
                                        nameKey="estado_pago"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={65}
                                        outerRadius={95}
                                        paddingAngle={4}
                                    >
                                        {ventasPorEstado.map((item, index) => (
                                            <Cell
                                                key={`estado-${index}`}
                                                fill={COLORES_ESTADOS[index % COLORES_ESTADOS.length]}
                                            />
                                        ))}
                                    </Pie>

                                    <Tooltip
                                        formatter={(value, name) => [
                                            value,
                                            name
                                        ]}
                                    />

                                </PieChart>

                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                                No hay información de pagos.
                            </div>
                        )}

                    </div>

                    <div className="space-y-3 mt-2">

                        {ventasPorEstado.map((item, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between gap-2"
                            >
                                <div className="flex items-center gap-2 min-w-0">

                                    <span
                                        className="w-3 h-3 rounded-full flex-shrink-0"
                                        style={{
                                            backgroundColor: COLORES_ESTADOS[index % COLORES_ESTADOS.length]
                                        }}
                                    />

                                    <span className="text-sm text-gray-600 truncate">
                                        {item.estado_pago || 'Sin estado'}
                                    </span>
                                </div>

                                <span className="text-sm font-bold text-gray-800">
                                    {item.cantidad}
                                </span>
                            </div>
                        ))}

                    </div>

                </div>

            </div>

            {/* RANKINGS */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                {/* CLIENTES RECURRENTES */}
                <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">

                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-gray-800">
                            Clientes más recurrentes
                        </h2>

                        <p className="text-sm text-gray-400 mt-1">
                            Clientes con mayor cantidad de compras
                        </p>
                    </div>

                    {clientesRecurrentes.length > 0 ? (

                        <div className="space-y-4">

                            {clientesRecurrentes.map((cliente, index) => (
                                <div
                                    key={cliente.id_clientes}
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition"
                                >

                                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold flex-shrink-0">
                                        {index + 1}
                                    </div>

                                    <div className="flex-1 min-w-0">

                                        <p className="font-semibold text-gray-800 truncate">
                                            {cliente.nombre_cliente} {cliente.apellido_cliente}
                                        </p>

                                        <p className="text-xs text-gray-400 mt-1">
                                            {cliente.cantidad_compras} compras
                                        </p>

                                    </div>

                                    <div className="text-right">
                                        <p className="font-bold text-sm text-gray-800">
                                            {formatoMoneda(cliente.total_comprado)}
                                        </p>

                                        <p className="text-xs text-gray-400">
                                            Total comprado
                                        </p>
                                    </div>

                                </div>
                            ))}

                        </div>

                    ) : (
                        <p className="text-center py-10 text-gray-400 text-sm">
                            No hay clientes con compras en este periodo.
                        </p>
                    )}

                </div>

                {/* PRODUCTOS MÁS VENDIDOS */}
                <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">

                    <div className="mb-6">
                        <h2 className="text-lg font-bold text-gray-800">
                            Productos más vendidos
                        </h2>

                        <p className="text-sm text-gray-400 mt-1">
                            Productos con mayor cantidad de unidades vendidas
                        </p>
                    </div>

                    {productosMasVendidos.length > 0 ? (

                        <div className="space-y-5">

                            {productosMasVendidos.map((producto, index) => {

                                const maximo = Math.max(
                                    ...productosMasVendidos.map(
                                        p => Number(p.unidades_vendidas) || 0
                                    ),
                                    1
                                );

                                const porcentaje =
                                    (Number(producto.unidades_vendidas) / maximo) * 100;

                                return (
                                    <div key={producto.id_producto}>

                                        <div className="flex justify-between items-center gap-3 mb-2">

                                            <div className="flex items-center gap-2 min-w-0">

                                                <span className="text-xs font-bold text-gray-400">
                                                    #{index + 1}
                                                </span>

                                                <span className="font-semibold text-sm text-gray-700 truncate">
                                                    {producto.nombre_producto}
                                                </span>

                                            </div>

                                            <span className="text-sm font-bold text-indigo-600 flex-shrink-0">
                                                {producto.unidades_vendidas} und.
                                            </span>

                                        </div>

                                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">

                                            <div
                                                className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${porcentaje}%`
                                                }}
                                            />

                                        </div>

                                        <p className="text-xs text-gray-400 mt-1 text-right">
                                            {formatoMoneda(producto.ingresos_generados)}
                                        </p>

                                    </div>
                                );
                            })}

                        </div>

                    ) : (
                        <p className="text-center py-10 text-gray-400 text-sm">
                            No hay productos vendidos en este periodo.
                        </p>
                    )}

                </div>

            </div>

            

        </div>
    );
};

export default Dashboard;
