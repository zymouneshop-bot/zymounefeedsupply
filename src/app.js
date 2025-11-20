const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const mongoose = require('mongoose');
// Restart backend for CORS update
const multer = require('multer');
const { exec } = require('child_process');
const { initGridFS, getGFSStorage } = require('./config/gridfs');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;
let ngrokUrlPrinted = false;
let globalNgrokUrl = null;

// Function to get the current NGROK URL
function getNgrokUrl() {
  return globalNgrokUrl || `http://localhost:${PORT}`;
}

// Make it accessible globally
global.getNgrokUrl = getNgrokUrl; 


const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://trinavaldezmalit4_db_user:feedsupply@cluster0.zlha3qw.mongodb.net/feeds_store?retryWrites=true&w=majority&appName=Cluster0';
console.log('Connecting to MongoDB:', mongoUri);
console.log('Expected database name: feeds_store');


mongoose.connect(mongoUri, {
  dbName: 'feeds_store', 
  tls: true,
  tlsAllowInvalidCertificates: false,
  tlsAllowInvalidHostnames: false,
  serverSelectionTimeoutMS: 30000, 
  connectTimeoutMS: 30000, 
  socketTimeoutMS: 30000, 
  maxPoolSize: 10, 
  minPoolSize: 5, 
  maxIdleTimeMS: 30000, 
  retryWrites: true,
  w: 'majority'
});

mongoose.connection.on('connected', () => {
  console.log('📦 Connected to MongoDB');
  console.log('📦 Database name:', mongoose.connection.db.databaseName);
  
  
  if (mongoose.connection.db.databaseName !== 'feeds_store') {
    console.log('⚠️  WARNING: Connected to wrong database!');
    console.log('⚠️  Expected: feeds_store');
    console.log('⚠️  Actual:', mongoose.connection.db.databaseName);
  } else {
    console.log('✅ Connected to correct database: feeds_store');
  }
  
  console.log('📦 Collections:', mongoose.connection.db.listCollections().toArray().then(collections => {
    console.log('📦 Available collections:', collections.map(c => c.name));
  }));
  
  
  
  
});

mongoose.connection.on('error', (err) => {
  console.log('❌ MongoDB connection error:', err);
});


// Initialize GridFS
initGridFS();

// Function to upload file to GridFS
async function uploadToGridFS(filePath, filename) {
  try {
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'uploads'
    });
    
    const readStream = fs.createReadStream(filePath);
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: 'image/png'
    });
    
    return new Promise((resolve, reject) => {
      readStream.pipe(uploadStream);
      
      uploadStream.on('error', reject);
      uploadStream.on('finish', () => {
        console.log(`✅ Uploaded to GridFS: ${filename} (ID: ${uploadStream.id})`);
        resolve(uploadStream.id);
      });
    });
  } catch (error) {
    console.error('❌ Error uploading to GridFS:', error);
    throw error;
  }
}

// Use disk storage temporarily, then upload to GridFS manually
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '../uploads/') 
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: function (req, file, cb) {
    
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});


app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:4000", "https://localhost:4000", "https://*.ngrok.io", "https://*.ngrok-free.app", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// Configure CORS to allow production and local requests
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'cache-control', 'pragma', 'expires'],
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Serve images with explicit CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Cache-Control', 'public, max-age=31536000');
  next();
}, express.static(path.join(__dirname, '..', 'uploads')));

// Handle OPTIONS preflight for logo
app.options('/zymoune-logo.png', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Cache-Control', 'public, max-age=31536000');
  res.sendStatus(200);
});

// Serve images from local filesystem first, then GridFS
app.get('/zymoune-logo.png', (req, res) => {
  const logoPath = path.join(__dirname, 'public', 'zymoune-logo.png');
  
  if (fs.existsSync(logoPath)) {
    console.log('✅ Logo file found');
    res.set({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'public, max-age=31536000',
      'Content-Type': 'image/png'
    });
    res.sendFile(logoPath);
  } else {
    console.log('❌ Logo file not found at:', logoPath);
    res.status(404).send('Logo not found');
  }
});

