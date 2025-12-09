const User = require('../models/User');
const Product = require('../models/Product');


const getCustomerDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Fetch all data in parallel
    const [user, featuredProducts, chickenFeeds, pigFeeds, supplements, totalProducts, chickenCount, pigCount, supplementsCount] = await Promise.all([
      User.findById(userId).select('-password'),
      Product.find({ featured: true, isActive: true }).limit(8).lean(),
      Product.find({ category: 'chicken-feeds', isActive: true }).limit(6).lean(),
      Product.find({ category: 'pig-feeds', isActive: true }).limit(6).lean(),
      Product.find({ category: 'supplements', isActive: true }).limit(6).lean(),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ category: 'chicken-feeds', isActive: true }),
      Product.countDocuments({ category: 'pig-feeds', isActive: true }),
      Product.countDocuments({ category: 'supplements', isActive: true })
    ]);

    res.json({
      user,
      featuredProducts,
      categories: {
        chickenFeeds,
        pigFeeds,
        supplements
      },
      stats: {
        totalProducts,
        chickenFeedsCount: chickenCount,
        pigFeedsCount: pigCount,
        supplementsCount
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get customer dashboard', 
      details: error.message 
    });
  }
};


const getAdminDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Fetch user and all dashboard data in parallel
    const [user, dashboardStats, recentProducts, allProducts] = await Promise.all([
      User.findById(userId).select('-password'),
      getDashboardStats(),
      Product.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Product.find({ isActive: true }).lean()
    ]);

    // Low stock logic (15% threshold)
    const lowStockProducts = allProducts.filter(p => {
      const maxStock = Math.max(p.maxStock || p.stockSacks || p.stock || 0, p.stockSacks || p.stock || 0);
      const lowStockThreshold = Math.ceil(maxStock * 0.15);
      return (p.stockSacks || p.stock || 0) <= lowStockThreshold;
    });

    // Real-time email notification if any product is low in stock
    if (lowStockProducts.length > 0) {
      const { lowStockRecipientEmail } = require('../config/notification');
      const EmailService = require('../services/emailService');
      const emailService = new EmailService();
      const subject = 'Low Stock Alert';
      const html = `<h2>Low Stock Alert</h2><p>The following products are low in stock:</p><ul>${lowStockProducts.map(p => `<li>${p.name} - ${p.stockSacks || p.stock || 0} left</li>`).join('')}</ul>`;
      emailService.sendEmail({ to: lowStockRecipientEmail, subject, html });
    }

    res.json({
      user,
      stats: {
        totalCustomers: dashboardStats.totalCustomers,
        totalProducts: dashboardStats.totalProducts,
        lowStockCount: lowStockProducts.length,
        productsByCategory: dashboardStats.productsByCategory
      },
      recentProducts,
      lowStockProducts,
      alerts: lowStockProducts.length > 0 ? [
        {
          type: 'warning',
          message: `${lowStockProducts.length} products are low in stock`,
          count: lowStockProducts.length
        }
      ] : []
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get admin dashboard', 
      details: error.message 
    });
  }
};

// Helper function using aggregation pipeline for better performance
// In-memory storage for recipient email (replace with DB for persistence)
let lowStockRecipientEmail = require('../config/notification').lowStockRecipientEmail;

// Get current low stock recipient email
const getLowStockRecipientEmail = (req, res) => {
  res.json({ email: lowStockRecipientEmail });
};

