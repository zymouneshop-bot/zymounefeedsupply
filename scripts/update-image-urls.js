const mongoose = require('mongoose');
const Product = require('../src/models/Product');
require('dotenv').config();

async function updateImageUrls() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/feeds', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Find products with localhost URLs
    const products = await Product.find({ imageUrl: /localhost/ });
    console.log(`Found ${products.length} products with localhost URLs`);
    
    // Update each product
    for (const product of products) {
      if (product.imageUrl && product.imageUrl.includes('localhost')) {
        // Extract just the filename from the localhost URL
        const filename = product.imageUrl.split('/').pop();
        
        // Create a relative URL that will work with any domain
        const newImageUrl = `/uploads/${filename}`;
        
        console.log(`Updating ${product.name}: ${product.imageUrl} -> ${newImageUrl}`);
        
        // Update the product
        await Product.findByIdAndUpdate(product._id, { imageUrl: newImageUrl });
      }
    }
    
    console.log('✅ All image URLs updated successfully!');
    console.log('Images will now work with any domain (localhost, ngrok, etc.)');
    
  } catch (error) {
    console.error('❌ Error updating image URLs:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Run the migration
updateImageUrls();
