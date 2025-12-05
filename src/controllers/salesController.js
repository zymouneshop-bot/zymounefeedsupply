const SalesService = require('../services/salesService');
const QRService = require('../services/qrService');
const Product = require('../models/Product');


const recordSale = async (req, res) => {
  try {
    const saleData = req.body;
    console.log('Sales API received data:', saleData);
    
    
    if (!saleData.productId || !saleData.quantity || !saleData.unit || !saleData.pricePerUnit) {
      console.log('Missing required fields:', {
        productId: saleData.productId,
        quantity: saleData.quantity,
        unit: saleData.unit,
        pricePerUnit: saleData.pricePerUnit
      });
      return res.status(400).json({
        error: 'Missing required fields: productId, quantity, unit, pricePerUnit'
      });
    }

    console.log('Calling SalesService.recordSale with:', saleData);
    const sale = await SalesService.recordSale(saleData);
    
    res.status(201).json({
      message: 'Sale recorded successfully',
      sale: {
        id: sale._id,
        productName: sale.productName,
        quantity: sale.quantity,
        unit: sale.unit,
        totalAmount: sale.totalAmount,
        saleDate: sale.saleDate
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to record sale',
      details: error.message
    });
  }
};


const getDailySales = async (req, res) => {
  try {
    const { date } = req.query;
    const salesDate = date ? new Date(date) : new Date();
    
    const sales = await SalesService.getDailySales(salesDate);
    
    res.json({
      date: salesDate.toISOString().split('T')[0],
      sales,
      totalSales: sales.length,
      totalRevenue: sales.reduce((sum, sale) => sum + sale.totalAmount, 0)
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get daily sales',
      details: error.message
    });
  }
};


const getSalesAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); 
    const end = endDate ? new Date(endDate) : new Date();
    
    
    end.setHours(23, 59, 59, 999);
    
    console.log('Analytics date range:', { start, end });
    
    const analytics = await SalesService.getSalesAnalytics(start, end);
    
    res.json(analytics);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get sales analytics',
      details: error.message
    });
  }
};


