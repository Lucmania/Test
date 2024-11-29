const pool = require('../config/database');

const productosController = {
    async getAll(req, res) {
        try {
            const [productos] = await pool.query('SELECT * FROM productos ORDER BY nombre');
            res.json(productos);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error al obtener productos' });
        }
    },

    async getById(req, res) {
        try {
            const [productos] = await pool.query('SELECT * FROM productos WHERE id = ?', [req.params.id]);
            
            if (productos.length === 0) {
                return res.status(404).json({ message: 'Producto no encontrado' });
            }
            
            res.json(productos[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error al obtener producto' });
        }
    },

    async create(req, res) {
        const { nombre, precio, descripcion } = req.body;

        // Validación de campos requeridos
        if (!nombre || !precio || !descripcion) {
            return res.status(400).json({ 
                message: 'Nombre, precio y descripción son obligatorios' 
            });
        }

        try {
            const [result] = await pool.query(
                'INSERT INTO productos (nombre, precio, descripcion) VALUES (?, ?, ?)',
                [nombre, precio, descripcion]
            );

            const [nuevoProducto] = await pool.query(
                'SELECT * FROM productos WHERE id = ?',
                [result.insertId]
            );

            res.status(201).json(nuevoProducto[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ 
                message: 'Error al crear producto',
                error: error.message 
            });
        }
    },

    async update(req, res) {
        const { nombre, descripcion, precio, stock } = req.body;
        const { id } = req.params;

        try {
            const [result] = await pool.query(
                'UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ? WHERE id = ?',
                [nombre, descripcion, precio, stock, id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Producto no encontrado' });
            }

            const [productoActualizado] = await pool.query('SELECT * FROM productos WHERE id = ?', [id]);
            res.json(productoActualizado[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error al actualizar producto' });
        }
    },

    async delete(req, res) {
        try {
            const [result] = await pool.query('DELETE FROM productos WHERE id = ?', [req.params.id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Producto no encontrado' });
            }

            res.json({ message: 'Producto eliminado exitosamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error al eliminar producto' });
        }
    },

    async updateStock(req, res) {
        const { id } = req.params;
        const { cantidad } = req.body;

        try {
            const [result] = await pool.query(
                'UPDATE productos SET stock = stock + ? WHERE id = ?',
                [cantidad, id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Producto no encontrado' });
            }

            const [productoActualizado] = await pool.query('SELECT * FROM productos WHERE id = ?', [id]);
            res.json(productoActualizado[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error al actualizar stock' });
        }
    }
};

module.exports = productosController;