// Serve images from local filesystem first, then GridFS
app.get('/uploads/:filename', (req, res) => {
  // Explicitly set CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Cache-Control', 'public, max-age=31536000');
  
  console.log(`🔍 Requesting image: ${req.params.filename}`);
  
  // First, try to serve from local filesystem
  const localFilePath = path.join(__dirname, '..', 'uploads', req.params.filename);
  
  // Check if file exists locally
  if (fs.existsSync(localFilePath)) {
    console.log('✅ File found locally:', req.params.filename);
    
    // Determine content type based on file extension
    const ext = path.extname(req.params.filename).toLowerCase();
    let contentType = 'image/jpeg';
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.webp') contentType = 'image/webp';
    
    res.set('Content-Type', contentType);
    res.sendFile(localFilePath);
    return;
  }
  
  // If not found locally, try GridFS
  console.log('🔍 File not found locally, checking GridFS...');
  
  // Get GridFS bucket
  const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads'
  });
  
  // Find file in GridFS
  bucket.find({ filename: req.params.filename }).toArray((err, files) => {
    if (err) {
      console.log('❌ Error finding file in GridFS:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    
    if (!files || files.length === 0) {
      console.log('❌ File not found in GridFS:', req.params.filename);
      return res.status(404).json({ error: 'File not found' });
    }
    
    const file = files[0];
    console.log('✅ File found in GridFS:', file.filename);
    
    // Set content type
    res.set('Content-Type', file.contentType || 'image/jpeg');
    
    // Create download stream
    const downloadStream = bucket.openDownloadStreamByName(req.params.filename);
    
    downloadStream.on('error', (err) => {
      console.log('❌ Error reading file stream:', err);
      res.status(500).json({ error: 'Error reading file' });
    });
    
    downloadStream.pipe(res);
  });
});


const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const salesRoutes = require('./routes/sales');


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/dashboard/customer', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'customer-dashboard.html'));
});

app.get('/dashboard/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'admin-dashboard.html'));
});

app.get('/dashboard/staff', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'staff-dashboard.html'));
});


app.get('/qr-scanner', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'qr-scanner.html'));
});



