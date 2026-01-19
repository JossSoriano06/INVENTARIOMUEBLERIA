const express = require('express');

module.exports = function (db) {
  const router = express.Router();

  // GET
  router.get('/', async (req, res) => {
    try {
      const [rows] = await db.query(`
        SELECT 
          id_producto AS id,
          nombre_producto AS nombre,
          descripcion_producto AS descripcion,
          precio_producto AS precio_unitario
        FROM productos
        ORDER BY id_producto DESC
      `);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: 'Error al obtener productos' });
    }
  });

  // insertar datos
  router.post('/', async (req, res) => {
    const { nombre, descripcion, precio_unitario } = req.body;

    if (!nombre || precio_unitario === undefined) {
      return res.status(400).json({ message: 'Campos obligatorios faltantes' });
    }

    const [result] = await db.query(
      `INSERT INTO productos (nombre_producto, descripcion_producto, precio_producto)
       VALUES (?, ?, ?)`,
      [nombre, descripcion, precio_unitario]
    );

    res.status(201).json({ id: result.insertId });
  });

  // ACTUALIZAR DATOS
  router.put('/:id', async (req, res) => {
    const { nombre, descripcion, precio_unitario } = req.body;

    const [result] = await db.query(
      `UPDATE productos
       SET nombre_producto = ?, descripcion_producto = ?, precio_producto = ?
       WHERE id_producto = ?`,
      [nombre, descripcion, precio_unitario, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'No encontrado' });
    }

    res.json({ message: 'Actualizado' });
  });

  // DELETE
  router.delete('/:id', async (req, res) => {
    await db.query('DELETE FROM productos WHERE id_producto = ?', [req.params.id]);
    res.json({ message: 'Eliminado' });
  });

  return router;
};

