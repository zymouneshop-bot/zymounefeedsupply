const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Grid = require('gridfs-stream');
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
    
    // Initialize GridFS
    const gfs = Grid(mongoose.connection.db, mongoose.mongo);
    gfs.collection('uploads');
    
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
      
      // Read file
      const fileData = fs.readFileSync(filePath);
      console.log(`File size: ${fileData.length} bytes`);
      
      // Upload to GridFS
      const writeStream = gfs.createWriteStream({
        filename: filename,
        contentType: 'image/png'
      });
      
      writeStream.write(fileData);
      writeStream.end();
      
      // Wait for upload to complete
      await new Promise((resolve, reject) => {
        writeStream.on('close', (file) => {
          console.log(`✅ Uploaded to GridFS: ${file.filename} (ID: ${file._id})`);
          
          // Update product with GridFS file ID
          product.imageId = file._id.toString();
          product.save();
          
          console.log(`✅ Updated product with GridFS ID: ${product.imageId}`);
          resolve();
        });
        
        writeStream.on('error', reject);
      });
      
    } else {
      console.log('❌ File not found locally');
    }
    
  } catch (error) {
    console.error('❌ Error uploading to GridFS:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Run the upload
uploadToGridFS();
