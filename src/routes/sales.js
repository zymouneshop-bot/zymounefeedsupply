const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const {
  recordSale,
  getDailySales,
  getSalesAnalytics,
  generateProductQR,
  getProductForQR,
  recalculateSales,
  getDirectSalesData,
  resetAllSales
} = require('../controllers/salesController');

const router = express.Router();


router.get('/product/:productId', getProductForQR);
router.post('/record', recordSale);


router.get('/daily', authenticateToken, requireAdmin, getDailySales);
router.get('/analytics', authenticateToken, requireAdmin, getSalesAnalytics);
router.get('/direct', authenticateToken, requireAdmin, getDirectSalesData);
router.get('/qr/:productId', authenticateToken, requireAdmin, generateProductQR);
router.post('/recalculate', authenticateToken, requireAdmin, recalculateSales);
router.delete('/reset-all', authenticateToken, requireAdmin, resetAllSales);

module.exports = router;
