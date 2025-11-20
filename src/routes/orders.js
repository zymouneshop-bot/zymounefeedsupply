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


// Public endpoints (no auth required)
router.get('/date-range', getOrdersByDateRange);

// Protected endpoints
router.use(authenticateToken);


router.post('/', createOrder);


router.get('/', getAllOrders);


router.get('/:id', getOrderById);


router.get('/summary/sales', getSalesSummary);

router.post('/send-receipt', sendReceipt);

module.exports = router;