// Update low stock recipient email
const updateLowStockRecipientEmail = (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email address' });
  }
  lowStockRecipientEmail = email;
  res.json({ success: true, email });
};
async function getDashboardStats() {
  try {
    const result = await Product.aggregate([
      { $match: { isActive: true } },
      { $facet: {
        total: [{ $count: "count" }],
        byCategory: [
          { $group: { 
            _id: "$category", 
            count: { $sum: 1 } 
          }},
          { $sort: { _id: 1 } }
        ]
      }}
    ]);

    const totalProducts = result[0].total[0]?.count || 0;
    const categories = result[0].byCategory.reduce((acc, cat) => {
      if (cat._id === 'chicken-feeds') acc.chickenFeeds = cat.count;
      if (cat._id === 'pig-feeds') acc.pigFeeds = cat.count;
      if (cat._id === 'supplements') acc.supplements = cat.count;
      return acc;
    }, { chickenFeeds: 0, pigFeeds: 0, supplements: 0 });

    const totalCustomers = await User.countDocuments({ role: 'customer', isActive: true });
    const lowStockCount = await Product.countDocuments({ stockSacks: { $lt: 10 }, isActive: true });

    return {
      totalProducts,
      totalCustomers,
      lowStockCount,
      productsByCategory: categories
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    throw error;
  }
}


const getAllProducts = async (req, res) => {
  try {
    const { category, subcategory, page = 1, limit = 12 } = req.query;
    
    let filter = { isActive: true };
    
    if (category) {
      filter.category = category;
    }
    
    if (subcategory) {
      filter.subcategory = subcategory;
    }
    
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Product.countDocuments(filter);
    
    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalProducts: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get products', 
      details: error.message 
    });
  }
};


const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findById(id);
    
    if (!product || !product.isActive) {
      return res.status(404).json({ 
        error: 'Product not found' 
      });
    }
    
    res.json({ product });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to get product', 
      details: error.message 
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log('Updating product:', id, 'with data:', updateData);
    
    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.createdAt;
    
    // Validate required fields based on category
    if (updateData.category === 'feeds') {
      if (!updateData.pricePerSack || updateData.pricePerSack <= 0) {
        return res.status(400).json({
          error: 'Invalid price per sack',
          details: 'Price per sack is required and must be greater than 0 for feeds'
        });
      }
      if (!updateData.pricePerKilo || updateData.pricePerKilo <= 0) {
        return res.status(400).json({
          error: 'Invalid price per kilo',
          details: 'Price per kilo is required and must be greater than 0 for feeds'
        });
      }
      if (updateData.stockSacks === undefined || updateData.stockSacks < 0) {
        return res.status(400).json({
          error: 'Invalid stock sacks',
          details: 'Stock sacks is required and must be 0 or greater for feeds'
        });
      }
      
      // Validate stock kilos and half kilos if provided
      if (updateData.stockKilos !== undefined && updateData.stockKilos < 0) {
        return res.status(400).json({
          error: 'Invalid stock kilos',
          details: 'Stock kilos must be 0 or greater'
        });
      }
      
      if (updateData.stockHalfKilos !== undefined && updateData.stockHalfKilos < 0) {
        return res.status(400).json({
          error: 'Invalid stock half kilos',
          details: 'Stock half kilos must be 0 or greater'
        });
      }
    }
    
    const product = await Product.findByIdAndUpdate(
      id,
      { 
        ...updateData,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({
        error: 'Product not found',
        details: 'The product you are trying to update does not exist'
      });
    }
    
    // Auto-recalculate existing sales if cost price was updated
    if (updateData.costPerSack !== undefined && updateData.costPerSack > 0) {
      console.log('🔄 Cost price updated, recalculating existing sales for product:', id);
      console.log('🔄 New cost per sack:', updateData.costPerSack);
      try {
        const SalesService = require('../services/salesService');
        const result = await SalesService.recalculateSalesForProduct(id);
        console.log('✅ Successfully recalculated sales for product:', id, 'Updated:', result.updatedCount, 'out of', result.totalSales);
      } catch (error) {
        console.error('❌ Error recalculating sales for product:', error);
        // Don't fail the product update if recalculation fails
      }
    } else {
      console.log('ℹ️ No cost price update detected or cost price is 0');
    }
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      product
    });
    
  } catch (error) {
    console.error('Error updating product:', error);
    console.error('Error stack:', error.stack);
    console.error('Product ID:', id);
    console.error('Update data:', updateData);
    res.status(500).json({
      error: 'Failed to update product',
      details: error.message,
      stack: error.stack
    });
  }
};

