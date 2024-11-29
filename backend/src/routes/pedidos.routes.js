const express = require('express');
const router = express.Router();
const pedidosController = require('../controllers/pedidos.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.get('/', pedidosController.getAll);
router.get('/:id', pedidosController.getById);
router.post('/', pedidosController.create);
router.patch('/:id/estado', pedidosController.updateStatus);

module.exports = router;
