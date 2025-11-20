const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Order = require('../src/models/Order');

async function checkDuplicates() {
    try {
        console.log('🔍 Checking for duplicate orders...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/feeds', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ Connected to MongoDB');
        
        // Get all orders from today
        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);
        
        console.log(`📅 Checking orders from ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);
        
        const orders = await Order.find({
            createdAt: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        }).sort({ createdAt: -1 });
        
        console.log(`📊 Found ${orders.length} orders today:`);
        
        orders.forEach((order, index) => {
            console.log(`Order ${index + 1}:`);
            console.log(`  - ID: ${order._id}`);
            console.log(`  - Customer: ${order.customerName}`);
            console.log(`  - Total: ₱${order.total}`);
            console.log(`  - Items: ${order.items.length}`);
            console.log(`  - Created: ${order.createdAt}`);
            console.log(`  - Status: ${order.status}`);
            console.log('  - Items details:');
            order.items.forEach((item, itemIndex) => {
                console.log(`    ${itemIndex + 1}. ${item.productName} - ${item.quantity} ${item.unit} - ₱${item.price}`);
            });
            console.log('---');
        });
        
        // Check for potential duplicates
        if (orders.length > 1) {
            console.log('⚠️  Multiple orders found - checking for duplicates...');
            
            const orderGroups = {};
            orders.forEach(order => {
                const key = `${order.customerName}-${order.total}-${order.items.map(item => `${item.productName}-${item.quantity}`).join(',')}`;
                if (!orderGroups[key]) {
                    orderGroups[key] = [];
                }
                orderGroups[key].push(order);
            });
            
            Object.keys(orderGroups).forEach(key => {
                if (orderGroups[key].length > 1) {
                    console.log(`🔍 Potential duplicate group (${orderGroups[key].length} orders):`);
                    orderGroups[key].forEach((order, index) => {
                        console.log(`  ${index + 1}. ${order._id} - ${order.createdAt}`);
                    });
                }
            });
        } else {
            console.log('✅ Only 1 order found - no duplicates in database');
        }
        
    } catch (error) {
        console.error('❌ Error checking duplicates:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the check
checkDuplicates();