const generateProductQR = async (req, res) => {
  try {
    const { productId } = req.params;
    console.log('🔧 Generating QR code for product ID:', productId);
    
    const product = await Product.findById(productId);
    if (!product) {
      console.log('❌ Product not found for ID:', productId);
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    console.log('✅ Product found:', product.name);
    const qrData = await QRService.generateProductQR(product);
    console.log('✅ QR code generated successfully');
    
    res.json({
      product: {
        id: product._id,
        name: product.name,
        category: product.category,
        animal: product.animal,
        price: product.price,
        stock: product.stock,
        unit: product.unit
      },
      qrCode: qrData.qrCode,
      productId: qrData.productId
    });
  } catch (error) {
    console.error('❌ QR generation error:', error);
    res.status(500).json({
      error: 'Failed to generate QR code',
      details: error.message
    });
  }
};


const getProductForQR = async (req, res) => {
  try {
    const { productId } = req.params;
    
    
    const sampleProducts = [
      {
        id: 1,
        name: 'Chicken Starter Feed',
        description: 'Premium starter feed for chicks (0-6 weeks)',
        animal: 'chicken',
        category: 'feeds',
        type: 'starter',
        price: 25.99,
        stock: 50,
        unit: 'bag',
        imageUrl: ''
      },
      {
        id: 2,
        name: 'Chicken Grower Feed',
        description: 'High-protein feed for growing chickens (6-18 weeks)',
        animal: 'chicken',
        category: 'feeds',
        type: 'grower',
        price: 23.99,
        stock: 35,
        unit: 'bag',
        imageUrl: ''
      },
      {
        id: 3,
        name: 'Chicken Layer Feed',
        description: 'Calcium-rich feed for laying hens (18+ weeks)',
        animal: 'chicken',
        category: 'feeds',
        type: 'layer',
        price: 27.99,
        stock: 40,
        unit: 'bag',
        imageUrl: ''
      },
      {
        id: 4,
        name: 'Chicken Vitamin Supplement',
        description: 'Essential vitamins for chicken health and egg production',
        animal: 'chicken',
        category: 'supplements',
        type: 'vitamins',
        price: 15.99,
        stock: 25,
        unit: 'kg',
        imageUrl: ''
      },
      {
        id: 5,
        name: 'Chicken Mineral Supplement',
        description: 'Essential minerals for bone strength and eggshell quality',
        animal: 'chicken',
        category: 'supplements',
        type: 'minerals',
        price: 12.99,
        stock: 30,
        unit: 'kg',
        imageUrl: ''
      },
      {
        id: 6,
        name: 'Piglet Starter Feed',
        description: 'Premium starter feed for piglets (3-8 weeks)',
        animal: 'pig',
        category: 'feeds',
        type: 'starter',
        price: 32.99,
        stock: 38,
        unit: 'bag',
        imageUrl: ''
      },
      {
        id: 7,
        name: 'Pig Finisher Feed',
        description: 'Final stage feed for market-ready pigs',
        animal: 'pig',
        category: 'feeds',
        type: 'finisher',
        price: 28.99,
        stock: 8,
        unit: 'bag',
        imageUrl: ''
      },
      {
        id: 8,
        name: 'Pig Grower Feed',
        description: 'High-energy feed for growing pigs (8-20 weeks)',
        animal: 'pig',
        category: 'feeds',
        type: 'grower',
        price: 30.99,
        stock: 15,
        unit: 'bag',
        imageUrl: ''
      },
      {
        id: 9,
        name: 'Pig Vitamin Supplement',
        description: 'Specialized vitamins for pig health and growth',
        animal: 'pig',
        category: 'supplements',
        type: 'vitamins',
        price: 18.99,
        stock: 20,
        unit: 'kg',
        imageUrl: ''
      },
      {
        id: 10,
        name: 'Pig Mineral Supplement',
        description: 'Essential minerals for pig bone and muscle development',
        animal: 'pig',
        category: 'supplements',
        type: 'minerals',
        price: 16.99,
        stock: 18,
        unit: 'kg',
        imageUrl: ''
      }
    ];
    
    const product = sampleProducts.find(p => p.id == productId);
    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    res.json({
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        animal: product.animal,
        price: product.price,
        stock: product.stock,
        unit: product.unit
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get product',
      details: error.message
    });
  }
};

const recalculateSales = async (req, res) => {
  try {
    console.log('Recalculating all sales...');
    const result = await SalesService.recalculateAllSales();
    
    res.json({
      success: true,
      message: `Successfully recalculated ${result.updatedCount} out of ${result.totalSales} sales`,
      updatedCount: result.updatedCount,
      totalSales: result.totalSales
    });
    
  } catch (error) {
    console.error('Error recalculating sales:', error);
    res.status(500).json({
      error: 'Failed to recalculate sales',
      details: error.message
    });
  }
};

// Direct database query for accurate sales data
const getDirectSalesData = async (req, res) => {
  try {
    console.log('🔍 Direct database query for sales data');
    
    const { startDate, endDate } = req.query;
    console.log('📅 Date range:', { startDate, endDate });
    
    // Direct database queries
    const Order = require('../models/Order');
    const Product = require('../models/Product');
    
    // Get orders in date range with populated products in one query
    const orders = await Order.find({
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      status: 'completed'
    }).populate('items.productId', 'name animal category pricePerSack pricePerKilo costPerSack price cost').lean();
    
    console.log('📊 Found orders:', orders.length);
    
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let totalSales = orders.length;
    
    // Process each order
    for (const order of orders) {
      console.log('🔧 Processing order:', order._id);
      
      let orderRevenue = 0;
      let orderCost = 0;
      
      // Process each item in the order (products already populated)
      for (const item of order.items) {
        try {
          const product = item.productId;
          if (product) {
            // Calculate revenue from product price
            let itemPrice = 0;
            if (item.unit === 'sack') {
              itemPrice = product.pricePerSack || product.price || 0;
            } else if (item.unit === 'kilo') {
              itemPrice = product.pricePerKilo || product.price || 0;
            } else {
              itemPrice = product.price || 0;
            }

            // Use cost recorded at time of sale
            let itemCost = item.costPerUnit || 0;
            let itemCostTotal = item.totalCost || (item.quantity * itemCost);

            const itemRevenue = item.quantity * itemPrice;

            orderRevenue += itemRevenue;
            orderCost += itemCostTotal;

            console.log(`🔧 Item: revenue=${itemRevenue}, cost=${itemCostTotal}`);
          }
        } catch (error) {
          console.error(`❌ Error processing item:`, error);
        }
      }
      
      totalRevenue += orderRevenue;
      totalCost += orderCost;
      
      console.log(`🔧 Order ${order._id}: revenue=${orderRevenue}, cost=${orderCost}`);
    }
    
    totalProfit = totalRevenue - totalCost;
    
    console.log('📊 Direct database results:', {
      totalSales,
      totalRevenue,
      totalCost,
      totalProfit
    });
    
    // Calculate additional analytics data using already-populated products
    const salesByAnimal = {};
    const salesByCategory = {};
    const topProducts = [];
    
    // Process orders for detailed analytics (NO EXTRA QUERIES - products already populated!)
    for (const order of orders) {
      for (const item of order.items) {
        try {
          const product = item.productId; // Already populated from earlier .populate() call
          if (product && product._id) {
            // Calculate item revenue
            let itemPrice = 0;
            if (item.unit === 'sack') {
              itemPrice = product.pricePerSack || product.price || 0;
            } else if (item.unit === 'kilo') {
              itemPrice = product.pricePerKilo || product.price || 0;
            } else {
              itemPrice = product.price || 0;
            }
            
            const itemRevenue = item.quantity * itemPrice;
            
            // Sales by animal
            if (!salesByAnimal[product.animal]) {
              salesByAnimal[product.animal] = { revenue: 0, count: 0 };
            }
            salesByAnimal[product.animal].revenue += itemRevenue;
            salesByAnimal[product.animal].count += 1;
            
            // Sales by category
            if (!salesByCategory[product.category]) {
              salesByCategory[product.category] = { revenue: 0, count: 0 };
            }
            salesByCategory[product.category].revenue += itemRevenue;
            salesByCategory[product.category].count += 1;
            
            // Top products
            const existingProduct = topProducts.find(p => p.name === product.name);
            if (existingProduct) {
              existingProduct.quantity += item.quantity;
              existingProduct.revenue += itemRevenue;
            } else {
              topProducts.push({
                name: product.name,
                quantity: item.quantity,
                revenue: itemRevenue
              });
            }
          }
        } catch (error) {
          console.error(`❌ Error processing item for analytics:`, error);
        }
      }
    }
    
    // Sort top products by revenue
    topProducts.sort((a, b) => b.revenue - a.revenue);
    
    const recentSales = orders.map(order => ({
      id: order._id,
      customerName: order.customerName || 'Customer',
      total: order.total,
      createdAt: order.createdAt,
      items: order.items.map(item => ({
        productName: item.productName,
        quantity: item.quantity,
        unit: item.unit,
        totalPrice: item.totalPrice || item.price
      }))
    }));

    res.json({
      success: true,
      totalSales,
      totalRevenue,
      totalCost,
      totalProfit,
      salesByAnimal,
      salesByCategory,
      topProducts,
      recentSales,
      sales: recentSales // Add sales array for compatibility
    });
    
  } catch (error) {
    console.error('❌ Error in direct sales data query:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get direct sales data',
      error: error.message
    });
  }
};

