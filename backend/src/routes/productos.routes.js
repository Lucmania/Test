const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productos.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', productosController.getAll);
router.get('/:id', productosController.getById);
router.post('/', productosController.create);
router.put('/:id', productosController.update);
router.delete('/:id', productosController.delete);
router.patch('/:id/stock', productosController.updateStock);

module.exports = router;
