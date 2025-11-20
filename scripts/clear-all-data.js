const mongoose = require('mongoose');
require('dotenv').config();

async function clearAllData() {
    try {
        console.log('🗑️ Clearing all transaction data...');
        
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/feeds', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ Connected to MongoDB');
        
        // Clear all collections
        const collections = ['orders', 'sales'];
        
        for (const collectionName of collections) {
            try {
                const collection = mongoose.connection.db.collection(collectionName);
                const count = await collection.countDocuments();
                
                if (count > 0) {
                    await collection.deleteMany({});
                    console.log(`🗑️ Cleared ${count} documents from ${collectionName}`);
                } else {
                    console.log(`📭 Collection ${collectionName} is already empty`);
                }
            } catch (error) {
                console.log(`⚠️ Collection ${collectionName} doesn't exist or error: ${error.message}`);
            }
        }
        
        console.log('✅ All transaction data cleared!');
        console.log('🎯 You can now test with a fresh transaction');
        
    } catch (error) {
        console.error('❌ Error clearing data:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    }
}

// Run the script
clearAllData();
