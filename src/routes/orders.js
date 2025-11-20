const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrdersByDateRange,
  getSalesSummary,
  sendReceipt
} = require('../controllers/orderController');

const router = express.Router();


router.use(authenticateToken);


router.post('/', createOrder);


router.get('/', getAllOrders);


router.get('/:id', getOrderById);


router.get('/date-range', getOrdersByDateRange);


router.get('/summary/sales', getSalesSummary);

router.post('/send-receipt', sendReceipt);

module.exports = router;
