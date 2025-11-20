const mongoose = require('mongoose');
const Product = require('../src/models/Product');
require('dotenv').config();

async function fixStockFields() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/feeds', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Connected to MongoDB');
    
    // Find products with inconsistent stock fields
    const products = await Product.find({
      $or: [
        // Products with stock in legacy field but not in new fields
        { 
          stock: { $gt: 0 },
          stockSacks: { $lte: 0 }
        },
        // Products with stockSacks but no legacy stock
        {
          stockSacks: { $gt: 0 },
          stock: { $lte: 0 }
        }
      ]
    });
    
    console.log(`Found ${products.length} products with inconsistent stock fields`);
    
    for (const product of products) {
      console.log(`\nProcessing product: ${product.name}`);
      console.log(`Current stock fields:`, {
        stock: product.stock,
        stockSacks: product.stockSacks,
        stockKilos: product.stockKilos,
        stockHalfKilos: product.stockHalfKilos
      });
      
      let updated = false;
      
      // If product has stock in legacy field but not in stockSacks
      if (product.stock > 0 && product.stockSacks <= 0) {
        console.log(`  → Migrating ${product.stock} from legacy stock to stockSacks`);
        product.stockSacks = product.stock;
        updated = true;
      }
      
      // If product has stockSacks but no legacy stock, sync legacy field
      if (product.stockSacks > 0 && product.stock <= 0) {
        console.log(`  → Syncing ${product.stockSacks} from stockSacks to legacy stock`);
        product.stock = product.stockSacks;
        updated = true;
      }
      
      // For supplements, ensure both fields are in sync
      if (product.category === 'supplements') {
        const maxStock = Math.max(product.stock || 0, product.stockSacks || 0);
        if (maxStock > 0) {
          product.stock = maxStock;
          product.stockSacks = maxStock;
          console.log(`  → Synced supplement stock to ${maxStock}`);
          updated = true;
        }
      }
      
      if (updated) {
        await product.save();
        console.log(`  ✅ Updated product: ${product.name}`);
        console.log(`  New stock fields:`, {
          stock: product.stock,
          stockSacks: product.stockSacks,
          stockKilos: product.stockKilos,
          stockHalfKilos: product.stockHalfKilos
        });
      } else {
        console.log(`  ⏭️  No changes needed for ${product.name}`);
      }
    }
    
    console.log('\n✅ Stock field migration completed');
    
  } catch (error) {
    console.error('❌ Error fixing stock fields:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Run the fix
fixStockFields();