app.get('/product/:id', (req, res) => {
  const productId = req.params.id;
  
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Product Purchase - ZYMOUNE</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            
            .container {
                background: white;
                border-radius: 15px;
                padding: 2rem;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                width: 100%;
                max-width: 500px;
                text-align: center;
            }
            
            .logo {
                font-size: 2rem;
                margin-bottom: 1rem;
                color: #333;
            }
            
            .product-info {
                margin-bottom: 2rem;
            }
            
            .product-name {
                font-size: 1.5rem;
                color: #333;
                margin-bottom: 0.5rem;
            }
            
            .product-price {
                font-size: 1.8rem;
                color: #28a745;
                font-weight: bold;
                margin-bottom: 1rem;
            }
            
            .product-stock {
                color: #666;
                margin-bottom: 2rem;
            }
            
            .purchase-options {
                margin-bottom: 2rem;
            }
            
            .option-btn {
                display: block;
                width: 100%;
                padding: 1rem;
                margin-bottom: 1rem;
                border: 2px solid #e1e5e9;
                border-radius: 10px;
                background: white;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 1rem;
                font-weight: 500;
            }
            
            .option-btn:hover {
                border-color: #667eea;
                background: #f8f9ff;
            }
            
            .option-btn.selected {
                border-color: #667eea;
                background: #667eea;
                color: white;
            }
            
            .quantity-section {
                margin-bottom: 2rem;
                display: none;
            }
            
            .quantity-section.show {
                display: block;
            }
            
            .quantity-input {
                width: 100%;
                padding: 0.75rem;
                border: 2px solid #e1e5e9;
                border-radius: 8px;
                font-size: 1rem;
                text-align: center;
                margin-bottom: 1rem;
            }
            
            .quantity-input:focus {
                outline: none;
                border-color: #667eea;
            }
            
            .total-price {
                font-size: 1.2rem;
                color: #28a745;
                font-weight: bold;
                margin-bottom: 1rem;
            }
            
            .customer-info {
                margin-bottom: 2rem;
                text-align: left;
            }
            
            .customer-info h3 {
                margin-bottom: 1rem;
                color: #333;
            }
            
            .form-group {
                margin-bottom: 1rem;
            }
            
            .form-group label {
                display: block;
                margin-bottom: 0.5rem;
                color: #666;
                font-weight: 500;
            }
            
            .form-group input {
                width: 100%;
                padding: 0.75rem;
                border: 2px solid #e1e5e9;
                border-radius: 8px;
                font-size: 1rem;
            }
            
            .form-group input:focus {
                outline: none;
                border-color: #667eea;
            }
            
            .purchase-btn {
                width: 100%;
                padding: 1rem;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                border-radius: 10px;
                font-size: 1.1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                margin-bottom: 1rem;
            }
            
            .purchase-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
            }
            
            .purchase-btn:disabled {
                background: #ccc;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }
            
            .loading {
                display: none;
                text-align: center;
                color: #667eea;
                margin-top: 1rem;
            }
            
            .success {
                display: none;
                background: #d4edda;
                color: #155724;
                padding: 1rem;
                border-radius: 8px;
                margin-top: 1rem;
                border-left: 4px solid #28a745;
            }
            
            .error {
                display: none;
                background: #f8d7da;
                color: #721c24;
                padding: 1rem;
                border-radius: 8px;
                margin-top: 1rem;
                border-left: 4px solid #dc3545;
            }
            
            .spinner {
                border: 2px solid #f3f3f3;
                border-top: 2px solid #667eea;
                border-radius: 50%;
                width: 20px;
                height: 20px;
                animation: spin 1s linear infinite;
                display: inline-block;
                margin-right: 0.5rem;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">🐔🐷 ZYMOUNE</div>
            
            <div class="product-info">
                <div class="product-name" id="productName">Loading...</div>
                <div class="product-price" id="productPrice">₱0.00</div>
                <div class="product-stock" id="productStock">Stock: Loading...</div>
            </div>
            
            <div class="purchase-options">
                <h3>Choose Purchase Option:</h3>
                <button class="option-btn" data-unit="sack" data-price="0">
                    🛍️ Buy by Sack
                </button>
                <button class="option-btn" data-unit="kilo" data-price="0">
                    ⚖️ Buy by Kilo
                </button>
            </div>
            
            <div class="quantity-section" id="quantitySection">
                <h3>Quantity:</h3>
                <input type="number" id="quantityInput" class="quantity-input" min="1" value="1">
                <div class="total-price" id="totalPrice">Total: ₱0.00</div>
            </div>
            
            <div class="customer-info">
                <h3>Customer Information:</h3>
                <div class="form-group">
                    <label for="customerName">Name:</label>
                    <input type="text" id="customerName" placeholder="Enter your name">
                </div>
                <div class="form-group">
                    <label for="customerPhone">Phone:</label>
                    <input type="tel" id="customerPhone" placeholder="Enter your phone number">
                </div>
                <div class="form-group">
                    <label for="customerEmail">Email (Optional):</label>
                    <input type="email" id="customerEmail" placeholder="Enter your email">
                </div>
            </div>
            
            <button class="purchase-btn" id="purchaseBtn" disabled>
                Confirm Purchase
            </button>
            
            <div class="loading" id="loading">
                <div class="spinner"></div>
                Processing purchase...
            </div>
            
            <div class="success" id="success">
                ✅ Purchase successful! Thank you for your business.
            </div>
            
            <div class="error" id="error">
                ❌ Purchase failed. Please try again.
            </div>
        </div>

        <script>
            const productId = '${productId}';
            let selectedUnit = '';
            let unitPrice = 0;
            let productData = null;
            
            
            async function loadProduct() {
                try {
                    const response = await fetch(\`/api/sales/product/\${productId}\`);
                    const data = await response.json();
                    
                    if (response.ok) {
                        productData = data.product;
                        document.getElementById('productName').textContent = productData.name;
                        document.getElementById('productPrice').textContent = \`₱\${productData.price.toFixed(2)}\`;
                        document.getElementById('productStock').textContent = \`Stock: \${productData.stock} \${productData.unit}\`;
                        
                        
                        const sackBtn = document.querySelector('[data-unit="sack"]');
                        const kiloBtn = document.querySelector('[data-unit="kilo"]');
                        
                        sackBtn.setAttribute('data-price', productData.price);
                        sackBtn.innerHTML = \`🛍️ Buy by Sack - ₱\${productData.price.toFixed(2)}\`;
                        
                        
                        const kiloPrice = productData.price / 25;
                        kiloBtn.setAttribute('data-price', kiloPrice);
                        kiloBtn.innerHTML = \`⚖️ Buy by Kilo - ₱\${kiloPrice.toFixed(2)}\`;
                        
                    } else {
                        showError('Product not found');
                    }
                } catch (error) {
                    showError('Failed to load product');
                }
            }
            
            
            document.querySelectorAll('.option-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    
                    selectedUnit = btn.getAttribute('data-unit');
                    unitPrice = parseFloat(btn.getAttribute('data-price'));
                    
                    document.getElementById('quantitySection').classList.add('show');
                    document.getElementById('purchaseBtn').disabled = false;
                    
                    updateTotal();
                });
            });
            
            
            document.getElementById('quantityInput').addEventListener('input', updateTotal);
            
            function updateTotal() {
                const quantity = parseInt(document.getElementById('quantityInput').value) || 0;
                const total = quantity * unitPrice;
                document.getElementById('totalPrice').textContent = \`Total: ₱\${total.toFixed(2)}\`;
            }
            
            
            document.getElementById('purchaseBtn').addEventListener('click', async () => {
                if (!selectedUnit || !productData) return;
                
                const quantity = parseInt(document.getElementById('quantityInput').value);
                const customerName = document.getElementById('customerName').value;
                const customerPhone = document.getElementById('customerPhone').value;
                const customerEmail = document.getElementById('customerEmail').value;
                
                if (!customerName || !customerPhone) {
                    showError('Please fill in your name and phone number');
                    return;
                }
                
                if (quantity <= 0) {
                    showError('Please enter a valid quantity');
                    return;
                }
                
                showLoading();
                
                try {
                    const saleData = {
                        productId: productData.id,
                        quantity: quantity,
                        unit: selectedUnit,
                        pricePerUnit: unitPrice,
                        customerInfo: {
                            name: customerName,
                            phone: customerPhone,
                            email: customerEmail
                        }
                    };
                    
                    const response = await fetch('/api/sales/record', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(saleData)
                    });
                    
                    const result = await response.json();
                    
                    if (response.ok) {
                        showSuccess();
                        
                        document.getElementById('quantityInput').value = 1;
                        document.getElementById('customerName').value = '';
                        document.getElementById('customerPhone').value = '';
                        document.getElementById('customerEmail').value = '';
                        document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
                        document.getElementById('quantitySection').classList.remove('show');
                        document.getElementById('purchaseBtn').disabled = true;
                    } else {
                        showError(result.error || 'Purchase failed');
                    }
                } catch (error) {
                    showError('Network error. Please try again.');
                }
            });
            
            function showLoading() {
                document.getElementById('loading').style.display = 'block';
                document.getElementById('success').style.display = 'none';
                document.getElementById('error').style.display = 'none';
                document.getElementById('purchaseBtn').disabled = true;
            }
            
            function showSuccess() {
                document.getElementById('loading').style.display = 'none';
                document.getElementById('success').style.display = 'block';
                document.getElementById('error').style.display = 'none';
                document.getElementById('purchaseBtn').disabled = false;
            }
            
            function showError(message) {
                document.getElementById('loading').style.display = 'none';
                document.getElementById('success').style.display = 'none';
                document.getElementById('error').style.display = 'block';
                document.getElementById('error').textContent = message;
                document.getElementById('purchaseBtn').disabled = false;
            }
            
            
            loadProduct();
        </script>
    </body>
    </html>
  `;
  
  res.send(html);
});


app.post('/api/qr/trigger-modal', (req, res) => {
  // Explicitly set CORS headers for this endpoint
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  const { productId, timestamp } = req.body;
  
  
  global.qrTriggerRequests = global.qrTriggerRequests || [];
  global.qrTriggerRequests.push({
    productId: productId, 
    timestamp: timestamp,
    processed: false
  });
  
  res.json({ 
    success: true, 
    message: 'Modal trigger request received',
    productId: productId 
  });
});


app.get('/api/qr/trigger-modal', (req, res) => {
  // Explicitly set CORS headers for this endpoint
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  const { productId, timestamp } = req.query;
  
  
  global.qrTriggerRequests = global.qrTriggerRequests || [];
  global.qrTriggerRequests.push({
    productId: productId, 
    timestamp: timestamp || Date.now(),
    processed: false
  });
  
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Purchase Triggered - ZYMOUNE</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-align: center;
            }
            .container {
                background: rgba(255, 255, 255, 0.1);
                padding: 2rem;
                border-radius: 15px;
                backdrop-filter: blur(10px);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            }
            .success-icon {
                font-size: 4rem;
                margin-bottom: 1rem;
            }
            h1 {
                margin: 0 0 1rem 0;
                font-size: 1.5rem;
            }
            p {
                margin: 0.5rem 0;
                opacity: 0.9;
            }
            .close-btn {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                padding: 0.5rem 1rem;
                border-radius: 5px;
                cursor: pointer;
                margin-top: 1rem;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="success-icon">✅</div>
            <h1>Purchase Triggered!</h1>
            <p>The purchase modal has been opened in the admin dashboard.</p>
            <p>You can close this page now.</p>
            <button class="close-btn" onclick="window.close()">Close</button>
        </div>
    </body>
    </html>
  `;
  
  res.send(html);
});


app.get('/api/qr/check-triggers', (req, res) => {
  // Explicitly set CORS headers for this endpoint
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  global.qrTriggerRequests = global.qrTriggerRequests || [];
  
  
  const unprocessedTrigger = global.qrTriggerRequests.find(trigger => !trigger.processed);
  
  if (unprocessedTrigger) {
    
    unprocessedTrigger.processed = true;
    
    res.json({
      trigger: {
        productId: unprocessedTrigger.productId,
        timestamp: unprocessedTrigger.timestamp
      }
    });
  } else {
    res.json({ trigger: null });
  }
});


app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/staff', require('./routes/staff'));
app.use('/api/orders', require('./routes/orders'));


app.get('/api/products', async (req, res) => {
  try {
    const Product = require('./models/Product');
    const products = await Product.find({});
    res.json({
      success: true,
      products: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products',
      details: error.message
    });
  }
});


app.post('/api/products', upload.single('imageFile'), async (req, res) => {
  try {
    const Product = require('./models/Product');
    
    
    const productData = { ...req.body };
    
    
    if (req.file) {
      
      // Upload to GridFS
      const filePath = path.join(__dirname, '..', 'uploads', req.file.filename);
      const gridfsId = await uploadToGridFS(filePath, req.file.filename);
      
      // Use GridFS file ID for cloud storage
      productData.imageUrl = `/uploads/${req.file.filename}`;
      productData.imageId = gridfsId.toString();
      console.log('File uploaded to GridFS:', req.file.filename);
      console.log('GridFS File ID:', gridfsId);
      console.log('Image URL set to:', productData.imageUrl);
    } else if (productData.imageUrl && productData.imageUrl.startsWith('data:image/')) {
      // Handle base64 image from admin dashboard
      console.log('Base64 image received from admin dashboard');
      console.log('Image URL length:', productData.imageUrl.length);
      console.log('Image URL first 50 chars:', productData.imageUrl.substring(0, 50));
      // Keep the base64 imageUrl as is - it will be stored in the database
    } else {
      
      delete productData.imageUrl;
    }
    
    
    delete productData.imageFile;
    
    
    const generateNumericId = () => {
      return Math.floor(1000000000 + Math.random() * 9000000000).toString();
    };
    
    
    productData.customId = generateNumericId();
    
    console.log('Creating product with data:', productData);
    
    const product = new Product(productData);
    await product.save();
    
    res.json({
      success: true,
      product: product,
      message: 'Product created successfully'
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create product',
      details: error.message
    });
  }
});


app.put('/api/products/:id', upload.single('imageFile'), async (req, res) => {
  try {
    const Product = require('./models/Product');
    
    
    const productData = { ...req.body };
    
    
    if (req.file) {
      
      // Upload to GridFS
      const filePath = path.join(__dirname, '..', 'uploads', req.file.filename);
      const gridfsId = await uploadToGridFS(filePath, req.file.filename);
      
      // Use GridFS file ID for cloud storage
      productData.imageUrl = `/uploads/${req.file.filename}`;
      productData.imageId = gridfsId.toString();
      console.log('File uploaded to GridFS for update:', req.file.filename);
      console.log('GridFS File ID:', gridfsId);
      console.log('Image URL set to:', productData.imageUrl);
    } else if (productData.imageUrl && productData.imageUrl.startsWith('data:image/')) {
      // Handle base64 image from admin dashboard
      console.log('Base64 image received from admin dashboard for update');
      console.log('Image URL length:', productData.imageUrl.length);
      console.log('Image URL first 50 chars:', productData.imageUrl.substring(0, 50));
      // Keep the base64 imageUrl as is - it will be stored in the database
    }
    // If no file uploaded and no base64 image, keep existing imageUrl (don't delete it)
    
    
    delete productData.imageFile;
    
    console.log('Updating product with data:', productData);
    
    // Enforce stock rules server-side for data integrity
    try {
      const existing = await Product.findById(req.params.id);
      if (existing && (existing.category === 'supplements' || productData.category === 'supplements')) {
        // For supplements: ensure sack-only stock and zero kilo fields
        if (productData.stock !== undefined && productData.stockSacks === undefined) {
          productData.stockSacks = Number(productData.stock);
        }
        if (productData.stockSacks !== undefined) {
          productData.stock = Number(productData.stockSacks);
        }
        productData.stockKilos = 0;
        productData.stockHalfKilos = 0;
      }
    } catch (e) {
      console.warn('Warning enforcing supplement stock rules:', e.message);
    }

    const product = await Product.findByIdAndUpdate(req.params.id, productData, { new: true });
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      product: product,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update product',
      details: error.message
    });
  }
});


app.delete('/api/products/:id', async (req, res) => {
  try {
    const Product = require('./models/Product');
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }
    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete product',
      details: error.message
    });
  }
});


app.post('/api/seed', async (req, res) => {
  try {
    const createSampleData = require('./database/seeds/sampleData');
    await createSampleData();
    res.json({
      success: true,
      message: 'Sample data created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create sample data',
      details: error.message
    });
  }
});


app.delete('/api/products', async (req, res) => {
  try {
    const Product = require('./models/Product');
    const result = await Product.deleteMany({});
    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} products`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete products',
      details: error.message
    });
  }
});


app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to ZYMOUNE API',
    version: '1.0.0',
    description: 'Feed and supplement sales system for chicken and pig feeds',
    endpoints: {
      auth: '/api/auth',
      dashboard: '/api/dashboard',
      login: '/login',
      customerDashboard: '/dashboard/customer',
      adminDashboard: '/dashboard/admin'
    }
  });
});


