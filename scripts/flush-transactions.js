const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Order = require('../src/models/Order');
const Sale = require('../src/models/Sale');

async function flushTransactions() {
    try {
        console.log('🗑️ Starting transaction flush...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/feeds', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ Connected to MongoDB');
        
        // Count existing transactions
        const orderCount = await Order.countDocuments();
        const saleCount = await Sale.countDocuments();
        
        console.log(`📊 Found ${orderCount} orders and ${saleCount} sales`);
        
        if (orderCount === 0 && saleCount === 0) {
            console.log('✅ No transactions to flush');
            return;
        }
        
        // Delete all orders
        if (orderCount > 0) {
            const orderResult = await Order.deleteMany({});
            console.log(`🗑️ Deleted ${orderResult.deletedCount} orders`);
        }
        
        // Delete all sales
        if (saleCount > 0) {
            const saleResult = await Sale.deleteMany({});
            console.log(`🗑️ Deleted ${saleResult.deletedCount} sales`);
        }
        
        // Verify deletion
        const finalOrderCount = await Order.countDocuments();
        const finalSaleCount = await Sale.countDocuments();
        
        console.log(`✅ Transaction flush complete!`);
        console.log(`📊 Final counts: ${finalOrderCount} orders, ${finalSaleCount} sales`);
        
    } catch (error) {
        console.error('❌ Error flushing transactions:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the script
flushTransactions();
