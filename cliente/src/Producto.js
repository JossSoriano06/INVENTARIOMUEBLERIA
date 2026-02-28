// ./frontend/src/Producto.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'https://muebleria-backend-9kfb.onrender.com/api/productos';
//const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3004/api/productos';cc
function Producto() {
    const [productos, setProductos] = useState([]); 
    const [formData, setFormData] = useState({ 
        nombre: '', 
        descripcion: '', 
        precio_unitario: ''
        
    }); 
    const [isEditing, setIsEditing] = useState(false); 
    const [currentProductId, setCurrentProductId] = useState(null); 
    const [loading, setLoading] = useState(false);

    //  Obtener todos los productos
    const fetchProductos = async () => {
        setLoading(true);
        try {
            const response = await axios.get(API_URL);
            setProductos(response.data);
        } catch (error) {
            console.error('Error al cargar productos:', error);
            alert('Error al cargar datos. Verifique que el servidor de Node.js esté corriendo.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProductos();
    }, []);

    // Manejador de cambios
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    // creao o actualizar productos
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const dataToSend = {
                ...formData,
                precio_unitario: parseFloat(formData.precio_unitario)
            };

            if (isEditing) {
                await axios.put(`${API_URL}/${currentProductId}`, dataToSend);
            } else {
                await axios.post(API_URL, dataToSend);
            }

            // Resetear y recargar
            setFormData({ nombre: '', descripcion: '', precio_unitario: '' });
            setIsEditing(false);
            setCurrentProductId(null);
            fetchProductos();

        } catch (error) {
            console.error('Error al guardar:', error.response ? error.response.data : error.message);
            alert(`Error al guardar el producto: ${error.response ? error.response.data.error || error.response.data.message : 'Error de conexión'}`);
        } finally {
            setLoading(false);
        }
    };

    // Preparar edición
    const handleEdit = (producto) => {
        setFormData({
            nombre: producto.nombre,
            descripcion: producto.descripcion || '',
            // Asegura que los números se muestren correctamente en el formulario
            precio_unitario: producto.precio_unitario, 
            
        });
        setCurrentProductId(producto.id);
        setIsEditing(true);
    };

    // ELIMINAR
    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar este producto?')) return;
        
        try {
            await axios.delete(`${API_URL}/${id}`);
            alert('Producto eliminado con éxito!');
            fetchProductos();
        } catch (error) {
            console.error('Error al eliminar:', error.response ? error.response.data : error.message);
            alert(`Error al eliminar: ${error.response ? error.response.data.error : 'Error de conexión'}`);
        }
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-2">
                Gestión de Muebles 
            </h1>
            
            {/* Formulario de Creación/Edición */}
            <div className="bg-white shadow-lg rounded-xl p-6 mb-8 border border-gray-200">
                <h2 className="text-2xl font-semibold text-indigo-700 mb-4">
                    {isEditing ? '✏️ Editar Producto' : '➕ Registrar Nuevo Producto'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input 
                            type="text" name="nombre" placeholder="Nombre del Mueble" 
                            value={formData.nombre} onChange={handleChange} required
                            className={`p-3 border border-gray-300 rounded-lg ${isEditing ? 'bg-gray-200 cursor-not-allowed' : 'focus:ring-indigo-500 focus:border-indigo-500'}`}
                        />
                        <input 
                            type="number" name="precio_unitario" placeholder="Precio Unitario" 
                            value={formData.precio_unitario} onChange={handleChange} required step="0.01"
                            className="p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        
                        <textarea 
                            name="descripcion" placeholder="Descripción (Material, color, etc.)" 
                            value={formData.descripcion} onChange={handleChange} rows="2"
                            className="p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 md:col-span-2"
                        ></textarea>
                    </div>
                    
                    <div className="flex space-x-4">
                        <button type="submit" disabled={loading}
                            className={`px-6 py-3 rounded-lg text-white font-medium transition duration-150 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                        >
                            {loading ? 'Cargando...' : isEditing ? 'Guardar Cambios' : 'Registrar Producto'}
                        </button>
                        {isEditing && (
                            <button type="button" onClick={() => { setIsEditing(false); setFormData({ nombre: '', descripcion: '', precio_unitario: ''}); }}
                                className="px-6 py-3 rounded-lg bg-gray-500 hover:bg-gray-600 text-white font-medium"
                            >
                                Cancelar Edición
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Listado de Productos */}
            <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                    📋 CANTIDAD DE MUEBLES {productos.length}
                </h3>

                {loading && <p className="text-center text-indigo-600">Cargando inventario...</p>}
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {productos.map((p) => (
                                <tr key={p.id} className="hover:bg-indigo-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{p.nombre}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-semibold">S/.{p.precio_unitario ? parseFloat(p.precio_unitario).toFixed(2) : 'N/A'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{p.descripcion}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button onClick={() => handleEdit(p)}
                                            className="text-indigo-600 hover:text-indigo-900 mr-3 transition duration-150"
                                        >
                                            Editar
                                        </button>
                                        <button onClick={() => handleDelete(p.id)}
                                            className="text-red-600 hover:text-red-900 transition duration-150"
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {productos.length === 0 && !loading && (
                        //para ver si no hay productos
                        <p className="text-center py-4 text-gray-500">No hay productos registrados.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Producto;