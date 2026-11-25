
const express = require('express');

module.exports = function (db) {
    const router = express.Router();

    // GET: listar todos los productos
    router.get('/', async (req, res) => {
        try {
            const resultado = await db.query(`
                SELECT
                    id_producto AS id,
                    nombre_producto AS nombre,
                    descripcion_producto AS descripcion,
                    precio_producto AS precio_unitario
                FROM productos
                ORDER BY id_producto DESC
            `);

            res.json(resultado.rows);

        } catch (error) {
            console.error('Error al obtener productos:', error.message);
            res.status(500).json({
                error: 'Error al obtener productos'
            });
        }
    });

    // POST: registrar un producto
    router.post('/', async (req, res) => {
        try {
            const { nombre, descripcion, precio_unitario } = req.body;

            if (
                !nombre ||
                precio_unitario === undefined ||
                precio_unitario === null
            ) {
                return res.status(400).json({
                    message: 'Campos obligatorios faltantes'
                });
            }

            const resultado = await db.query(
                `INSERT INTO productos
                    (nombre_producto, descripcion_producto, precio_producto)
                 VALUES ($1, $2, $3)
                 RETURNING id_producto`,
                [nombre, descripcion, precio_unitario]
            );

            res.status(201).json({
                id: resultado.rows[0].id_producto
            });

        } catch (error) {
            console.error('Error al registrar producto:', error.message);
            res.status(500).json({
                error: 'Error al registrar producto'
            });
        }
    });

    // PUT: actualizar un producto
    router.put('/:id', async (req, res) => {
        try {
            const { nombre, descripcion, precio_unitario } = req.body;
            const { id } = req.params;

            const resultado = await db.query(
                `UPDATE productos
                 SET nombre_producto = $1,
                     descripcion_producto = $2,
                     precio_producto = $3
                 WHERE id_producto = $4`,
                [nombre, descripcion, precio_unitario, id]
            );

            if (resultado.rowCount === 0) {
                return res.status(404).json({
                    message: 'No encontrado'
                });
            }

            res.json({
                message: 'Actualizado'
            });

        } catch (error) {
            console.error('Error al actualizar producto:', error.message);
            res.status(500).json({
                error: 'Error al actualizar producto'
            });
        }
    });

    // DELETE: eliminar un producto
    router.delete('/:id', async (req, res) => {
        try {
            const { id } = req.params;

            const resultado = await db.query(
                'DELETE FROM productos WHERE id_producto = $1',
                [id]
            );

            if (resultado.rowCount === 0) {
                return res.status(404).json({
                    message: 'No encontrado'
                });
            }

            res.json({
                message: 'Eliminado'
            });

        } catch (error) {
            console.error('Error al eliminar producto:', error.message);
            res.status(500).json({
                error: 'Error al eliminar producto'
            });
        }
    });

    return router;
};
