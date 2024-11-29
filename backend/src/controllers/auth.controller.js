const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/config');

const authController = {
    async register(req, res) {
        const { nombre, email, password } = req.body;
        
        try {
            // Verificar si el usuario ya existe
            const [existingUsers] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
            
            if (existingUsers.length > 0) {
                return res.status(400).json({ message: 'El email ya está registrado' });
            }

            // Encriptar contraseña
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Insertar nuevo usuario
            const [result] = await pool.query(
                'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)',
                [nombre, email, hashedPassword]
            );

            // Generar token
            const token = jwt.sign(
                { id: result.insertId, email },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );

            res.status(201).json({
                message: 'Usuario registrado exitosamente',
                token,
                user: { id: result.insertId, nombre, email }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error al registrar usuario' });
        }
    },

    async login(req, res) {
        const { email, password } = req.body;

        try {
            // Buscar usuario
            const [users] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
            
            if (users.length === 0) {
                return res.status(401).json({ message: 'Credenciales inválidas' });
            }

            const user = users[0];

            // Verificar contraseña
            const isValidPassword = await bcrypt.compare(password, user.password);
            
            if (!isValidPassword) {
                return res.status(401).json({ message: 'Credenciales inválidas' });
            }

            // Generar token
            const token = jwt.sign(
                { id: user.id, email: user.email },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );

            res.json({
                message: 'Login exitoso',
                token,
                user: {
                    id: user.id,
                    nombre: user.nombre,
                    email: user.email
                }
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error en el servidor' });
        }
    }
};

module.exports = authController;
