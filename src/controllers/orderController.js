const Order = require('../models/Order');
const Product = require('../models/Product');
const EmailService = require('../services/emailService');

// Create email service instance
const emailService = new EmailService();


const createOrder = async (req, res) => {
    console.log('👤 req.user in createOrder:', req.user);
  try {
    console.log('📝 Creating new order with data:', req.body);
    
    const {
      customerName,
      customerPhone,  
      customerEmail,
      items,
      subtotal,
      tax,
      total,
      staffId,
      staffName: bodyStaffName
    } = req.body;

    // If staffName is not provided in the request, use the logged-in user's name
    let staffName = bodyStaffName;
    if (!staffName && req.user) {
      if (req.user.firstName && req.user.lastName) {
        staffName = `${req.user.firstName} ${req.user.lastName}`;
      } else if (req.user.fullName) {
        staffName = req.user.fullName;
      } else if (req.user.email) {
        staffName = req.user.email;
      } else {
        staffName = 'Staff';
      }
    }
    console.log('📝 staffName resolved:', staffName);
    
    
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Items are required'
      });
    }
    
    
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({
          success: false,
          error: `Product not found: ${item.productName}`
        });
      }
      
      
      if (item.unit === 'sack') {
        // For supplements, use the maximum of stockSacks and stock
        // For feeds, use stockSacks as primary
        let availableStock = 0;
        if (product.category === 'supplements') {
          availableStock = Math.max(product.stockSacks || 0, product.stock || 0);
        } else {
          availableStock = product.stockSacks || 0;
        }
        
        if (availableStock < item.quantity) {
          return res.status(400).json({
            success: false,
            error: `Insufficient stock for ${item.productName} (${item.unit}). Available: ${availableStock}`
          });
        }
      } else if (item.unit === 'kilo') {
        const availableStock = product.stockKilos || 0;
        if (availableStock < item.quantity) {
          return res.status(400).json({
            success: false,
            error: `Insufficient stock for ${item.productName} (${item.unit}). Available: ${availableStock}`
          });
        }
      } else if (item.unit === 'half-kilo') {
        const availableStock = product.stockHalfKilos || 0;
        if (availableStock < item.quantity) {
          return res.status(400).json({
            success: false,
            error: `Insufficient stock for ${item.productName} (${item.unit}). Available: ${availableStock}`
          });
        }
      } else {
        // For supplements, use the maximum of stockSacks and stock
        // For others, use stock
        let availableStock = 0;
        if (product.category === 'supplements') {
          availableStock = Math.max(product.stockSacks || 0, product.stock || 0);
        } else {
          availableStock = product.stock || 0;
        }
        
        if (availableStock < item.quantity) {
          return res.status(400).json({
            success: false,
            error: `Insufficient stock for ${item.productName} (${item.unit}). Available: ${availableStock}`
          });
        }
      }
    }
    
    
    const order = new Order({
      customerName,
      customerPhone,
      customerEmail,
      items,
      subtotal,
      tax,
      total,
      staffId,
      staffName,
      status: 'completed',
      orderDate: new Date()
    });
    
    const savedOrder = await order.save();
    
    
    for (const item of items) {
      const productToUpdate = await Product.findById(item.productId);
      if (!productToUpdate) continue;
      
      if (productToUpdate.category === 'feeds') {
        // For feeds, reduce all stock types proportionally using net weight
        const netWeight = productToUpdate.netWeightPerSack || 25; // Default to 25kg if not set
        let sackReduction = 0;
        let kiloReduction = 0;
        let halfKiloReduction = 0;
        
        if (item.unit === 'sack') {
          sackReduction = item.quantity;
          kiloReduction = item.quantity * netWeight;
          halfKiloReduction = item.quantity * netWeight * 2;
        } else if (item.unit === 'kilo') {
          sackReduction = item.quantity / netWeight;
          kiloReduction = item.quantity;
          halfKiloReduction = item.quantity * 2;
        } else if (item.unit === 'half-kilo') {
          sackReduction = item.quantity / (netWeight * 2);
          kiloReduction = item.quantity / 2;
          halfKiloReduction = item.quantity;
        }
        
        // Update all stock types proportionally with validation
        // Check if there's enough stock before reducing
        if (productToUpdate.stockSacks < sackReduction || productToUpdate.stockKilos < kiloReduction || productToUpdate.stockHalfKilos < halfKiloReduction) {
          console.log(`❌ Insufficient stock for ${item.productName}`);
          throw new Error(`Insufficient stock for ${item.productName}`);
        }
        
        // Calculate new stock values
        const newStockSacks = Math.max(0, productToUpdate.stockSacks - sackReduction);
        const newStockKilos = Math.max(0, productToUpdate.stockKilos - kiloReduction);
        const newStockHalfKilos = Math.max(0, productToUpdate.stockHalfKilos - halfKiloReduction);
        
        // Update with rounded values to prevent floating-point errors
        await Product.findByIdAndUpdate(
          item.productId,
          { 
            stockSacks: Math.round(newStockSacks * 100) / 100,
            stockKilos: Math.round(newStockKilos * 100) / 100,
            stockHalfKilos: Math.round(newStockHalfKilos * 100) / 100
          }
        );
        
        console.log(`📦 Stock reduced for ${item.productName}:`, {
          unit: item.unit,
          quantity: item.quantity,
          netWeight: netWeight,
          sackReduction: sackReduction,
          kiloReduction: kiloReduction,
          halfKiloReduction: halfKiloReduction
        });
      } else {
        // For supplements, reduce the field that has the higher value
        // or reduce both proportionally if both have stock
        const product = await Product.findById(item.productId);
        const currentStockSacks = product.stockSacks || 0;
        const currentStock = product.stock || 0;
        const totalStock = Math.max(currentStockSacks, currentStock);
        
        let newStockSacks = currentStockSacks;
        let newStock = currentStock;
        
        if (totalStock > 0) {
          // Calculate proportional reduction
          const stockSacksRatio = currentStockSacks / totalStock;
          const stockRatio = currentStock / totalStock;
          
          newStockSacks = Math.max(0, currentStockSacks - (item.quantity * stockSacksRatio));
          newStock = Math.max(0, currentStock - (item.quantity * stockRatio));
        }
        
        await Product.findByIdAndUpdate(
          item.productId,
          { 
            stockSacks: Math.round(newStockSacks * 100) / 100,
            stock: Math.round(newStock * 100) / 100
          }
        );
        
        console.log(`📦 Stock reduced for supplement ${item.productName}:`, {
          unit: item.unit,
          quantity: item.quantity,
          originalStockSacks: currentStockSacks,
          originalStock: currentStock,
          newStockSacks: newStockSacks,
          newStock: newStock
        });
      }
    }
    
    console.log('✅ Order created successfully:', savedOrder._id);
    
    res.status(201).json({
      success: true,
      message: 'Order processed successfully',
      order: savedOrder
    });
    
  } catch (error) {
    console.error('❌ Error creating order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order',
      details: error.message
    });
  }
};