const bulkCostUpdate = async (req, res) => {
  try {
    const { productIds, costPerSack } = req.body;
    
    console.log('Bulk cost update request:', { productIds, costPerSack });
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        error: 'Product IDs are required',
        details: 'Please select at least one product to update'
      });
    }
    
    if (typeof costPerSack !== 'number' || costPerSack < 0) {
      return res.status(400).json({
        error: 'Valid cost per sack is required',
        details: 'Cost per sack must be a positive number'
      });
    }
    
    // Update all selected products
    console.log('Updating products with IDs:', productIds);
    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { 
        $set: { 
          costPerSack: costPerSack,
          updatedAt: new Date()
        }
      }
    );
    
    console.log('Update result:', result);
    
    // Auto-recalculate existing sales for all updated products
    if (result.modifiedCount > 0) {
      console.log('🔄 Cost prices updated, recalculating existing sales for', result.modifiedCount, 'products');
      console.log('🔄 New cost per sack:', costPerSack);
      try {
        const SalesService = require('../services/salesService');
        const recalculationResult = await SalesService.recalculateAllSales();
        console.log('✅ Successfully recalculated all sales after bulk cost update:', recalculationResult);
      } catch (error) {
        console.error('❌ Error recalculating sales after bulk update:', error);
        // Don't fail the bulk update if recalculation fails
      }
    } else {
      console.log('ℹ️ No products were updated in bulk cost update');
    }
    
    res.json({
      success: true,
      message: `Successfully updated cost prices for ${result.modifiedCount} products`,
      updatedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    });
    
  } catch (error) {
    console.error('Error updating bulk cost prices:', error);
    res.status(500).json({
      error: 'Failed to update cost prices',
      details: error.message
    });
  }
};

// Create Product
const createProduct = async (req, res) => {
  try {
    console.log('📦 Creating new product:', req.body);
    console.log('📦 File upload info:', req.file);
    console.log('📦 Request headers:', req.headers);
    
    // Handle file upload if present
    let imagePath = null;
    if (req.file) {
      // Store only the filename (not the full path) for database
      imagePath = req.file.filename;
      console.log('📦 Image uploaded successfully:', req.file.filename);
      console.log('📦 Image stored at:', req.file.path);
      console.log('📦 Image filename for DB:', imagePath);
    } else {
      console.log('📦 No file uploaded');
    }
    
    const {
      name,
      description,
      animal,
      category,
      pricePerSack,
      pricePerKilo,
      price,
      stockSacks,
      stockKilos,
      stockHalfKilos,
      stock,
      costPerSack,
      cost,
      image
    } = req.body;

    // Validate required fields
    if (!name || !animal || !category) {
      return res.status(400).json({
        error: 'Missing required fields: name, animal, and category are required'
      });
    }

    // Create product object based on category
    let productData = {
      name,
      description: description || '',
      animal,
      category,
      isActive: true,
      customId: Math.floor(Math.random() * 10000000000).toString()
    };

    // Add fields based on category
    if (category === 'feeds') {
      if (!pricePerSack) {
        return res.status(400).json({
          error: 'Price per sack is required for feeds'
        });
      }
      productData.pricePerSack = parseFloat(pricePerSack);
      productData.pricePerKilo = parseFloat(pricePerKilo) || parseFloat(pricePerSack) / 25;
      productData.stockSacks = parseInt(stockSacks) || 0;
      productData.stockKilos = parseInt(stockKilos) || 0;
      productData.stockHalfKilos = parseInt(stockHalfKilos) || 0;
      if (costPerSack) {
        productData.costPerSack = parseFloat(costPerSack);
      }
    } else if (category === 'supplements') {
      if (!price) {
        return res.status(400).json({
          error: 'Price is required for supplements'
        });
      }
      productData.price = parseFloat(price);
      productData.stock = parseInt(stock) || 0;
      if (cost) {
        productData.cost = parseFloat(cost);
      }
    }

    // Add image if provided (use uploaded file path or existing image path)
    if (imagePath) {
      productData.image = imagePath;
    } else if (image) {
      productData.image = image;
    }

    console.log('📦 Product data to create:', productData);

    const product = new Product(productData);
    await product.save();

    console.log('✅ Product created successfully:', product._id);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: {
        id: product._id,
        name: product.name,
        animal: product.animal,
        category: product.category,
        customId: product.customId
      }
    });

  } catch (error) {
    console.error('❌ Error creating product:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      error: 'Failed to create product',
      details: error.message
    });
  }
};

module.exports = {
  getCustomerDashboard,
  getAdminDashboard,
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  bulkCostUpdate,
  getLowStockRecipientEmail,
  updateLowStockRecipientEmail
};
