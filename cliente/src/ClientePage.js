import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3004';

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

    const fetchClientes = async () => {
        const res = await axios.get(API_URL_CLIENTES);
        setClientes(res.data);
    };

    const fetchProductos = async () => {
        const res = await axios.get(API_URL_PRODUCTOS);
        setProductosDisponibles(res.data);
    };

    const handleAddCliente = async (e) => {
        e.preventDefault();
        await axios.post(API_URL_CLIENTES, formDataCliente);
        setFormDataCliente({ nombre_cliente: '', apellido_cliente: '', referencia_cliente: '' });
        fetchClientes();
    };

    const handleEliminarCliente = async (id) => {
    // Mostrar alerta de confirmación
    const confirmar = window.confirm(
        "¿Estás seguro de eliminar este cliente? Se borrarán permanentemente todas sus ventas y registros asociados. Esta acción no se puede deshacer."
    );

    if (confirmar) {
        try {
            await axios.delete(`${API_URL_CLIENTES}/${id}`);
            alert("Cliente eliminado con éxito");
            // Refrescar la lista de clientes
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

        const prod = productosDisponibles.find(p => p.id === currentItem.id_producto);

        const item = {
            id_producto: prod.id,
            nombre: prod.nombre,
            color: currentItem.color,
            cantidad: Number(currentItem.cantidad),
            precio: Number(currentItem.precio),
            subtotal: Number(currentItem.cantidad) * Number(currentItem.precio)
        };

        setCart([...cart, item]);
        setCurrentItem({ id_producto: '',color: '', cantidad: 1, precio: '' });
    };
    const removeFromCart = (index) => {
    // Filtramos el carrito manteniendo todos los elementos excepto el que coincide con el índice
    const newCart = cart.filter((_, i) => i !== index);
    setCart(newCart);
};

  const procesarVentaFinal = async () => {
    if (!selectedClient) return alert('Seleccione cliente');
    if (cart.length === 0) return alert('Carrito vacío');

    setLoading(true);

    try {
        const productos = cart.map(p => ({
            id_producto: p.id_producto,
            color: p.color, 
            cantidad: Number(p.cantidad),
            precio: Number(p.precio)
        }));

        await axios.post(
            `${API_URL_CLIENTES}/${selectedClient.id_clientes}/ventas`,
            { productos }
        );

        alert('Venta registrada correctamente');
        setCart([]);
        setView('LISTA_CLIENTES');

    } catch (error) {
        console.error(error);
        alert('Error al procesar venta');
    } finally {
        setLoading(false);
    }
};

    




    const verHistorialVentas = async (cliente) => {
        const res = await axios.get(`${API_URL_CLIENTES}/${cliente.id_clientes}/ventas`);
        setSelectedClient(cliente);
        setClientSales(res.data);
        setView('VENTAS_CLIENTE');
    };

    const verDetalleVenta = async (venta) => {
        const res = await axios.get(`${API_URL_CLIENTES}/ventas/${venta.id_venta}/detalle`);
        setSelectedSale(venta);
        setSaleItems(res.data);
        setView('DETALLE_VENTA');
    };

    const cancelarVenta = () => {
    const confirmar = window.confirm(
        '¿Estás seguro de cancelar la venta? Se perderán los datos.'
    );

    if (!confirmar) return;

    // Limpiar carrito
    setCart([]);

    // Reiniciar item actual
    setCurrentItem({
        id_producto: '',
        nombre: '',
        precio: 0,
        cantidad: 1,
        subtotal: 0
    });

    

    // Quitar cliente seleccionado (opcional)
    setSelectedClient(null);

    // Volver a la lista de clientes
    setView('LISTA_CLIENTES');
};

    // ================= VISTAS =================

    if (view === 'LISTA_CLIENTES') {
        return (
            <div className="container  mx-auto p-6">
                <h1 className="text-3xl font-bold mb-6">Gestión de Clientes</h1>

                <form onSubmit={handleAddCliente} className="grid grid-cols-1 md:flex gap-4 mb-6">
                    <input className="border p-2 rounded shadow-sm w-full md:w-auto flex-1" placeholder="Nombre"
                        value={formDataCliente.nombre_cliente}
                        onChange={e => setFormDataCliente({ ...formDataCliente, nombre_cliente: e.target.value })}
                        required
                    />
                    <input className="border p-2 rounded shadow-sm w-full md:w-auto flex-1" placeholder="Apellido"
                        value={formDataCliente.apellido_cliente}
                        onChange={e => setFormDataCliente({ ...formDataCliente, apellido_cliente: e.target.value })}
                        required
                    />
                    <input className="border p-2 rounded shadow-sm w-full md:w-auto flex-1" placeholder="Referencia"
                        value={formDataCliente.referencia_cliente}
                        onChange={e => setFormDataCliente({ ...formDataCliente, referencia_cliente: e.target.value })}
                        required
                    />
                    <button className="bg-indigo-600 shadow-sm text-white px-6 py-2 rounded font-bold hover:bg-indigo-700 transition-colors w-full md:w-auto">Agregar</button>
                </form>
                <div className="overflow-x-auto">
                <table className=" min-w-full divide-y shadow-lg divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className=" bg-white divide-y divide-gray-200">
                        {clientes.map(c => (
                            <tr key={c.id_clientes} className="hover:bg-indigo-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.id_clientes}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{c.nombre_cliente} ({c.referencia_cliente}) </td>
                                <td className="space-x-3 whitespace-nowrap">
                                    <button
                                        onClick={() => { setSelectedClient(c); setView('NUEVA_VENTA'); }}
                                        className="text-green-500 font-bold "
                                    >
                                        Vender
                                    </button>
                                    <button
                                        onClick={() => verHistorialVentas(c)}
                                        className="text-indigo-600 font-bold"
                                    >
                                        Historial
                                    </button>
                                    <button 
                                        onClick={() => handleEliminarCliente(c.id_clientes)} 
                                             className=" text-red-500 text-xs font-bold "
                                            >
                                                             ELIMINAR
                                                 </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </div>
        );
    }

    if (view === 'NUEVA_VENTA') {
        return (
            <div className="container mx-auto p-6">
                <button onClick={() => setView('LISTA_CLIENTES')} className="mb-4 text-indigo-600">← Volver</button>

                <h2 className="text-2xl font-bold mb-4">
                    Nueva venta - {selectedClient.nombre_cliente}
                </h2>

                <div className="grid grid-cols-4 gap-4 mb-6">
                    <select className="border p-2" value={currentItem.id_producto} onChange={handleSelectProducto}>
                        <option value="">Producto</option>
                        {productosDisponibles.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.nombre}
                            </option>
                        ))}
                    </select>
                    <select className="border p-2" value={currentItem.color} onChange={e => setCurrentItem({ ...currentItem, color: e.target.value })}>
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
                        
                    </select>
                   

                    <input type="number" className="border p-2"
                        value={currentItem.precio}
                        onChange={e => setCurrentItem({ ...currentItem, precio: e.target.value })}
                    />
                    

                    <input type="number" className="border p-2"
                        value={currentItem.cantidad}
                        onChange={e => setCurrentItem({ ...currentItem, cantidad: e.target.value })}
                    />

                    <button onClick={agregarAlCarrito}
                        className="bg-green-600 text-white rounded p-2 ">Añadir</button>
                </div>

                <table className="min-w-full divide-y divide-gray-200 ">
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
                    <tbody className="bg-white divide-y divide-gray-200 text-center" >
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
                        className="bg-red-100 text-red-600 hover:bg-red-600 hover:text-white p-2 rounded-lg transition-all duration-300 flex items-center justify-center mx-auto"
                        title="Eliminar producto"
                    >
                        
                        <span className="text-sm font-bold">Quitar</span>
                    </button>
                </td>
                                </tr>
                        ))}
                    </tbody>
                    <tfoot className='text-center bg-gray-50'>
                        <tr>
                            <td colSpan="4" className="text-right font-bold">Total:</td>
                            <td className="font-bold">
                                S/ {cart.reduce((acc, item) => acc + item.subtotal, 0).toFixed(2)}
                            </td>
                        </tr>
                    </tfoot>
                    
                </table>
                <button onClick={cancelarVenta}className="ml-4 bg-red-600 text-white px-6 py-2 rounded">
             Cancelar Venta
            </button>
                <button
                    onClick={procesarVentaFinal}
                    disabled={loading}
                    className="bg-indigo-600 text-white px-6 py-2 rounded"
                >
                    {loading ? 'Procesando...' : 'Confirmar Venta'}
                </button>
           

                
            </div>
        );
    }

    if (view === 'VENTAS_CLIENTE') {
        return (
            <div className="container mx-auto p-6">
                <button onClick={() => setView('LISTA_CLIENTES')} className="mb-4 text-indigo-600">← Volver</button>

                <h2 className="text-xl font-bold mb-4 py-3">
                    Historial de {selectedClient.nombre_cliente} {selectedClient.apellido_cliente}
                </h2>

                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th>ID</th>
                            <th>Fecha</th>
                            <th>Total</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {clientSales.map(v => (
                            <tr key={v.id_venta} className="border-t text-center">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{v.id_venta}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(v.fecha_vente).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">S/ {v.total_venta}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button
                                        onClick={() => verDetalleVenta(v)} className='text-sm text-blue-800 text-bold'  > Ver  </button>  </td>          
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    if (view === 'DETALLE_VENTA') {
        return (
            <div className="container mx-auto p-6">
                <button onClick={() => setView('VENTAS_CLIENTE')} className="mb-4 text-indigo-600">← Volver</button>

                <h2 className="text-xl font-bold mb-4">
                    Detalle Venta #{selectedSale.id_venta}
                </h2>

                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th>Producto</th>
                             <th>Color</th>
                            <th>Cantidad</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {saleItems.map((i, idx) => (
                            <tr key={idx} className="border-t text-center">
                                <td>{i.nombre_producto}</td>
                                <td>{i.color}</td>
                                <td>{i.cantidad}</td>
                                <td>S/ {i.subtotal}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                        <tr className='text-center'>
                            <td colSpan="3" className="text-right font-bold">Total:</td>
                            <td className="font-bold">
                                S/ {selectedSale.total_venta}
                            </td>
                        </tr>
                    </tfoot>
                    
                </table>
                        {/* BOTÓN DE BOLETA */}
            <div className="mt-6 flex justify-end">
                <button
                    onClick={() =>
                        window.open(
                            `${BASE_URL}/api/clientes/ventas/${selectedSale.id_venta}/boleta`,
                '_blank'
                        )
                    }
                    className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700"
                >
                    🧾 Generar Boleta
                </button>
            </div>
              
            </div>
        );
    }
}

export default ClientePage;



