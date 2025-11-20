const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Product = require('../src/models/Product');
require('dotenv').config();

async function uploadToGridFS() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/feeds', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Get GridFS bucket
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'uploads'
    });
    
    // Find the product
    const product = await Product.findOne({ name: '1' });
    if (!product) {
      console.log('Product not found');
      return;
    }
    
    console.log(`Found product: ${product.name}`);
    console.log(`Image URL: ${product.imageUrl}`);
    
    // Extract filename
    const filename = product.imageUrl.split('/').pop();
    const filePath = path.join(__dirname, '..', 'uploads', filename);
    
    console.log(`Looking for file: ${filePath}`);
    
    if (fs.existsSync(filePath)) {
      console.log('✅ File exists locally');
      
      // Create read stream
      const readStream = fs.createReadStream(filePath);
      
      // Create upload stream
      const uploadStream = bucket.openUploadStream(filename, {
        contentType: 'image/png'
      });
      
      // Upload file
      readStream.pipe(uploadStream);
      
      uploadStream.on('error', (error) => {
        console.error('❌ Upload error:', error);
      });
      
      uploadStream.on('finish', async () => {
        console.log(`✅ Uploaded to GridFS: ${filename} (ID: ${uploadStream.id})`);
        
        // Update product with GridFS file ID
        product.imageId = uploadStream.id.toString();
        await product.save();
        
        console.log(`✅ Updated product with GridFS ID: ${product.imageId}`);
        
        await mongoose.disconnect();
        process.exit(0);
      });
      
    } else {
      console.log('❌ File not found locally');
      await mongoose.disconnect();
      process.exit(0);
    }
    
  } catch (error) {
    console.error('❌ Error uploading to GridFS:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the upload
uploadToGridFS();
