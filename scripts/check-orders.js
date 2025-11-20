const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Order = require('../src/models/Order');
const Sale = require('../src/models/Sale');

async function checkOrders() {
    try {
        console.log('🔍 Checking all orders and sales in database...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/feeds', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ Connected to MongoDB');
        
        // Get all orders
        const orders = await Order.find({}).sort({ createdAt: -1 });
        console.log(`📊 Found ${orders.length} orders:`);
        
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
        
        // Get all sales
        const sales = await Sale.find({}).sort({ saleDate: -1 });
        console.log(`📊 Found ${sales.length} sales:`);
        
        sales.forEach((sale, index) => {
            console.log(`Sale ${index + 1}:`);
            console.log(`  - ID: ${sale._id}`);
            console.log(`  - Product: ${sale.productName}`);
            console.log(`  - Quantity: ${sale.quantity} ${sale.unit}`);
            console.log(`  - Total: ₱${sale.totalAmount}`);
            console.log(`  - Date: ${sale.saleDate}`);
            console.log(`  - Status: ${sale.status}`);
            console.log('---');
        });
        
        console.log('✅ Database check complete!');
        
    } catch (error) {
        console.error('❌ Error checking orders:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the script
checkOrders();
