
const express = require('express');

module.exports = function (db) {
    const router = express.Router();

    router.get('/', async (req, res) => {
        try {
            // 1. Validar el periodo recibido desde el frontend
            const periodosPermitidos = ['hoy', 'semana', 'mes', 'todo'];

            const periodo = periodosPermitidos.includes(req.query.periodo)
                ? req.query.periodo
                : 'mes';

            // Fecha actual considerando la zona horaria de Lima
            const hoy = `(NOW() AT TIME ZONE 'America/Lima')::date`;

            // 2. Construir el filtro de fechas
            let condicionFecha = '';

            switch (periodo) {
                case 'hoy':
                    condicionFecha = `v.fecha_vente = ${hoy}`;
                    break;

                case 'semana':
                    condicionFecha = `
                        v.fecha_vente >= DATE_TRUNC('week', ${hoy}::timestamp)::date
                        AND v.fecha_vente <= ${hoy}
                    `;
                    break;

                case 'mes':
                    condicionFecha = `
                        v.fecha_vente >= DATE_TRUNC('month', ${hoy}::timestamp)::date
                        AND v.fecha_vente <= ${hoy}
                    `;
                    break;

                case 'todo':
                    condicionFecha = '1 = 1';
                    break;
            }

            // 3. Agrupación para el gráfico
            // Por día para los periodos cortos y por mes para todo el historial
            const agrupacionFecha = periodo === 'todo'
                ? `DATE_TRUNC('month', v.fecha_vente)::date`
                : 'v.fecha_vente';

            // 4. Ejecutar consultas en paralelo
            const [
                resumen,
                productosRegistrados,
                clientesRegistrados,
                ventasGrafico,
                clientesRecurrentes,
                productosVendidos,
                ventasPorEstado
            ] = await Promise.all([

                // RESUMEN GENERAL
                db.query(`
                    SELECT
                        COUNT(*)::integer AS total_ventas,
                        COALESCE(SUM(v.total_venta), 0) AS ingresos,
                        COUNT(DISTINCT v.id_cliente)::integer AS clientes_compradores
                    FROM ventas v
                    WHERE ${condicionFecha}
                `),

                // TOTAL DE PRODUCTOS REGISTRADOS
                db.query(`
                    SELECT COUNT(*)::integer AS total_productos
                    FROM productos
                `),

                // TOTAL DE CLIENTES REGISTRADOS
                db.query(`
                    SELECT COUNT(*)::integer AS total_clientes
                    FROM clientes
                `),

                // VENTAS E INGRESOS PARA EL GRÁFICO
                db.query(`
                    SELECT
                        ${agrupacionFecha} AS fecha,
                        COUNT(*)::integer AS cantidad_ventas,
                        COALESCE(SUM(v.total_venta), 0) AS ingresos
                    FROM ventas v
                    WHERE ${condicionFecha}
                    GROUP BY fecha
                    ORDER BY fecha ASC
                `),

                // TOP 5 CLIENTES MÁS RECURRENTES
                db.query(`
                    SELECT
                        c.id_clientes,
                        c.nombre_cliente,
                        c.apellido_cliente,
                        COUNT(v.id_venta)::integer AS cantidad_compras,
                        COALESCE(SUM(v.total_venta), 0) AS total_comprado
                    FROM clientes c
                    INNER JOIN ventas v
                        ON v.id_cliente = c.id_clientes
                    WHERE ${condicionFecha}
                    GROUP BY
                        c.id_clientes,
                        c.nombre_cliente,
                        c.apellido_cliente
                    ORDER BY
                        cantidad_compras DESC,
                        total_comprado DESC
                    LIMIT 5
                `),

                // TOP 5 PRODUCTOS MÁS VENDIDOS
                db.query(`
                    SELECT
                        p.id_producto,
                        p.nombre_producto,
                        COALESCE(
                            SUM(d.cantidad_detalle_ventas_productos), 0
                        )::integer AS unidades_vendidas,
                        COALESCE(
                            SUM(d.sub_total_detalle_ventas), 0
                        ) AS ingresos_generados
                    FROM detalle_ventas d
                    INNER JOIN ventas v
                        ON v.id_venta = d.id_venta
                    INNER JOIN productos p
                        ON p.id_producto = d.id_producto
                    WHERE ${condicionFecha}
                    GROUP BY
                        p.id_producto,
                        p.nombre_producto
                    ORDER BY
                        unidades_vendidas DESC
                    LIMIT 5
                `),

                // VENTAS AGRUPADAS POR ESTADO DE PAGO
                db.query(`
                    SELECT
                        v.estado_pago,
                        COUNT(*)::integer AS cantidad
                    FROM ventas v
                    WHERE ${condicionFecha}
                    GROUP BY v.estado_pago
                    ORDER BY cantidad DESC
                `)
            ]);

            // 5. Formatear los datos del gráfico
            const grafico = ventasGrafico.rows.map(item => {
                const fecha = String(item.fecha).slice(0, 10);

                const fechaFormateada = periodo === 'todo'
                    ? fecha.slice(0, 7).split('-').reverse().join('/')
                    : `${fecha.slice(8, 10)}/${fecha.slice(5, 7)}`;

                return {
                    fecha: fechaFormateada,
                    cantidad_ventas: Number(item.cantidad_ventas),
                    ingresos: Number(item.ingresos)
                };
            });

            // 6. Preparar la respuesta
            res.json({
                periodo,

                resumen: {
                    total_ventas: Number(resumen.rows[0].total_ventas),
                    ingresos: Number(resumen.rows[0].ingresos),
                    clientes_compradores: Number(
                        resumen.rows[0].clientes_compradores
                    ),
                    total_productos: Number(
                        productosRegistrados.rows[0].total_productos
                    ),
                    total_clientes: Number(
                        clientesRegistrados.rows[0].total_clientes
                    )
                },

                grafico,

                clientes_recurrentes: clientesRecurrentes.rows.map(cliente => ({
                    ...cliente,
                    cantidad_compras: Number(cliente.cantidad_compras),
                    total_comprado: Number(cliente.total_comprado)
                })),

                productos_mas_vendidos: productosVendidos.rows.map(producto => ({
                    ...producto,
                    unidades_vendidas: Number(producto.unidades_vendidas),
                    ingresos_generados: Number(producto.ingresos_generados)
                })),

                ventas_por_estado: ventasPorEstado.rows.map(item => ({
                    estado_pago: item.estado_pago,
                    cantidad: Number(item.cantidad)
                }))
            });

        } catch (error) {
            console.error('Error al obtener los datos del dashboard:', error);

            res.status(500).json({
                mensaje: 'Error al obtener la información del dashboard',
                error: error.message
            });
        }
    });

    return router;
};
