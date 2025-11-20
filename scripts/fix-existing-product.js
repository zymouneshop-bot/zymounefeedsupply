const mongoose = require('mongoose');
const Product = require('../src/models/Product');
require('dotenv').config();

async function fixExistingProduct() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/feeds', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Find the product with localhost URL
    const product = await Product.findOne({ imageUrl: /localhost/ });
    
    if (product) {
      console.log(`Found product: ${product.name}`);
      console.log(`Current imageUrl: ${product.imageUrl}`);
      
      // Extract filename from localhost URL
      const filename = product.imageUrl.split('/').pop();
      console.log(`Extracted filename: ${filename}`);
      
      // Update to relative URL
      product.imageUrl = `/uploads/${filename}`;
      product.imageId = 'legacy-file'; // Mark as legacy file
      
      await product.save();
      
      console.log(`✅ Updated product: ${product.name}`);
      console.log(`New imageUrl: ${product.imageUrl}`);
    } else {
      console.log('No products with localhost URLs found');
    }
    
  } catch (error) {
    console.error('❌ Error fixing product:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Run the fix
fixExistingProduct();
