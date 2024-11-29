const pool = require('../config/database');

const pedidosController = {
    async getAll(req, res) {
        try {
            const [pedidos] = await pool.query(`
                SELECT p.*, c.nombre as cliente_nombre 
                FROM pedidos p 
                JOIN clientes c ON p.cliente_id = c.id 
                ORDER BY p.created_at DESC
            `);

            // Obtener detalles de cada pedido
            for (let pedido of pedidos) {
                const [detalles] = await pool.query(`
                    SELECT d.*, pr.nombre as producto_nombre 
                    FROM detalle_pedidos d 
                    JOIN productos pr ON d.producto_id = pr.id 
                    WHERE d.pedido_id = ?
                `, [pedido.id]);
                
                pedido.detalles = detalles;
            }

            res.json(pedidos);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error al obtener pedidos' });
        }
    },

    async getById(req, res) {
        try {
            const [pedidos] = await pool.query(`
                SELECT p.*, c.nombre as cliente_nombre 
                FROM pedidos p 
                JOIN clientes c ON p.cliente_id = c.id 
                WHERE p.id = ?
            `, [req.params.id]);

            if (pedidos.length === 0) {
                return res.status(404).json({ message: 'Pedido no encontrado' });
            }

            const pedido = pedidos[0];

            // Obtener detalles del pedido
            const [detalles] = await pool.query(`
                SELECT d.*, pr.nombre as producto_nombre 
                FROM detalle_pedidos d 
                JOIN productos pr ON d.producto_id = pr.id 
                WHERE d.pedido_id = ?
            `, [pedido.id]);

            pedido.detalles = detalles;
            res.json(pedido);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error al obtener pedido' });
        }
    },

    async create(req, res) {
        const { cliente_id, detalles } = req.body;
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // Calcular total del pedido
            let total = 0;
            for (const detalle of detalles) {
                const [producto] = await connection.query('SELECT precio, stock FROM productos WHERE id = ?', [detalle.producto_id]);
                
                if (producto.length === 0 || producto[0].stock < detalle.cantidad) {
                    throw new Error(`Stock insuficiente para el producto ${detalle.producto_id}`);
                }

                total += producto[0].precio * detalle.cantidad;
            }

            // Crear pedido
            const [resultPedido] = await connection.query(
                'INSERT INTO pedidos (cliente_id, total) VALUES (?, ?)',
                [cliente_id, total]
            );

            // Insertar detalles y actualizar stock
            for (const detalle of detalles) {
                const [producto] = await connection.query('SELECT precio FROM productos WHERE id = ?', [detalle.producto_id]);
                
                await connection.query(
                    'INSERT INTO detalle_pedidos (pedido_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)',
                    [resultPedido.insertId, detalle.producto_id, detalle.cantidad, producto[0].precio, producto[0].precio * detalle.cantidad]
                );

                await connection.query(
                    'UPDATE productos SET stock = stock - ? WHERE id = ?',
                    [detalle.cantidad, detalle.producto_id]
                );
            }

            await connection.commit();

            const [nuevoPedido] = await connection.query(`
                SELECT p.*, c.nombre as cliente_nombre 
                FROM pedidos p 
                JOIN clientes c ON p.cliente_id = c.id 
                WHERE p.id = ?
            `, [resultPedido.insertId]);

            const [detallesPedido] = await connection.query(`
                SELECT d.*, pr.nombre as producto_nombre 
                FROM detalle_pedidos d 
                JOIN productos pr ON d.producto_id = pr.id 
                WHERE d.pedido_id = ?
            `, [resultPedido.insertId]);

            nuevoPedido[0].detalles = detallesPedido;
            res.status(201).json(nuevoPedido[0]);
        } catch (error) {
            await connection.rollback();
            console.error(error);
            res.status(500).json({ message: error.message || 'Error al crear pedido' });
        } finally {
            connection.release();
        }
    },

    async updateStatus(req, res) {
        const { id } = req.params;
        const { estado } = req.body;

        try {
            const [result] = await pool.query(
                'UPDATE pedidos SET estado = ? WHERE id = ?',
                [estado, id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Pedido no encontrado' });
            }

            const [pedidoActualizado] = await pool.query(`
                SELECT p.*, c.nombre as cliente_nombre 
                FROM pedidos p 
                JOIN clientes c ON p.cliente_id = c.id 
                WHERE p.id = ?
            `, [id]);

            res.json(pedidoActualizado[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error al actualizar estado del pedido' });
        }
    }
};

module.exports = pedidosController;
