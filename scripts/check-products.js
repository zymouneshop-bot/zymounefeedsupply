const mongoose = require('mongoose');
const Product = require('../src/models/Product');
require('dotenv').config();

async function checkProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/feeds', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Find all products with images
    const products = await Product.find({ imageUrl: { $exists: true, $ne: '' } });
    
    console.log(`Found ${products.length} products with images:`);
    
    products.forEach(product => {
      console.log(`- ${product.name}: ${product.imageUrl} (ID: ${product.imageId || 'none'})`);
    });
    
  } catch (error) {
    console.error('❌ Error checking products:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Run the check
checkProducts();