const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .sort({ orderDate: -1 })
      .limit(100);
    
    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders',
      details: error.message
    });
  }
};


const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order',
      details: error.message
    });
  }
};


const getOrdersByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
    }
    
    const orders = await Order.find({
      orderDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).sort({ orderDate: -1 });
    
    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Error fetching orders by date range:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders',
      details: error.message
    });
  }
};


const getSalesSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let matchQuery = {};
    if (startDate && endDate) {
      matchQuery.orderDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const summary = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          totalTax: { $sum: '$tax' },
          totalSubtotal: { $sum: '$subtotal' }
        }
      }
    ]);

    const result = summary[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      totalTax: 0,
      totalSubtotal: 0
    };

    // Fetch recent orders (limit 10, sorted by orderDate desc)
    const recentOrders = await Order.find(matchQuery)
      .sort({ orderDate: -1 })
      .limit(10)
      .select('receiptNumber staffName orderDate total subtotal tax items productName name quantity');

    res.json({
      success: true,
      summary: result,
      recentOrders
    });
  } catch (error) {
    console.error('Error fetching sales summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sales summary',
      details: error.message
    });
  }
};

const sendReceipt = async (req, res) => {
  try {
    console.log('📧 sendReceipt called with body:', req.body);
    const { orderId, customerEmail, orderData } = req.body;
    
    // Convert timestamp string back to Date object if needed
    if (orderData.timestamp && typeof orderData.timestamp === 'string') {
      orderData.timestamp = new Date(orderData.timestamp);
    } else if (!orderData.timestamp) {
      orderData.timestamp = new Date();
    }
    
    console.log('📧 Extracted data:', { orderId, customerEmail, orderData });
    console.log('📧 Timestamp type:', typeof orderData.timestamp, orderData.timestamp);
    
    if (!customerEmail) {
      console.log('❌ No customer email provided');
      return res.status(400).json({
        success: false,
        error: 'Customer email is required'
      });
    }
    
    // Create email content
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #8b7355; margin: 0;">ZYMOUNE FEEDS SUPPLY</h1>
          <p style="color: #666; margin: 5px 0;">Premium Chicken & Pig Feeds & Supplements</p>
        </div>
        
        <div style="border: 2px solid #d2b48c; border-radius: 10px; padding: 20px; background: #f9f9f9;">
          <h2 style="color: #8b7355; margin-top: 0;">E-Receipt</h2>
          
          <div style="margin-bottom: 20px;">
            <p><strong>Receipt #:</strong> ${orderId.toString().slice(-8)}</p>
            <p><strong>Date:</strong> ${orderData.timestamp.toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${orderData.timestamp.toLocaleTimeString()}</p>
            <p><strong>Staff:</strong> ${orderData.staffName}</p>
          </div>
          
          <div style="border-top: 1px solid #d2b48c; padding-top: 15px; margin: 20px 0;">
            <h3 style="color: #8b7355; margin-top: 0;">Items Purchased:</h3>
            ${orderData.items.map(item => `
              <div style="margin-bottom: 10px; padding: 10px; background: white; border-radius: 5px;">
                <div style="font-weight: bold; color: #333;">${item.productName}</div>
                <div style="color: #666; font-size: 14px;">${item.quantity} ${item.unit} × ₱${item.price.toFixed(2)}</div>
                <div style="text-align: right; font-weight: bold; color: #8b7355;">₱${(item.quantity * item.price).toFixed(2)}</div>
              </div>
            `).join('')}
          </div>
          
          <div style="border-top: 1px solid #d2b48c; padding-top: 15px; margin: 20px 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Subtotal:</span>
              <span>₱${orderData.subtotal.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Tax (12%):</span>
              <span>₱${orderData.tax.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-weight: bold; font-size: 16px; color: #8b7355;">
              <span>Total:</span>
              <span>₱${orderData.total.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
              <span>Payment:</span>
              <span>₱${orderData.paymentAmount.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-weight: bold; color: #8b7355;">
              <span>Change:</span>
              <span>₱${orderData.change.toFixed(2)}</span>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #d2b48c;">
            <p style="color: #666; margin: 0;">Thank you for your business!</p>
            <p style="color: #666; margin: 5px 0;">Please keep this receipt for your records</p>
          </div>
        </div>
      </div>
    `;
    
    // Send email
    console.log('📧 Attempting to send email to:', customerEmail);
    const emailResult = await emailService.sendEmail({
      to: customerEmail,
      subject: `Receipt from ZYMOUNE FEEDS SUPPLY - Order #${orderId.toString().slice(-8)}`,
      html: emailContent
    });
    
    console.log('📧 Email result:', emailResult);
    
    if (emailResult.success) {
      console.log('✅ Email sent successfully');
      res.json({
        success: true,
        message: 'E-receipt sent successfully',
        testMode: emailResult.testMode || false
      });
    } else {
      console.log('❌ Email sending failed:', emailResult.error);
      throw new Error(emailResult.error || 'Failed to send email');
    }
    
  } catch (error) {
    console.error('Error sending receipt email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send e-receipt',
      details: error.message
    });
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrdersByDateRange,
  getSalesSummary,
  sendReceipt
};
