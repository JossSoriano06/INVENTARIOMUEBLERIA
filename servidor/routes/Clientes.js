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
                SELECT id_venta, fecha_vente, total_venta
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
    const { productos } = req.body;

    if (!productos || productos.length === 0) {
        return res.status(400).json({ message: 'Carrito vacío' });
    }

    try {
        await db.beginTransaction();

        let total = 0;
        for (const p of productos) {
            if (!p.color) {
                throw new Error('Producto sin color');
            }
            total += Number(p.cantidad) * Number(p.precio);
        }
        
        const fechaPeru = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Lima' });

    
    const [venta] = await db.query(
        `INSERT INTO ventas (fecha_vente, total_venta, id_cliente)
         VALUES (?, ?, ?)`,
        [fechaPeru, total, id_cliente]
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
        res.json({ message: 'Venta registrada correctamente' });

    } catch (error) {
        await db.rollback();
        console.error('ERROR VENTA:', error.message);
        res.status(500).json({ message: error.message });
    }
});

router.get('/ventas/:id/boleta', async (req, res) => {
    try {
        const idVenta = req.params.id;

        // ===== DATOS DE LA VENTA =====
       const [[venta]] = await db.query(`
    SELECT 
        v.id_venta,
        v.total_venta,
        c.nombre_cliente,
        c.apellido_cliente
    FROM ventas v
    JOIN clientes c ON c.id_clientes = v.id_cliente
    WHERE v.id_venta = ?
`, [idVenta]);

        // ===== DETALLE =====
        const [detalle] = await db.query(`
            SELECT 
                p.nombre_producto,
                d.color,
                d.cantidad_detalle_ventas_productos AS cantidad,
                d.precio_detalle_ventas_productos AS precio,
                d.sub_total_detalle_ventas AS subtotal
            FROM detalle_ventas d
            JOIN productos p ON p.id_producto = d.id_producto
            WHERE d.id_venta = ?
        `, [idVenta]);

        // ===== NUMERACIÓN =====
        const [[serieData]] = await db.query(
            'SELECT * FROM boleta_serie WHERE id = 1'
        );

        const nuevoCorrelativo = serieData.correlativo + 1;

        await db.query(
            'UPDATE boleta_serie SET correlativo = ? WHERE id = 1',
            [nuevoCorrelativo]
        );

        const numeroBoleta = `${serieData.serie}-${String(nuevoCorrelativo).padStart(6, '0')}`;

        // ===== PDF SETUP =====
const doc = new PDFDocument({ size: 'A4', margin: 40 });

res.setHeader('Content-Type', 'application/pdf');
res.setHeader('Content-Disposition', `inline; filename=${numeroBoleta}.pdf`);

doc.pipe(res);

// ===== LOGO Y ENCABEZADO =====
doc.image(path.join(__dirname, '../assets/logo2.png'), 40, 40, { width: 70 });

doc.fillColor('#1a1a1a')
   .fontSize(16).font('Helvetica-Bold').text('MUEBLERIA "EL MARQUÉZ"', 130, 45)
   .fontSize(9).font('Helvetica').text('TELF: 995888883', 130, 65)
   .text('PILCOMAYO - HUANCAYO - JUNIN', 130, 78)
   .fontSize(8).fillColor('gray').text('Fabricación y venta de muebles para el hogar y oficina', 130, 92);

// ===== RECUADRO DEL COMPROBANTE =====
doc.rect(380, 40, 180, 75).lineWidth(1.5).stroke('#050a17'); 
doc.fillColor('#050a17').fontSize(11).font('Helvetica-Bold').text('NOTA DE VENTA', 390, 50, { width: 160, align: 'center' });
doc.fillColor('black').fontSize(12).text(numeroBoleta, 390, 70, { align: 'center' });
doc.fontSize(9).font('Helvetica').text(`Fecha: ${new Date().toLocaleDateString()}`, 390, 95, { align: 'center' });

// ===== DATOS DEL CLIENTE =====
doc.roundedRect(40, 130, 520, 40, 5).lineWidth(0.5).stroke('#cccccc');
doc.fontSize(10).font('Helvetica-Bold').text('CLIENTE:', 50, 145);
doc.font('Helvetica').text(`${venta.nombre_cliente} ${venta.apellido_cliente}`, 105, 145);

doc.moveDown(4);

// ===== TABLA DE PRODUCTOS =====
const tableTop = 200;
const itemCodeX = 40;
const descriptionX = 90;
const priceX = 350;
const quantityX = 430;
const amountX = 500;

// Encabezado de la tabla (con fondo gris)
doc.rect(40, tableTop, 520, 20).fill('#f3f4f6').stroke('#eeeeee');
doc.fillColor('#374151').font('Helvetica-Bold').fontSize(9);
doc.text('ITEM', itemCodeX, tableTop + 6);
doc.text('DESCRIPCIÓN', descriptionX, tableTop + 6);
doc.text('PRECIO', priceX, tableTop + 6);
doc.text('CANT.', quantityX, tableTop + 6);
doc.text('SUBTOTAL', amountX, tableTop + 6);

// Filas de la tabla
let currentY = tableTop + 25;
doc.fillColor('black').font('Helvetica').fontSize(9);

detalle.forEach((d, index) => {
    // Línea divisoria suave entre filas
    doc.moveTo(40, currentY + 15).lineTo(560, currentY + 15).lineWidth(0.5).stroke('#eeeeee');

    doc.text(index + 1, itemCodeX, currentY);
    doc.text(`${d.nombre_producto} (${d.color || 'Estándar'})`, descriptionX, currentY);
    doc.text(`S/ ${parseFloat(d.precio).toFixed(2)}`, priceX, currentY);
    doc.text(d.cantidad, quantityX, currentY);
    doc.font('Helvetica-Bold').text(`S/ ${parseFloat(d.subtotal).toFixed(2)}`, amountX, currentY);
    
    doc.font('Helvetica'); // Reset font
    currentY += 25; // Espaciado entre filas
});

// ===== TOTALES =====
const footerTop = currentY + 20;

doc.rect(380, footerTop - 20, 180, 25).fill('#f3f4f6').stroke('#eeeeee');
doc.fillColor('#374151').font('Helvetica-Bold').fontSize(11);
doc.text('TOTAL:', 390, footerTop - 15);
doc.text(`S/ ${parseFloat(venta.total_venta).toFixed(2)}`, 500, footerTop - 15);

// ===== PIE DE PÁGINA =====
doc.fillColor('gray').fontSize(8).font('Helvetica-Oblique')
   .text('Gracias por su preferencia. La muebleria "El Marquéz" es sinónimo de calidad.', 40, 750, { align: 'center' });

doc.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al generar boleta' });
    }
});


    return router;
};



    
