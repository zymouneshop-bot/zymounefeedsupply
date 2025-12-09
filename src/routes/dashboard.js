const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticateToken, requireCustomer, requireAdmin } = require('../middleware/auth');
const {
  getCustomerDashboard,
  getAdminDashboard,
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  bulkCostUpdate,
  getLowStockRecipientEmail,
  updateLowStockRecipientEmail
} = require('../controllers/dashboardController');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
    console.log('📁 Upload destination:', uploadsDir);
    console.log('📁 Resolved path:', path.resolve(uploadsDir));
    
    // Ensure uploads directory exists
    const fs = require('fs');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('📁 Created uploads directory:', uploadsDir);
    }
    
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = 'product-' + uniqueSuffix + path.extname(file.originalname);
    console.log('📁 Generated filename:', filename);
    console.log('📁 Original filename:', file.originalname);
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    console.log('📁 Multer fileFilter - File:', file.originalname, 'MIME:', file.mimetype);
    console.log('📁 File fieldname:', file.fieldname);
    console.log('📁 File size:', file.size);
    
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      console.log('📁 File accepted:', file.originalname);
      cb(null, true);
    } else {
      console.log('📁 File rejected:', file.originalname, 'MIME:', file.mimetype);
      cb(new Error('Only image files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const router = express.Router();
// Low stock recipient email endpoints
router.get('/low-stock-recipient-email', authenticateToken, requireAdmin, getLowStockRecipientEmail);
router.post('/low-stock-recipient-email', authenticateToken, requireAdmin, updateLowStockRecipientEmail);


router.get('/customer', authenticateToken, requireCustomer, getCustomerDashboard);


router.get('/admin', authenticateToken, requireAdmin, getAdminDashboard);


router.get('/products', getAllProducts);
router.get('/products/:id', getProduct);
router.post('/products', (req, res, next) => {
  console.log('🚀 POST /products route hit');
  console.log('🚀 Request headers:', req.headers);
  console.log('🚀 Request body keys:', Object.keys(req.body || {}));
  next();
}, authenticateToken, requireAdmin, (req, res, next) => {
  console.log('📁 Multer middleware - Request received');
  console.log('📁 Multer middleware - Content-Type:', req.headers['content-type']);
  upload.single('imageFile')(req, res, (err) => {
    if (err) {
      console.error('📁 Multer error:', err.message);
      return res.status(400).json({
        error: 'File upload error',
        details: err.message
      });
    }
    console.log('📁 Multer middleware - File processed successfully');
    next();
  });
}, createProduct);
router.put('/products/:id', authenticateToken, requireAdmin, updateProduct);
router.post('/products/bulk-cost-update', authenticateToken, requireAdmin, bulkCostUpdate);

module.exports = router;