app.get('/api/test-db', async (req, res) => {
  try {
    const Staff = require('./models/Staff');
    const collections = await mongoose.connection.db.listCollections().toArray();
    const staffCount = await Staff.countDocuments({});
    const allStaff = await Staff.find({});
    
    res.json({
      database: mongoose.connection.db.databaseName,
      collections: collections.map(c => c.name),
      staffCount: staffCount,
      allStaff: allStaff,
      connectionState: mongoose.connection.readyState
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});


app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        message: 'File size must be less than 50MB'
      });
    }
    return res.status(400).json({
      success: false,
      error: 'File upload error',
      message: err.message
    });
  }
  
  
  if (err.message === 'Only image files are allowed!') {
    return res.status(400).json({
      success: false,
      error: 'Invalid file type',
      message: 'Only image files are allowed'
    });
  }
  
  res.status(500).json({ 
    success: false,
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});


app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});


app.listen(PORT, async () => {
  console.log(`🚀 ZYMOUNE Server running on port ${PORT}`);
  console.log(`📱 API available at: http://localhost:${PORT}/api`);
  console.log(`🏠 Home page: http://localhost:${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  
  // Only start ngrok in development (not in production on Render)
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n🌐 Starting NGROK tunnel...');
    
    
    setTimeout(() => {
      console.log('🔧 Launching ngrok...');
      
      
      const ngrokProcess = exec(`npx ngrok http ${PORT} --log=stdout`, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Failed to start ngrok:', error.message);
          return;
        }
      });
      
      
      setTimeout(async () => {
        try {
          const https = require('https');
          const options = {
            hostname: 'localhost',
            port: 4040,
            path: '/api/tunnels',
            method: 'GET'
          };
          
          const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
              data += chunk;
            });
            res.on('end', () => {
              try {
                const tunnels = JSON.parse(data);
                if (tunnels.tunnels && tunnels.tunnels.length > 0 && !ngrokUrlPrinted) {
                  const tunnel = tunnels.tunnels.find(t => t.proto === 'https');
                  if (tunnel && tunnel.public_url) {
                    const ngrokUrl = tunnel.public_url;
                    globalNgrokUrl = ngrokUrl; // Store globally
                    ngrokUrlPrinted = true; 
                    console.log('\n' + '='.repeat(60));
                    console.log('🌐 NGROK TUNNEL ACTIVE - PUBLIC ACCESS AVAILABLE');
                    console.log('='.repeat(60));
                    console.log(`🔗 Public URL: ${ngrokUrl}`);
                    console.log(`📱 Public API: ${ngrokUrl}/api`);
                    console.log(`🏠 Public Home: ${ngrokUrl}/`);
                    console.log(`🔍 Public Health: ${ngrokUrl}/api/health`);
                    console.log(`👤 Customer Login: ${ngrokUrl}/login`);
                    console.log(`👨‍💼 Admin Login: ${ngrokUrl}/login`);
                    console.log('='.repeat(60));
                    console.log('💡 Share this URL to access your app from anywhere!');
                    console.log('⚠️  Keep this terminal open to maintain the tunnel.');
                    console.log('='.repeat(60) + '\n');
                  }
                }
              } catch (parseError) {
                
              }
            });
          });
          
          req.on('error', () => {
            
          });
          
          req.end();
        } catch (error) {
          
        }
      }, 5000); 
    
    
    ngrokProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('NGROK:', output);
      
      
      const urlMatch = output.match(/https:\/\/[a-zA-Z0-9-]+\.(?:ngrok\.io|ngrok-free\.dev|ngrok\.app)/);
      if (urlMatch && !ngrokUrlPrinted) {
        const ngrokUrl = urlMatch[0];
        globalNgrokUrl = ngrokUrl; // Store globally
        ngrokUrlPrinted = true; 
        console.log('\n' + '='.repeat(60));
        console.log('🌐 NGROK TUNNEL ACTIVE - PUBLIC ACCESS AVAILABLE');
        console.log('='.repeat(60));
        console.log(`🔗 Public URL: ${ngrokUrl}`);
        console.log(`📱 Public API: ${ngrokUrl}/api`);
        console.log(`🏠 Public Home: ${ngrokUrl}/`);
        console.log(`🔍 Public Health: ${ngrokUrl}/api/health`);
        console.log(`👤 Customer Login: ${ngrokUrl}/login`);
        console.log(`👨‍💼 Admin Login: ${ngrokUrl}/login`);
        console.log('='.repeat(60));
        console.log('💡 Share this URL to access your app from anywhere!');
        console.log('⚠️  Keep this terminal open to maintain the tunnel.');
        console.log('='.repeat(60) + '\n');
      }
    });
    
    ngrokProcess.stderr.on('data', (data) => {
      console.log('NGROK ERROR:', data.toString());
    });
    
    }, 2000);
  } else {
    console.log('✅ Production mode detected - ngrok disabled');
  }
});

module.exports = app;
