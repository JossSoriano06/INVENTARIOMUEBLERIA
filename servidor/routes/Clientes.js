
const express = require('express');
const PDFDocument = require('pdfkit');
const path = require('path');

module.exports = function (db) {
    const router = express.Router();

    // =========================
    // OBTENER CLIENTES
    // =========================
    router.get('/', async (req, res) => {
        try {
            const resultado = await db.query(`
                SELECT
                    id_clientes,
                    nombre_cliente,
                    apellido_cliente,
                    referencia_cliente
                FROM clientes
                ORDER BY id_clientes DESC
            `);

            res.json(resultado.rows);

        } catch (error) {
            console.error('Error al obtener clientes:', error.message);
            res.status(500).json({
                message: 'Error al obtener clientes'
            });
        }
    });

    // =========================
    // CREAR CLIENTE
    // =========================
    router.post('/', async (req, res) => {
        const {
            nombre_cliente,
            apellido_cliente,
            referencia_cliente
        } = req.body;

        if (!nombre_cliente || !apellido_cliente || !referencia_cliente) {
            return res.status(400).json({
                message: 'Datos incompletos'
            });
        }

        try {
            const resultado = await db.query(
                `INSERT INTO clientes
                    (nombre_cliente, apellido_cliente, referencia_cliente)
                 VALUES ($1, $2, $3)
                 RETURNING id_clientes`,
                [nombre_cliente, apellido_cliente, referencia_cliente]
            );

            res.status(201).json({
                id: resultado.rows[0].id_clientes
            });

        } catch (error) {
            console.error('Error al crear cliente:', error.message);
            res.status(500).json({
                message: 'Error al crear cliente'
            });
        }
    });

    // =========================
    // ELIMINAR CLIENTE E HISTORIAL
    // =========================
    router.delete('/:id', async (req, res) => {
        const { id } = req.params;
        const client = await db.connect();

        try {
            await client.query('BEGIN');

            // Eliminar abonos asociados a las ventas del cliente
            await client.query(`
                DELETE FROM abonos
                WHERE id_venta IN (
                    SELECT id_venta
                    FROM ventas
                    WHERE id_cliente = $1
                )
            `, [id]);

            // Eliminar detalles de las ventas
            await client.query(`
                DELETE FROM detalle_ventas
                WHERE id_venta IN (
                    SELECT id_venta
                    FROM ventas
                    WHERE id_cliente = $1
                )
            `, [id]);

            // Eliminar ventas del cliente
            await client.query(
                'DELETE FROM ventas WHERE id_cliente = $1',
                [id]
            );

            // Eliminar cliente
            const resultado = await client.query(
                'DELETE FROM clientes WHERE id_clientes = $1',
                [id]
            );

            if (resultado.rowCount === 0) {
                await client.query('ROLLBACK');

                return res.status(404).json({
                    message: 'Cliente no encontrado'
                });
            }

            await client.query('COMMIT');

            res.json({
                message: 'Cliente y todo su historial eliminados correctamente'
            });

        } catch (error) {
            await client.query('ROLLBACK');

            console.error('Error al eliminar cliente:', error.message);

            res.status(500).json({
                error: 'Error interno del servidor',
                detalle: error.message
            });

        } finally {
            client.release();
        }
    });

    // =========================
    // OBTENER VENTAS POR CLIENTE
    // =========================
    router.get('/:id/ventas', async (req, res) => {
        try {
            const resultado = await db.query(`
                SELECT
                    id_venta,
                    fecha_vente,
                    total_venta,
                    pago_acumulado,
                    estado_pago
                FROM ventas
                WHERE id_cliente = $1
                ORDER BY fecha_vente DESC, id_venta DESC
            `, [req.params.id]);

            res.json(resultado.rows);

        } catch (error) {
            console.error('Error al obtener ventas:', error.message);
            res.status(500).json({
                message: 'Error al obtener ventas'
            });
        }
    });

    // =========================
    // DETALLE DE VENTA
    // =========================
    router.get('/ventas/:id/detalle', async (req, res) => {
        try {
            const resultado = await db.query(`
                SELECT
                    p.nombre_producto,
                    d.color,
                    d.cantidad_detalle_ventas_productos AS cantidad,
                    d.precio_detalle_ventas_productos AS precio,
                    d.sub_total_detalle_ventas AS subtotal
                FROM detalle_ventas d
                JOIN productos p
                    ON p.id_producto = d.id_producto
                WHERE d.id_venta = $1
            `, [req.params.id]);

            res.json(resultado.rows);

        } catch (error) {
            console.error('Error al obtener detalle:', error.message);
            res.status(500).json({
                message: 'Error al obtener detalle'
            });
        }
    });

    // =========================
    // CREAR VENTA
    // =========================
    router.post('/:id/ventas', async (req, res) => {
        const id_cliente = req.params.id;
        const { productos, pago_inicial } = req.body;

        if (!Array.isArray(productos) || productos.length === 0) {
            return res.status(400).json({
                message: 'Carrito vacío'
            });
        }

        const monto_pagado = Number(pago_inicial) || 0;

        if (!Number.isFinite(monto_pagado) || monto_pagado < 0) {
            return res.status(400).json({
                message: 'El pago inicial no es válido'
            });
        }

        let total = 0;

        for (const p of productos) {
            if (!p.color) {
                return res.status(400).json({
                    message: 'Producto sin color'
                });
            }

            const cantidad = Number(p.cantidad);
            const precio = Number(p.precio);

            if (
                !Number.isFinite(cantidad) ||
                !Number.isFinite(precio) ||
                cantidad <= 0 ||
                precio < 0
            ) {
                return res.status(400).json({
                    message: 'Cantidad o precio no válido'
                });
            }

            total += cantidad * precio;
        }

        if (monto_pagado > total) {
            return res.status(400).json({
                message: 'El pago no puede ser mayor al total'
            });
        }

        const client = await db.connect();

        try {
            await client.query('BEGIN');

            const estado = monto_pagado >= total
                ? 'cancelado'
                : 'pendiente';

            // Registrar venta
            const venta = await client.query(
                `INSERT INTO ventas (
                    fecha_vente,
                    total_venta,
                    id_cliente,
                    pago_acumulado,
                    estado_pago
                )
                VALUES (CURRENT_DATE, $1, $2, $3, $4)
                RETURNING id_venta`,
                [total, id_cliente, monto_pagado, estado]
            );

            const id_venta = venta.rows[0].id_venta;

            // Registrar detalles de la venta
            for (const p of productos) {
                await client.query(
                    `INSERT INTO detalle_ventas (
                        id_venta,
                        id_producto,
                        color,
                        cantidad_detalle_ventas_productos,
                        precio_detalle_ventas_productos,
                        sub_total_detalle_ventas
                    )
                    VALUES ($1, $2, $3, $4, $5, $6)`,
                    [
                        id_venta,
                        p.id_producto,
                        p.color,
                        Number(p.cantidad),
                        Number(p.precio),
                        Number(p.cantidad) * Number(p.precio)
                    ]
                );
            }

            await client.query('COMMIT');

            res.status(201).json({
                message: 'Venta registrada correctamente',
                id_venta
            });

        } catch (error) {
            await client.query('ROLLBACK');

            console.error('ERROR VENTA:', error.message);

            res.status(500).json({
                message: error.message
            });

        } finally {
            client.release();
        }
    });

    // =========================
    // REGISTRAR NUEVO ABONO
    // =========================
    router.post('/ventas/:id_venta/abono', async (req, res) => {
        const { id_venta } = req.params;
        const monto = Number(req.body.monto_abono);

        if (!Number.isFinite(monto) || monto <= 0) {
            return res.status(400).json({
                message: 'El monto del abono no es válido'
            });
        }

        const client = await db.connect();

        try {
            await client.query('BEGIN');

            // Obtener datos actuales de la venta
            const resultadoVenta = await client.query(
                `SELECT total_venta, pago_acumulado
                 FROM ventas
                 WHERE id_venta = $1
                 FOR UPDATE`,
                [id_venta]
            );

            if (resultadoVenta.rows.length === 0) {
                await client.query('ROLLBACK');

                return res.status(404).json({
                    message: 'Venta no encontrada'
                });
            }

            const totalVenta = Number(resultadoVenta.rows[0].total_venta);
            const pagoActual = Number(resultadoVenta.rows[0].pago_acumulado);
            const nuevoPagoAcumulado = pagoActual + monto;

            if (nuevoPagoAcumulado > totalVenta) {
                await client.query('ROLLBACK');

                return res.status(400).json({
                    message: 'El abono supera el saldo pendiente'
                });
            }

            // Registrar abono
            await client.query(
                `INSERT INTO abonos (id_venta, monto_abono)
                 VALUES ($1, $2)`,
                [id_venta, monto]
            );

            // Actualizar pago acumulado y estado
            const nuevoEstado = nuevoPagoAcumulado >= totalVenta
                ? 'cancelado'
                : 'pendiente';

            await client.query(
                `UPDATE ventas
                 SET pago_acumulado = $1,
                     estado_pago = $2
                 WHERE id_venta = $3`,
                [nuevoPagoAcumulado, nuevoEstado, id_venta]
            );

            await client.query('COMMIT');

            res.json({
                message: 'Abono registrado con éxito',
                nuevoPagoAcumulado
            });

        } catch (error) {
            await client.query('ROLLBACK');

            console.error('Error al registrar abono:', error.message);

            res.status(500).json({
                message: error.message
            });

        } finally {
            client.release();
        }
    });

    // =========================
    // ACTUALIZAR PAGO
    // =========================
    router.put('/:id/abonar', async (req, res) => {
        const { id } = req.params;
        const monto = Number(req.body.monto_abono);

        if (!Number.isFinite(monto) || monto <= 0) {
            return res.status(400).json({
                message: 'El monto del abono no es válido'
            });
        }

        try {
            const resultado = await db.query(
                `SELECT total_venta, pago_acumulado
                 FROM ventas
                 WHERE id_venta = $1`,
                [id]
            );

            if (resultado.rows.length === 0) {
                return res.status(404).send('Venta no encontrada');
            }

            const { total_venta, pago_acumulado } = resultado.rows[0];

            const nuevo_total_pago =
                Number(pago_acumulado) + monto;

            if (nuevo_total_pago > Number(total_venta)) {
                return res.status(400).send(
                    'El abono sobrepasa el total de la venta'
                );
            }

            const nuevo_estado =
                nuevo_total_pago >= Number(total_venta)
                    ? 'cancelado'
                    : 'pendiente';

            await db.query(
                `UPDATE ventas
                 SET pago_acumulado = $1,
                     estado_pago = $2
                 WHERE id_venta = $3`,
                [nuevo_total_pago, nuevo_estado, id]
            );

            res.json({
                message: 'Abono registrado con éxito',
                total_pagado: nuevo_total_pago
            });

        } catch (error) {
            console.error('Error al actualizar pago:', error.message);
            res.status(500).send(error.message);
        }
    });

    // =========================
    // CONSULTAR ESTADO DE CUENTA
    // =========================
    router.get('/ventas/:id/pagos', async (req, res) => {
        const { id } = req.params;

        try {
            const resultadoVenta = await db.query(
                `SELECT total_venta, pago_acumulado, estado_pago
                 FROM ventas
                 WHERE id_venta = $1`,
                [id]
            );

            if (resultadoVenta.rows.length === 0) {
                return res.status(404).json({
                    message: 'Venta no encontrada'
                });
            }

            const resultadoAbonos = await db.query(
                `SELECT *
                 FROM abonos
                 WHERE id_venta = $1
                 ORDER BY fecha_abono DESC`,
                [id]
            );

            res.json({
                resumen: resultadoVenta.rows[0],
                historial: resultadoAbonos.rows
            });

        } catch (error) {
            console.error('Error al consultar pagos:', error.message);
            res.status(500).send(error.message);
        }
    });

    // =========================
    // GENERAR BOLETA PDF
    // =========================
    router.get('/ventas/:id/boleta', async (req, res) => {
        const doc = new PDFDocument({
            size: 'A4',
            margin: 40
        });

        try {
            const id_venta = req.params.id;

            // Obtener información de la venta y cliente
            const resultadoVenta = await db.query(`
                SELECT
                    v.*,
                    c.nombre_cliente,
                    c.apellido_cliente
                FROM ventas v
                JOIN clientes c
                    ON v.id_cliente = c.id_clientes
                WHERE v.id_venta = $1
            `, [id_venta]);

            // Obtener detalle de productos
            const resultadoDetalle = await db.query(`
                SELECT
                    dv.*,
                    p.nombre_producto
                FROM detalle_ventas dv
                JOIN productos p
                    ON dv.id_producto = p.id_producto
                WHERE dv.id_venta = $1
            `, [id_venta]);

            if (resultadoVenta.rows.length === 0) {
                return res.status(404).send('Venta no encontrada');
            }

            const venta = resultadoVenta.rows[0];
            const detalle = resultadoDetalle.rows;

            const numeroBoleta =
                `NV-${String(id_venta).padStart(6, '0')}`;

            const fechaPeru = new Date().toLocaleDateString('es-PE', {
                timeZone: 'America/Lima',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });

            // Configurar respuesta PDF
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader(
                'Content-Disposition',
                `inline; filename=${numeroBoleta}.pdf`
            );

            doc.pipe(res);

            // Logo
            try {
                const logoPath = path.join(__dirname, '../assets/logo2.png');
                doc.image(logoPath, 40, 40, { width: 70 });
            } catch (error) {
                doc.fontSize(15).text('MUEBLERÍA', 40, 40);
            }

            doc.fillColor('#1a1a1a')
                .fontSize(16)
                .font('Helvetica-Bold')
                .text('MUEBLERIA "EL MARQUÉZ"', 130, 45)
                .fontSize(9)
                .font('Helvetica')
                .text('TELF: 995888883', 130, 65)
                .text('PILCOMAYO - HUANCAYO - JUNIN', 130, 78);

            // Recuadro de boleta
            doc.rect(380, 40, 180, 75)
                .lineWidth(1.5)
                .stroke('#050a17');

            doc.fillColor('#050a17')
                .fontSize(11)
                .font('Helvetica-Bold')
                .text('NOTA DE VENTA', 390, 50, {
                    width: 160,
                    align: 'center'
                });

            doc.fillColor('black')
                .fontSize(12)
                .text(numeroBoleta, 390, 70, {
                    align: 'center'
                });

            doc.fontSize(9)
                .font('Helvetica')
                .text(`Fecha: ${fechaPeru}`, 390, 95, {
                    align: 'center'
                });

            // Datos del cliente
            doc.roundedRect(40, 130, 520, 40, 5)
                .lineWidth(0.5)
                .stroke('#cccccc');

            doc.fontSize(10)
                .font('Helvetica-Bold')
                .text('CLIENTE:', 50, 145);

            doc.font('Helvetica')
                .text(
                    `${venta.nombre_cliente} ${venta.apellido_cliente}`,
                    105,
                    145
                );

            // Tabla de productos
            let currentY = 200;

            doc.rect(40, currentY, 520, 20)
                .fill('#f3f4f6')
                .stroke('#eeeeee');

            doc.fillColor('#374151')
                .font('Helvetica-Bold')
                .fontSize(9);

            doc.text('ITEM', 45, currentY + 6);
            doc.text('DESCRIPCIÓN', 90, currentY + 6);
            doc.text('PRECIO', 350, currentY + 6);
            doc.text('CANT.', 430, currentY + 6);
            doc.text('SUBTOTAL', 500, currentY + 6);

            currentY += 25;

            doc.fillColor('black')
                .font('Helvetica')
                .fontSize(9);

            detalle.forEach((d, index) => {
                doc.text(index + 1, 45, currentY);

                doc.text(
                    `${d.nombre_producto} - ${d.color || 'N/A'}`,
                    90,
                    currentY
                );

                doc.text(
                    `S/ ${parseFloat(d.precio_detalle_ventas_productos).toFixed(2)}`,
                    350,
                    currentY
                );

                doc.text(
                    d.cantidad_detalle_ventas_productos,
                    430,
                    currentY
                );

                doc.font('Helvetica-Bold').text(
                    `S/ ${parseFloat(d.sub_total_detalle_ventas).toFixed(2)}`,
                    500,
                    currentY
                );

                doc.font('Helvetica');
                currentY += 20;
            });

            // Total
            doc.rect(380, currentY + 10, 180, 25)
                .fill('#f3f4f6')
                .stroke('#eeeeee');

            doc.fillColor('#374151')
                .font('Helvetica-Bold')
                .fontSize(11);

            doc.text('TOTAL:', 390, currentY + 17);

            doc.text(
                `S/ ${parseFloat(venta.total_venta).toFixed(2)}`,
                500,
                currentY + 17
            );

            doc.end();

        } catch (error) {
            console.error('ERROR GENERANDO PDF:', error.message);

            if (!res.headersSent) {
                res.status(500).send(
                    'Error al generar el PDF: ' + error.message
                );
            } else {
                doc.end();
            }
        }
    });

    return router;
};
