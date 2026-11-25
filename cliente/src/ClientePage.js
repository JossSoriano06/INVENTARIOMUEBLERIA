import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BASE_URL = (
    process.env.REACT_APP_API_URL || 'http://localhost:3004'
).replace(/\/+$/, '');

const API_URL_CLIENTES = `${BASE_URL}/api/clientes`;
const API_URL_PRODUCTOS = `${BASE_URL}/api/productos`;

function ClientePage() {
    const [view, setView] = useState('LISTA_CLIENTES');
    const [loading, setLoading] = useState(false);

    const [clientes, setClientes] = useState([]);
    const [productosDisponibles, setProductosDisponibles] = useState([]);

    const [selectedClient, setSelectedClient] = useState(null);
    const [clientSales, setClientSales] = useState([]);
    const [selectedSale, setSelectedSale] = useState(null);
    const [saleItems, setSaleItems] = useState([]);
    const [pagoInicial, setPagoInicial] = useState(0);
    const [montoAbono, setMontoAbono] = useState('');
    const [loadingClientes, setLoadingClientes] = useState(false);
    const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
    const [lastVentaId, setLastVentaId] = useState(null);

    const [formDataCliente, setFormDataCliente] = useState({
        nombre_cliente: '',
        apellido_cliente: '',
        referencia_cliente: ''
    });

    const [cart, setCart] = useState([]);
    const [currentItem, setCurrentItem] = useState({
        id_producto: '',
        color: '',
        cantidad: 1,
        precio: ''
    });

    useEffect(() => {
        fetchClientes();
        fetchProductos();
    }, []);



// =====================================
// GENERAR Y VISUALIZAR BOLETA PDF
// =====================================

const generarBoleta = async (idVenta) => {

    // Abrir la pestaña durante el evento del usuario
    // para evitar que el navegador bloquee el PDF.
    const nuevaVentana = window.open('', '_blank');

    try {
        const token = localStorage.getItem('token');

        if (!token) {
            throw new Error('Tu sesión ha expirado. Inicia sesión nuevamente.');
        }

        const response = await axios.get(
            `${API_URL_CLIENTES}/ventas/${idVenta}/boleta`,
            {
                responseType: 'blob',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const tipoContenido = response.headers['content-type'] || '';

        // Comprobar que el servidor realmente devolvió un PDF.
        if (!tipoContenido.includes('application/pdf')) {
            const texto = await response.data.text();
            let mensaje = texto;

            try {
                const datos = JSON.parse(texto);
                mensaje = datos.message || texto;
            } catch {
                // Mantener el mensaje recibido.
            }

            throw new Error(mensaje || 'El servidor no devolvió un PDF.');
        }

        const archivoPDF = new Blob(
            [response.data],
            { type: 'application/pdf' }
        );

        const urlPDF = window.URL.createObjectURL(archivoPDF);

        if (nuevaVentana && !nuevaVentana.closed) {
            nuevaVentana.location.href = urlPDF;
        } else {
            // Alternativa si el navegador bloquea la ventana emergente.
            const enlace = document.createElement('a');
            enlace.href = urlPDF;
            enlace.download = `boleta_venta_${idVenta}.pdf`;
            document.body.appendChild(enlace);
            enlace.click();
            enlace.remove();
        }

        // Liberar memoria después de que el navegador haya cargado el PDF.
        setTimeout(() => {
            window.URL.revokeObjectURL(urlPDF);
        }, 300000);

    } catch (error) {

        if (nuevaVentana && !nuevaVentana.closed) {
            nuevaVentana.close();
        }

        console.error('Error al generar la boleta:', error);

        let mensaje = error.message || 'No se pudo generar la boleta.';

        if (error.response?.data instanceof Blob) {
            try {
                const texto = await error.response.data.text();
                const datos = JSON.parse(texto);
                mensaje = datos.message || mensaje;
            } catch {
                // Conservar el mensaje original.
            }
        } else if (error.response?.data?.message) {
            mensaje = error.response.data.message;
        }

        alert(mensaje);
    }
};

    const fetchClientes = async () => {
        try {
            setLoadingClientes(true);
            const res = await axios.get(API_URL_CLIENTES);
            setClientes(res.data);
        } catch (error) {
            console.error('Error al cargar clientes:', error);
            alert('No se pudieron cargar los clientes');
        } finally {
            setLoadingClientes(false);
        }
    };

    const fetchProductos = async () => {
        try {
            const res = await axios.get(API_URL_PRODUCTOS);
            setProductosDisponibles(res.data);
        } catch (error) {
            console.error('Error al cargar productos:', error);
            alert('No se pudieron cargar los productos');
        }
    };

    const handleAddCliente = async (e) => {
        e.preventDefault();
        await axios.post(API_URL_CLIENTES, formDataCliente);
        setFormDataCliente({
            nombre_cliente: '',
            apellido_cliente: '',
            referencia_cliente: ''
        });
        fetchClientes();
    };

    const handleEliminarCliente = async (id) => {
        const confirmar = window.confirm(
            "¿Estás seguro de eliminar este cliente? Se borrarán permanentemente todas sus ventas y registros asociados. Esta acción no se puede deshacer."
        );

        if (confirmar) {
            try {
                await axios.delete(`${API_URL_CLIENTES}/${id}`);
                alert("Cliente eliminado con éxito");
                fetchClientes();
            } catch (error) {
                console.error("Error al eliminar", error);
                alert("No se pudo eliminar al cliente");
            }
        }
    };

    const handleSelectProducto = (e) => {
        const id = parseInt(e.target.value);
        const prod = productosDisponibles.find(p => p.id === id);

        if (prod) {
            setCurrentItem({
                ...currentItem,
                id_producto: prod.id,
                precio: prod.precio_unitario
            });
        }
    };

    const agregarAlCarrito = () => {
        if (!currentItem.id_producto) return alert('Seleccione un producto');
        if (!currentItem.color) return alert('Seleccione un color');

        const prod = productosDisponibles.find(
            p => p.id === currentItem.id_producto
        );

        const item = {
            id_producto: prod.id,
            nombre: prod.nombre,
            color: currentItem.color,
            cantidad: Number(currentItem.cantidad),
            precio: Number(currentItem.precio),
            subtotal: Number(currentItem.cantidad) * Number(currentItem.precio)
        };

        setCart([...cart, item]);
        setCurrentItem({
            id_producto: '',
            color: '',
            cantidad: 1,
            precio: ''
        });
    };

    const removeFromCart = (index) => {
        const newCart = cart.filter((_, i) => i !== index);
        setCart(newCart);
    };

    

    const totalCarrito = cart.reduce(
        (acc, item) => acc + (item.cantidad * item.precio),
        0
    );

    const handleFinalizarVenta = async () => {
        if (!selectedClient) {
            return alert("Por favor, selecciona un cliente primero.");
        }

        if (cart.length === 0) {
            return alert("El carrito está vacío.");
        }

        if (pagoInicial > totalCarrito) {
            alert("El pago inicial no puede ser mayor al total de la venta.");
            return;
        }

        setLoading(true);

        try {
            const productos = cart.map(p => ({
                id_producto: p.id_producto,
                color: p.color,
                cantidad: Number(p.cantidad),
                precio: Number(p.precio)
            }));

            const response = await axios.post(
                `${API_URL_CLIENTES}/${selectedClient.id_clientes}/ventas`,
                {
                    productos: productos,
                    pago_inicial: Number(pagoInicial)
                }
            );

            if (response.data && response.data.id_venta) {
                setLastVentaId(response.data.id_venta);
                setShowSuccessSnackbar(true);
            } else {
                alert(
                    "Venta registrada, pero no se pudo obtener el ID para la boleta."
                );
            }

            setLastVentaId(response.data.id_venta);
            setShowSuccessSnackbar(true);

            setCart([]);
            setPagoInicial(0);
            fetchClientes();

        } catch (error) {
            console.error("Error en venta:", error);
            alert(error.response?.data?.message || "Error al procesar la venta");
        } finally {
            setLoading(false);
        }
    };

    // Registrar abono y sincronizar inmediatamente el detalle y el historial
    const handleRegistrarAbono = async () => {
        const monto = Number(montoAbono);

        if (!selectedSale) return;

        if (!Number.isFinite(monto) || monto <= 0) {
            return alert("Ingrese un monto válido");
        }

        const totalVenta = Number(selectedSale.total_venta);
        const pagadoActual = Number(selectedSale.pago_acumulado || 0);
        const saldoActual = Math.max(0, totalVenta - pagadoActual);

        if (monto > saldoActual) {
            return alert(
                `El abono no puede superar el saldo pendiente de S/ ${saldoActual.toFixed(2)}`
            );
        }

        try {
            setLoading(true);

            const res = await axios.post(
                `${API_URL_CLIENTES}/ventas/${selectedSale.id_venta}/abono`,
                { monto_abono: monto }
            );

            const nuevoPago = Number(
                res.data.nuevoPagoAcumulado ??
                res.data.total_pagado ??
                (pagadoActual + monto)
            );

            const nuevoEstado = nuevoPago >= totalVenta - 0.01
                ? 'cancelado'
                : 'pendiente';

            const ventaActualizada = {
                ...selectedSale,
                pago_acumulado: nuevoPago,
                estado_pago:
                    res.data.nuevoEstado ??
                    res.data.estado_pago ??
                    nuevoEstado
            };

            setSelectedSale(ventaActualizada);

            // Actualizar el historial sin refrescar la página
            setClientSales(ventas =>
                ventas.map(venta =>
                    Number(venta.id_venta) === Number(ventaActualizada.id_venta)
                        ? { ...venta, ...ventaActualizada }
                        : venta
                )
            );

            setMontoAbono('');
            alert(res.data.message || "Abono registrado correctamente");

        } catch (error) {
            console.error("Error al registrar abono:", error);
            alert(
                error.response?.data?.message ||
                "Error al registrar abono"
            );
        } finally {
            setLoading(false);
        }
    };

    const verHistorialVentas = async (cliente) => {
        const res = await axios.get(
            `${API_URL_CLIENTES}/${cliente.id_clientes}/ventas`
        );

        setSelectedClient(cliente);
        setClientSales(res.data);
        setView('VENTAS_CLIENTE');
    };

    const verDetalleVenta = async (venta) => {
        const res = await axios.get(
            `${API_URL_CLIENTES}/ventas/${venta.id_venta}/detalle`
        );

        setSelectedSale(venta);
        setSaleItems(res.data);
        setMontoAbono('');
        setView('DETALLE_VENTA');
    };

    const cancelarVenta = () => {
        const confirmar = window.confirm(
            '¿Estás seguro de cancelar la venta? Se perderán los datos.'
        );

        if (!confirmar) return;

        setCart([]);

        setCurrentItem({
            id_producto: '',
            nombre: '',
            precio: 0,
            cantidad: 1,
            subtotal: 0
        });

        setSelectedClient(null);
        setView('LISTA_CLIENTES');
    };

    // ================= VISTAS =================

    if (view === 'LISTA_CLIENTES') {
        return (
            <div className="container mx-auto p-6">
                <h1 className="text-3xl font-bold mb-6">
                    Gestión de Clientes
                </h1>

                <form
                    onSubmit={handleAddCliente}
                    className="grid grid-cols-1 md:flex gap-4 mb-6"
                >
                    <input
                        className="border p-2 rounded shadow-sm w-full md:w-auto flex-1"
                        placeholder="Nombre"
                        value={formDataCliente.nombre_cliente}
                        onChange={e => setFormDataCliente({
                            ...formDataCliente,
                            nombre_cliente: e.target.value
                        })}
                        required
                    />

                    <input
                        className="border p-2 rounded shadow-sm w-full md:w-auto flex-1"
                        placeholder="Apellido"
                        value={formDataCliente.apellido_cliente}
                        onChange={e => setFormDataCliente({
                            ...formDataCliente,
                            apellido_cliente: e.target.value
                        })}
                        required
                    />

                    <input
                        className="border p-2 rounded shadow-sm w-full md:w-auto flex-1"
                        placeholder="Referencia"
                        value={formDataCliente.referencia_cliente}
                        onChange={e => setFormDataCliente({
                            ...formDataCliente,
                            referencia_cliente: e.target.value
                        })}
                        required
                    />

                    <button className="bg-indigo-600 shadow-sm text-white px-6 py-2 rounded font-bold hover:bg-indigo-700 transition-colors w-full md:w-auto">
                        Agregar
                    </button>
                </form>

                <div className="overflow-x-auto">
                    {loadingClientes ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg shadow-lg border border-gray-100">
                            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                            <p className="mt-4 text-indigo-600 font-medium animate-pulse">
                                Cargando lista de clientes...
                            </p>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y shadow-lg divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Cliente
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="bg-white divide-y divide-gray-200">
                                {clientes.length > 0 ? (
                                    clientes.map(c => (
                                        <tr
                                            key={c.id_clientes}
                                            className="hover:bg-indigo-50 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {c.id_clientes}
                                            </td>

                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {c.nombre_cliente} {c.apellido_cliente}
                                                <span className="text-gray-400 text-xs">
                                                    ({c.referencia_cliente})
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 space-x-3 whitespace-nowrap">
                                                <button
                                                    onClick={() => {
                                                        setSelectedClient(c);
                                                        setView('NUEVA_VENTA');
                                                    }}
                                                    className="text-green-600 hover:text-green-800 font-bold"
                                                >
                                                    Vender
                                                </button>

                                                <button
                                                    onClick={() => verHistorialVentas(c)}
                                                    className="text-indigo-600 hover:text-indigo-800 font-bold"
                                                >
                                                    Historial
                                                </button>

                                                <button
                                                    onClick={() => handleEliminarCliente(c.id_clientes)}
                                                    className="text-red-500 hover:text-red-700 text-xs font-bold"
                                                >
                                                    ELIMINAR
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="3"
                                            className="px-6 py-10 text-center text-gray-500 italic"
                                        >
                                            No se encontraron clientes registrados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        );
    }

    if (view === 'NUEVA_VENTA') {
        return (
            <div className="container mx-auto pl-6 pr-6">
                <button
                    onClick={() => setView('LISTA_CLIENTES')}
                    className="mb-4 text-indigo-600"
                >
                    ← Volver
                </button>

                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 mb-8">
                    <h3 className="text-sm font-bold text-gray-600 uppercase mb-4 tracking-widest">
                        Nueva venta - {selectedClient.nombre_cliente}
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                        <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-1">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                                Producto
                            </label>

                            <select
                                className="w-full border-2 border-gray-100 rounded-lg p-2.5 bg-gray-50 focus:bg-white focus:border-indigo-500 transition-all outline-none cursor-pointer text-sm"
                                value={currentItem.id_producto}
                                onChange={handleSelectProducto}
                            >
                                <option value="">Seleccionar...</option>
                                {productosDisponibles.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                                Color
                            </label>

                            <select
                                className="w-full border-2 border-gray-100 rounded-lg p-2.5 bg-gray-50 focus:bg-white focus:border-indigo-500 transition-all outline-none cursor-pointer text-sm"
                                value={currentItem.color}
                                onChange={e => setCurrentItem({
                                    ...currentItem,
                                    color: e.target.value
                                })}
                            >
                                <option value="">Color</option>
                                <option value="Ibiza">Ibiza</option>
                                <option value="Chantilly">Chantilly</option>
                                <option value="Humo">Humo</option>
                                <option value="Wenge">Wenge</option>
                                <option value="Cedro">Cedro</option>
                                <option value="Lila">Lila</option>
                                <option value="Rosado">Rosado</option>
                                <option value="Arena">Arena</option>
                                <option value="Light Sonoma">Light Sonoma</option>
                                <option value="Caramelo">Caramelo</option>
                                <option value="Blanco">Blanco</option>
                                <option value="Natural">N/A</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                                Precio
                            </label>

                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                                    S/
                                </span>

                                <input
                                    type="number"
                                    className="w-full border-2 border-gray-100 rounded-lg p-2.5 pl-8 bg-gray-50 focus:bg-white focus:border-indigo-500 transition-all outline-none text-sm"
                                    value={currentItem.precio}
                                    onChange={e => setCurrentItem({
                                        ...currentItem,
                                        precio: e.target.value
                                    })}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">
                                Cant.
                            </label>

                            <input
                                type="number"
                                className="w-full border-2 border-gray-100 rounded-lg p-2.5 bg-gray-50 focus:bg-white focus:border-indigo-500 transition-all outline-none text-sm"
                                value={currentItem.cantidad}
                                onChange={e => setCurrentItem({
                                    ...currentItem,
                                    cantidad: e.target.value
                                })}
                            />
                        </div>

                        <button
                            onClick={agregarAlCarrito}
                            className="w-full lg:w-full h-[46px] bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white font-bold rounded-lg shadow-md shadow-green-100 transition-all flex items-center justify-center gap-2 mt-2 lg:mt-0"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span>Añadir</span>
                        </button>
                    </div>
                </div>

                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th>Producto</th>
                            <th>Color</th>
                            <th>Cant</th>
                            <th>Precio</th>
                            <th>Subtotal</th>
                            <th>Accion</th>
                        </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200 text-center">
                        {cart.map((i, idx) => (
                            <tr key={idx}>
                                <td>{i.nombre}</td>
                                <td>{i.color}</td>
                                <td>{i.cantidad}</td>
                                <td>S/ {i.precio}</td>
                                <td>S/ {i.subtotal.toFixed(2)}</td>

                                <td className="px-4 py-2">
                                    <button
                                        onClick={() => removeFromCart(idx)}
                                        className="text-red-600 hover:text-white p-2 rounded-lg transition-all duration-300 flex items-center justify-center mx-auto"
                                        title="Eliminar producto"
                                    >
                                        <span className="text-sm font-bold">
                                            Quitar
                                        </span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-gray-600">Total a pagar:</p>
                            <p className="text-2xl font-bold text-indigo-700 font-mono">
                                S/ {totalCarrito.toFixed(2)}
                            </p>
                        </div>

                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1">
                                Pago Inicial (Acuenta):
                            </label>

                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-500 font-mono">
                                    S/
                                </span>

                                <input
                                    type="number"
                                    value={pagoInicial === 0 ? '' : pagoInicial}
                                    onChange={(e) => setPagoInicial(Number(e.target.value))}
                                    className="pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 w-full md:w-48 font-mono"
                                    placeholder="0.00"
                                    min="0"
                                    max={totalCarrito}
                                />
                            </div>

                            {pagoInicial < totalCarrito && pagoInicial > 0 && (
                                <span className="text-xs text-orange-600 mt-1 font-medium">
                                    Quedará un saldo de: S/ {(totalCarrito - pagoInicial).toFixed(2)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 mt-4">
                    <button
                        onClick={cancelarVenta}
                        className="bg-red-600 text-white px-6 py-2 rounded font-bold hover:bg-red-700"
                    >
                        Cancelar Venta
                    </button>

                    <button
                        onClick={handleFinalizarVenta}
                        disabled={loading || cart.length === 0}
                        className={`px-6 py-2 rounded font-bold text-white transition-all ${
                            loading || cart.length === 0
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg'
                        }`}
                    >
                        {loading ? 'Procesando...' : 'Confirmar Venta'}
                    </button>
                </div>

                {showSuccessSnackbar && (
                    <div className="fixed inset-0 flex items-center justify-center z-[100] bg-black/50 backdrop-blur-sm">
                        <div className="bg-white p-8 rounded-xl shadow-2xl border-t-8 border-green-500 max-w-sm w-full mx-4 transform transition-all">
                            <div className="text-center">
                                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                                    <svg
                                        className="h-10 w-10 text-green-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M5 13l4 4L19 7"
                                        />
                                    </svg>
                                </div>

                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    ¡Venta Exitosa!
                                </h3>

                                <p className="text-gray-500 mb-8">
                                    El registro se completó correctamente.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => {
                                            generarBoleta(lastVentaId);

                                            setShowSuccessSnackbar(false);
                                            setView('LISTA_CLIENTES');
                                            setSelectedClient(null);
                                        }}
                                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700"
                                >
                                    Generar Boleta PDF
                                </button>

                                <button
                                    onClick={() => {
                                        setShowSuccessSnackbar(false);
                                        setView('LISTA_CLIENTES');
                                        setSelectedClient(null);
                                    }}
                                    className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-200 transition-all"
                                >
                                    Aceptar y Volver
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

        if (view === 'VENTAS_CLIENTE') {
        const totalHistorial = clientSales.reduce(
            (suma, venta) => suma + Number(venta.total_venta || 0),
            0
        );

        const pendientes = clientSales.filter(
            venta =>
                Number(venta.pago_acumulado || 0) <
                Number(venta.total_venta || 0) - 0.01
        ).length;

        return (
            <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
                <div className="mx-auto max-w-6xl">

                    <button
                        onClick={() => setView('LISTA_CLIENTES')}
                        className="mb-2 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-indigo-700"
                    >
                        <span>←</span> Volver a clientes
                    </button>

                    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            

                            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
                                Historial de ventas
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                {selectedClient.nombre_cliente} {selectedClient.apellido_cliente}
                            </p>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Ventas registradas
                            </p>
                            <p className="text-2xl font-bold text-slate-900">
                                {clientSales.length}
                            </p>
                        </div>
                    </div>

                    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-2xl border border-slate-500 bg-white p-4 shadow-sm">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Total vendido
                            </p>
                            <p className="mt-2 text-2xl font-extrabold text-slate-900">
                                S/ {totalHistorial.toFixed(2)}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-amber-500  bg-amber-100 p-4 shadow-sm">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                                Ventas pendientes
                            </p>
                            <p className="mt-2 text-2xl font-extrabold text-amber-600">
                                {pendientes}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-emerald-500  bg-emerald-100 p-4 shadow-sm">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                                Ventas pagadas
                            </p>
                            <p className="mt-2 text-2xl font-extrabold text-emerald-600">
                                {clientSales.length - pendientes}
                            </p>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-5 py-4">
                            <h3 className="font-bold text-slate-800">
                                Movimientos del cliente
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                                Selecciona una venta para revisar sus productos y pagos.
                            </p>
                        </div>

                        {clientSales.length === 0 ? (
                            <div className="px-5 py-14 text-center">
                                <p className="font-semibold text-slate-700">
                                    Aún no hay ventas registradas
                                </p>

                                <p className="mt-1 text-sm text-slate-500">
                                    Cuando registres una venta, aparecerá en este historial.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                                Venta
                                            </th>
                                            <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                                Fecha
                                            </th>
                                            <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                                                Total
                                            </th>
                                            <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                                                Pagado
                                            </th>
                                            <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                                                Estado
                                            </th>
                                            <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                                                Acción
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                        {clientSales.map(venta => {
                                            const total = Number(venta.total_venta || 0);
                                            const pagado = Number(venta.pago_acumulado || 0);
                                            const estaPagada = pagado >= total - 0.01;

                                            return (
                                                <tr
                                                    key={venta.id_venta}
                                                    className="transition hover:bg-slate-50"
                                                >
                                                    <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-slate-800">
                                                        #{venta.id_venta}
                                                    </td>

                                                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                                                        {venta.fecha_vente
                                                            ? new Date(venta.fecha_vente).toLocaleDateString('es-PE')
                                                            : '—'}
                                                    </td>

                                                    <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-semibold text-slate-800">
                                                        S/ {total.toFixed(2)}
                                                    </td>

                                                    <td className="whitespace-nowrap px-5 py-4 text-right text-sm text-emerald-700">
                                                        S/ {pagado.toFixed(2)}
                                                    </td>

                                                    <td className="whitespace-nowrap px-5 py-4 text-center">
                                                        <span
                                                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                                                                estaPagada
                                                                    ? 'bg-emerald-50 text-emerald-700'
                                                                    : 'bg-amber-50 text-amber-700'
                                                            }`}
                                                        >
                                                            {estaPagada ? 'Pagado' : 'Pendiente'}
                                                        </span>
                                                    </td>

                                                    <td className="whitespace-nowrap px-5 py-4 text-center">
                                                        <button
                                                            onClick={() => verDetalleVenta(venta)}
                                                            className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100"
                                                        >
                                                            Ver detalle →
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }


        if (view === 'DETALLE_VENTA') {
        const totalVenta = Number(selectedSale?.total_venta || 0);
        const pagado = Number(selectedSale?.pago_acumulado || 0);
        const saldoPendiente = Math.max(0, totalVenta - pagado);

        const porcentajePagado = totalVenta > 0
            ? Math.min(100, (pagado / totalVenta) * 100)
            : 0;

        const estaPagada = saldoPendiente <= 0.01;

        return (
            <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-8">
                <div className="mx-auto max-w-6xl">

                    <button
                        onClick={() => setView('VENTAS_CLIENTE')}
                        className="mb-5 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-indigo-700"
                    >
                        <span>←</span> Volver al historial
                    </button>

                    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                                Comprobante de venta
                            </p>

                            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
                                Venta #{selectedSale.id_venta}
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Cliente: {selectedClient.nombre_cliente} {selectedClient.apellido_cliente}
                            </p>
                        </div>

                        <span
                            className={`inline-flex w-fit rounded-full px-4 py-2 text-xs font-bold ${
                                estaPagada
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-amber-50 text-amber-700'
                            }`}
                        >
                            {estaPagada ? '✓ Venta pagada' : '● Pago pendiente'}
                        </span>
                    </div>

                    <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-slate-500 bg-white p-5 shadow-sm">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Total de venta
                            </p>
                            <p className="mt-2 text-2xl font-extrabold text-slate-900">
                                S/ {totalVenta.toFixed(2)}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-emerald-500 bg-emerald p-5 shadow-sm">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Total pagado
                            </p>
                            <p className="mt-2 text-2xl font-extrabold text-emerald-600">
                                S/ {pagado.toFixed(2)}
                            </p>
                        </div>

                        <div className="rounded-2xl border border-rose-500 bg-rose p-5 shadow-sm">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Saldo pendiente
                            </p>
                            <p
                                className={`mt-2 text-2xl font-extrabold ${
                                    estaPagada ? 'text-emerald-600' : 'text-rose-600'
                                }`}
                            >
                                S/ {saldoPendiente.toFixed(2)}
                            </p>
                        </div>
                    </div>

                    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="mb-2 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800">
                                Progreso de pago
                            </h3>

                            <span className="text-sm font-bold text-indigo-700">
                                {porcentajePagado.toFixed(0)}%
                            </span>
                        </div>

                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                            <div
                                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                style={{ width: `${porcentajePagado}%` }}
                            />
                        </div>

                        <p className="mt-2 text-xs text-slate-500">
                            {estaPagada
                                ? 'Esta venta se encuentra completamente pagada.'
                                : `Falta pagar S/ ${saldoPendiente.toFixed(2)} para completar la venta.`}
                        </p>
                    </div>

                    <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-5 py-4">
                            <h3 className="font-bold text-slate-800">
                                Productos de la venta
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                                Detalle de los artículos, cantidades y subtotales.
                            </p>
                        </div>

                        {saleItems.length === 0 ? (
                            <p className="px-5 py-8 text-center text-sm text-slate-500">
                                No hay productos para mostrar.
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                                                Producto
                                            </th>
                                            <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                                                Color
                                            </th>
                                            <th className="px-5 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500">
                                                Cantidad
                                            </th>
                                            <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                                                Precio
                                            </th>
                                            <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-500">
                                                Subtotal
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                        {saleItems.map((item, idx) => (
                                            <tr
                                                key={item.id_detalle_venta ?? idx}
                                                className="hover:bg-slate-50"
                                            >
                                                <td className="px-5 py-4 text-sm font-semibold text-slate-800">
                                                    {item.nombre_producto}
                                                </td>

                                                <td className="px-5 py-4 text-center text-sm text-slate-600">
                                                    {item.color || '—'}
                                                </td>

                                                <td className="px-5 py-4 text-center text-sm text-slate-600">
                                                    {item.cantidad}
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-right text-sm text-slate-600">
                                                    S/ {Number(item.precio || 0).toFixed(2)}
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-bold text-slate-800">
                                                    S/ {Number(item.subtotal || 0).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {!estaPagada && (
                        <div className="mb-6 rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-slate-900">
                                    Registrar un abono
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    Ingresa el importe recibido. El saldo y el estado se actualizarán automáticamente.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-slate-400">
                                        S/
                                    </span>

                                    <input
                                        type="number"
                                        min="0.01"
                                        max={saldoPendiente}
                                        step="0.01"
                                        value={montoAbono}
                                        onChange={e => setMontoAbono(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                                    />
                                </div>

                                <button
                                    type="button"
                                    disabled={
                                        loading ||
                                        !montoAbono ||
                                        Number(montoAbono) <= 0
                                    }
                                    onClick={handleRegistrarAbono}
                                    className="rounded-xl bg-indigo-700 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                                >
                                    {loading ? 'Registrando...' : 'Confirmar abono'}
                                </button>
                            </div>

                            <p className="mt-2 text-xs text-slate-500">
                                Saldo máximo por cobrar: S/ {saldoPendiente.toFixed(2)}
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                        onClick={() => generarBoleta(selectedSale.id_venta)}
                        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
                    >
                        🧾 Generar boleta PDF
                    </button>
                    </div>
                </div>
            </div>
        );
    }
}

export default ClientePage;

