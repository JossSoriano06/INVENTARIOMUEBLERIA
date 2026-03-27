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
            const [rows] = await db.query(`
                SELECT id_clientes, nombre_cliente, apellido_cliente, referencia_cliente
                FROM clientes
                ORDER BY id_clientes DESC
            `);
            res.json(rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error al obtener clientes' });
        }
    });
    

    // =========================
    // CREAR CLIENTE
    // =========================
    router.post('/', async (req, res) => {
        const { nombre_cliente, apellido_cliente, referencia_cliente } = req.body;

        if (!nombre_cliente || !apellido_cliente || !referencia_cliente) {
            return res.status(400).json({ message: 'Datos incompletos' });
        }

        try {
            const [result] = await db.query(
                'INSERT INTO clientes (nombre_cliente, apellido_cliente, referencia_cliente) VALUES (?, ?, ?)',
                [nombre_cliente, apellido_cliente, referencia_cliente]
            );
            res.status(201).json({ id: result.insertId });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error al crear cliente' });
        }
    });

    // =========================
    // ELIMINAR CLIENTE
    
    router.delete('/:id', async (req, res) => {
        const { id } = req.params;

        try {
            // 1. Desactivar temporalmente la revisión de llaves foráneas
            await db.query('SET FOREIGN_KEY_CHECKS = 0');

            // 2. Borrar los detalles de ventas vinculados a las ventas de este cliente
            // Usamos un JOIN para identificar qué detalles pertenecen a las ventas del cliente
            await db.query(`
                DELETE dv FROM detalle_ventas dv
                JOIN ventas v ON dv.id_venta = v.id_venta
                WHERE v.id_cliente = ?
            `, [id]);

            // 3. Borrar las ventas del cliente
            await db.query('DELETE FROM ventas WHERE id_cliente = ?', [id]);

            // 4. Borrar al cliente (usando id_clientes como en tu tabla)
            const [result] = await db.query('DELETE FROM clientes WHERE id_clientes = ?', [id]);

            // 5. Reactivar la revisión de llaves foráneas
            await db.query('SET FOREIGN_KEY_CHECKS = 1');

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Cliente no encontrado" });
            }

            res.json({ message: "Cliente y todo su historial eliminados correctamente" });

        } catch (error) {
            // Importante: Reactivar la revisión incluso si hay error
            await db.query('SET FOREIGN_KEY_CHECKS = 1');
            console.error("Error al eliminar cliente:", error);
            res.status(500).json({ error: "Error interno del servidor", detalle: error.message });
        }
    });

    // =========================
    // OBTENER VENTAS POR CLIENTE
    // =========================
    router.get('/:id/ventas', async (req, res) => {
        try {
            const [rows] = await db.query(`
                SELECT id_venta, fecha_vente, total_venta, pago_acumulado, estado_pago
                FROM ventas
                WHERE id_cliente = ?
                ORDER BY fecha_vente DESC, id_venta DESC
            `, [req.params.id]);

            res.json(rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error al obtener ventas' });
        }
    });

    // =========================
    // DETALLE DE VENTA
    // =========================
    router.get('/ventas/:id/detalle', async (req, res) => {
        try {
            const [rows] = await db.query(`
                SELECT 
                    p.nombre_producto,
                    d.color,
                    d.cantidad_detalle_ventas_productos AS cantidad,
                    d.precio_detalle_ventas_productos AS precio,
                    d.sub_total_detalle_ventas AS subtotal
                FROM detalle_ventas d
                JOIN productos p ON p.id_producto = d.id_producto
                WHERE d.id_venta = ?
            `, [req.params.id]);

            res.json(rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error al obtener detalle' });
        }
    });


    // =========================
    // CREAR VENTA 
    // =========================
    router.post('/:id/ventas', async (req, res) => {
    const id_cliente = req.params.id;
    const { productos, pago_inicial } = req.body;

    if (!productos || productos.length === 0) {
        return res.status(400).json({ message: 'Carrito vacío' });
    }

    try {
        const monto_pagado = Number(pago_inicial) || 0;
        await db.beginTransaction();

        let total = 0;
        for (const p of productos) {
            if (!p.color) {
                throw new Error('Producto sin color');
            }
            total += Number(p.cantidad) * Number(p.precio);
        }
        
        if (pago_inicial > total) {
            return res.status(400).json({ message: 'El pago no puede ser mayor al total' });
        }
        const estado = (pago_inicial === total) ? 'cancelado' : 'pendiente';
        const [venta] = await db.query(
    `INSERT INTO ventas (fecha_vente, total_venta, id_cliente, pago_acumulado, estado_pago)
     VALUES (CURDATE(), ?, ?, ?, ?)`,
    [total, id_cliente, pago_inicial, estado]
);

        const id_venta = venta.insertId;

        for (const p of productos) {
            await db.query(
                `INSERT INTO detalle_ventas (
                    id_venta,
                    id_producto,
                    color,
                    cantidad_detalle_ventas_productos,
                    precio_detalle_ventas_productos,
                    sub_total_detalle_ventas
                ) VALUES (?, ?, ?, ?, ?, ?)`,
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

        await db.commit();
        res.json({ 
            message: 'Venta registrada correctamente',
            id_venta: id_venta
        });

    } catch (error) {
        await db.rollback();
        console.error('ERROR VENTA:', error.message);
        res.status(500).json({ message: error.message });
    }
});
//nuevo abono 
// Ruta para registrar un nuevo abono
router.post('/ventas/:id_venta/abono', async (req, res) => {
    const { id_venta } = req.params;
    const { monto_abono } = req.body;

    try {
        await db.beginTransaction();

        // 1. Obtener datos actuales de la venta
        const [venta] = await db.query(
            'SELECT total_venta, pago_acumulado FROM ventas WHERE id_venta = ?',
            [id_venta]
        );

        if (venta.length === 0) throw new Error("Venta no encontrada");

        const totalVenta = Number(venta[0].total_venta);
        const pagoActual = Number(venta[0].pago_acumulado);
        const nuevoPagoAcumulado = pagoActual + Number(monto_abono);

        // 2. Validar que no pague de más
        if (nuevoPagoAcumulado > totalVenta) {
            return res.status(400).json({ message: "El abono supera el saldo pendiente" });
        }

        // 3. Registrar el abono en la tabla 'abonos'
        await db.query(
            'INSERT INTO abonos (id_venta, monto_abono) VALUES (?, ?)',
            [id_venta, monto_abono]
        );

        // 4. Actualizar el pago acumulado y estado en la tabla 'ventas'
        const nuevoEstado = (nuevoPagoAcumulado === totalVenta) ? 'cancelado' : 'pendiente';
        await db.query(
            'UPDATE ventas SET pago_acumulado = ?, estado_pago = ? WHERE id_venta = ?',
            [nuevoPagoAcumulado, nuevoEstado, id_venta]
        );

        await db.commit();
        res.json({ message: "Abono registrado con éxito", nuevoPagoAcumulado });

    } catch (error) {
        await db.rollback();
        res.status(500).json({ message: error.message });
    }
});

 //para la actuzliacion del pago
 // PUT /api/ventas/:id/abonar
router.put('/:id/abonar', async (req, res) => {
    const { id } = req.params;
    const { monto_abono } = req.body;

    try {
        // 1. Obtener la venta actual
        const [rows] = await db.query('SELECT total_venta, pago_acumulado FROM ventas WHERE id_venta = ?', [id]);
        if (rows.length === 0) return res.status(404).send('Venta no encontrada');

        const { total_venta, pago_acumulado } = rows[0];
        const nuevo_total_pago = Number(pago_acumulado) + Number(monto_abono);

        // 2. Validar que no sobrepase el total
        if (nuevo_total_pago > total_venta) {
            return res.status(400).send('El abono sobrepasa el total de la venta');
        }

        // 3. Actualizar
        const nuevo_estado = (nuevo_total_pago === Number(total_venta)) ? 'cancelado' : 'pendiente';
        
        await db.query(
            'UPDATE ventas SET pago_acumulado = ?, estado_pago = ? WHERE id_venta = ?',
            [nuevo_total_pago, nuevo_estado, id]
        );

        res.json({ message: 'Abono registrado con éxito', total_pagado: nuevo_total_pago });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

 //ver el abono acumulado y el estado de pago
 // Obtener estado de cuenta de una venta
router.get('/ventas/:id/pagos', async (req, res) => {
    const { id } = req.params;
    try {
        const [venta] = await db.query(
            'SELECT total_venta, pago_acumulado, estado_pago FROM ventas WHERE id_venta = ?', 
            [id]
        );
        const [abonos] = await db.query(
            'SELECT * FROM abonos WHERE id_venta = ? ORDER BY fecha_abono DESC', 
            [id]
        );
        
        res.json({
            resumen: venta[0],
            historial: abonos
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
});

router.get('/ventas/:id/boleta', async (req, res) => {
    // 1. Declaramos el documento fuera para poder cerrarlo en el catch si es necesario
    const doc = new PDFDocument({ size: 'A4', margin: 40 });

    try {
        const id_venta = req.params.id;

        // 2. OBTENER DATOS (Importante: hacerlo con await antes del pipe)
        const [ventaRows] = await db.query(`
            SELECT v.*, c.nombre_cliente, c.apellido_cliente 
            FROM ventas v 
            JOIN clientes c ON v.id_cliente = c.id_clientes 
            WHERE v.id_venta = ?`, [id_venta]);

        const [detalle] = await db.query(`
            SELECT dv.*, p.nombre_producto 
            FROM detalle_ventas dv 
            JOIN productos p ON dv.id_producto = p.id_producto 
            WHERE dv.id_venta = ?`, [id_venta]);

        if (ventaRows.length === 0) {
            return res.status(404).send("Venta no encontrada");
        }

        const venta = ventaRows[0];
        const numeroBoleta = `NV-${String(id_venta).padStart(6, '0')}`;
        
        const fechaPeru = new Date().toLocaleDateString('es-PE', {
            timeZone: 'America/Lima',
            year: 'numeric', month: '2-digit', day: '2-digit'
        });

        // 3. CONFIGURAR RESPUESTA
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=${numeroBoleta}.pdf`);
        doc.pipe(res);

        // ===== DISEÑO DEL PDF =====
        
        // Logo (con protección por si no existe en el servidor)
        try {
            const logoPath = path.join(__dirname, '../assets/logo2.png');
            doc.image(logoPath, 40, 40, { width: 70 });
        } catch (e) {
            doc.fontSize(15).text('MUEBLERÍA', 40, 40); 
        }

        doc.fillColor('#1a1a1a')
           .fontSize(16).font('Helvetica-Bold').text('MUEBLERIA "EL MARQUÉZ"', 130, 45)
           .fontSize(9).font('Helvetica').text('TELF: 995888883', 130, 65)
           .text('PILCOMAYO - HUANCAYO - JUNIN', 130, 78);

        // Recuadro Boleta
        doc.rect(380, 40, 180, 75).lineWidth(1.5).stroke('#050a17'); 
        doc.fillColor('#050a17').fontSize(11).font('Helvetica-Bold').text('NOTA DE VENTA', 390, 50, { width: 160, align: 'center' });
        doc.fillColor('black').fontSize(12).text(numeroBoleta, 390, 70, { align: 'center' });
        doc.fontSize(9).font('Helvetica').text(`Fecha: ${fechaPeru}`, 390, 95, { align: 'center' });

        // Datos Cliente
        doc.roundedRect(40, 130, 520, 40, 5).lineWidth(0.5).stroke('#cccccc');
        doc.fontSize(10).font('Helvetica-Bold').text('CLIENTE:', 50, 145);
        doc.font('Helvetica').text(`${venta.nombre_cliente} ${venta.apellido_cliente}`, 105, 145);

        // Tabla
        let currentY = 200;
        doc.rect(40, currentY, 520, 20).fill('#f3f4f6').stroke('#eeeeee');
        doc.fillColor('#374151').font('Helvetica-Bold').fontSize(9);
        doc.text('ITEM', 45, currentY + 6);
        doc.text('DESCRIPCIÓN', 90, currentY + 6);
        doc.text('PRECIO', 350, currentY + 6);
        doc.text('CANT.', 430, currentY + 6);
        doc.text('SUBTOTAL', 500, currentY + 6);

        currentY += 25;
        doc.fillColor('black').font('Helvetica').fontSize(9);

        detalle.forEach((d, index) => {
            doc.text(index + 1, 45, currentY);
            doc.text(`${d.nombre_producto} - ${d.color || 'N/A'}`, 90, currentY);
            doc.text(`S/ ${parseFloat(d.precio_detalle_ventas_productos).toFixed(2)}`, 350, currentY);
            doc.text(d.cantidad_detalle_ventas_productos, 430, currentY);
            doc.font('Helvetica-Bold').text(`S/ ${parseFloat(d.sub_total_detalle_ventas).toFixed(2)}`, 500, currentY);
            doc.font('Helvetica');
            currentY += 20;
        });

        // Total
        doc.rect(380, currentY + 10, 180, 25).fill('#f3f4f6').stroke('#eeeeee');
        doc.fillColor('#374151').font('Helvetica-Bold').fontSize(11);
        doc.text('TOTAL:', 390, currentY + 17);
        doc.text(`S/ ${parseFloat(venta.total_venta).toFixed(2)}`, 500, currentY + 17);

        // Finalizar el stream
        doc.end();

    } catch (error) {
        console.error("ERROR GENERANDO PDF:", error);
        if (!res.headersSent) {
            res.status(500).send("Error al generar el PDF: " + error.message);
        } else {
            // Si el error ocurrió a mitad del pipe, cerramos forzosamente
            doc.end();
        }
    }
});


    return router;
};



    
