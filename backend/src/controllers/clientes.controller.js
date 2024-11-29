const pool = require('../config/database');

const clientesController = {
    async getAll(req, res) {
        try {
            const [clientes] = await pool.query('SELECT * FROM clientes ORDER BY nombre_apellido');
            res.json(clientes);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error al obtener clientes' });
        }
    },

    async getById(req, res) {
        try {
            const [clientes] = await pool.query('SELECT * FROM clientes WHERE id = ?', [req.params.id]);
            
            if (clientes.length === 0) {
                return res.status(404).json({ message: 'Cliente no encontrado' });
            }
            
            res.json(clientes[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error al obtener cliente' });
        }
    },

    async create(req, res) {
        const { nombre_apellido, telefono, barrio, direccion, piso_depto } = req.body;
    
        // Validación de campos requeridos
        if (!nombre_apellido || !telefono || !barrio || !direccion) {
            return res.status(400).json({ 
                message: 'Todos los campos son obligatorios excepto piso y departamento' 
            });
        }
    
        try {
            // Verificar si el teléfono ya existe
            const [existingCliente] = await pool.query(
                'SELECT * FROM clientes WHERE telefono = ?', 
                [telefono]
            );
    
            if (existingCliente.length > 0) {
                return res.status(400).json({ 
                    message: 'Ya existe un cliente con ese número de teléfono' 
                });
            }
    
            const [result] = await pool.query(
                'INSERT INTO clientes (nombre_apellido, telefono, barrio, direccion, piso_depto) VALUES (?, ?, ?, ?, ?)',
                [nombre_apellido, telefono, barrio, direccion, piso_depto || null]
            );
    
            const [nuevoCliente] = await pool.query(
                'SELECT * FROM clientes WHERE id = ?', 
                [result.insertId]
            );
            
            res.status(201).json(nuevoCliente[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error al crear cliente' });
        }
    },

    async update(req, res) {
        const { nombre_apellido, direccion, telefono, email } = req.body;
        const { id } = req.params;

        try {
            const [result] = await pool.query(
                'UPDATE clientes SET nombre_apellido = ?, direccion = ?, telefono = ?, email = ? WHERE id = ?',
                [nombre_apellido, direccion, telefono, email, id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Cliente no encontrado' });
            }

            const [clienteActualizado] = await pool.query('SELECT * FROM clientes WHERE id = ?', [id]);
            res.json(clienteActualizado[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error al actualizar cliente' });
        }
    },

    async delete(req, res) {
        try {
            const [result] = await pool.query('DELETE FROM clientes WHERE id = ?', [req.params.id]);

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Cliente no encontrado' });
            }

            res.json({ message: 'Cliente eliminado exitosamente' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error al eliminar cliente' });
        }
    }
};

module.exports = clientesController;
