const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Grid = require('gridfs-stream');
const Product = require('../src/models/Product');
require('dotenv').config();

async function migrateToGridFS() {
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
    
    // Find products with local file system images
    const products = await Product.find({ 
      imageUrl: { $regex: /^\/uploads\// },
      imageId: { $exists: false }
    });
    
    console.log(`Found ${products.length} products with local images to migrate`);
    
    for (const product of products) {
      if (product.imageUrl && product.imageUrl.startsWith('/uploads/')) {
        const filename = product.imageUrl.split('/').pop();
        const filePath = path.join(__dirname, '..', 'uploads', filename);
        
        // Check if file exists
        if (fs.existsSync(filePath)) {
          console.log(`Migrating ${product.name}: ${filename}`);
          
          // Read file
          const fileData = fs.readFileSync(filePath);
          
          // Upload to GridFS
          const writeStream = gfs.createWriteStream({
            filename: filename,
            contentType: 'image/jpeg' // Default, will be detected
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
              
              resolve();
            });
            
            writeStream.on('error', reject);
          });
        } else {
          console.log(`⚠️ File not found: ${filePath}`);
        }
      }
    }
    
    console.log('✅ Migration to GridFS completed!');
    console.log('All images are now stored in the cloud database');
    
  } catch (error) {
    console.error('❌ Error migrating to GridFS:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Run the migration
migrateToGridFS();