// Reset all sales and orders
const resetAllSales = async (req, res) => {
  try {
    console.log('🗑️ Resetting all sales and orders...');
    
    // Import models
    const Sale = require('../models/Sale');
    const Order = require('../models/Order');
    
    // Count existing records before deletion
    const salesCount = await Sale.countDocuments();
    const ordersCount = await Order.countDocuments();
    
    console.log(`📊 Found ${salesCount} sales and ${ordersCount} orders to delete`);
    
    // Delete all sales
    const deletedSales = await Sale.deleteMany({});
    console.log(`✅ Deleted ${deletedSales.deletedCount} sales`);
    
    // Delete all orders
    const deletedOrders = await Order.deleteMany({});
    console.log(`✅ Deleted ${deletedOrders.deletedCount} orders`);
    
    res.json({
      success: true,
      message: 'All sales and orders have been reset successfully',
      deletedSales: deletedSales.deletedCount,
      deletedOrders: deletedOrders.deletedCount
    });
    
  } catch (error) {
    console.error('❌ Error resetting sales and orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset sales and orders',
      details: error.message
    });
  }
};

module.exports = {
  recordSale,
  getDailySales,
  getSalesAnalytics,
  generateProductQR,
  getProductForQR,
  recalculateSales,
  getDirectSalesData,
  resetAllSales
};
