const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: false,
    default: ''
  },
  animal: {
    type: String,
    enum: ['chicken', 'pig'],
    required: true
  },
  category: {
    type: String,
    enum: ['feeds', 'supplements'],
    required: true
  },
  type: {
    type: String,
    required: false
  },
  
  pricePerSack: {
    type: Number,
    required: function() {
      return this.category === 'feeds';
    },
    min: 0,
    default: 0
  },
  pricePerKilo: {
    type: Number,
    required: function() {
      return this.category === 'feeds';
    },
    min: 0,
    default: 0
  },
  
  // Cost price fields for profit calculation
  costPerSack: {
    type: Number,
    required: false,
    min: 0,
    default: 0
  },
  
  stockSacks: {
    type: Number,
    required: function() {
      return this.category === 'feeds';
    },
    min: 0,
    default: 0
  },
  netWeightPerSack: {
    type: Number,
    required: function() {
      return this.category === 'feeds';
    },
    min: 0,
    default: 25
  },
  stockKilos: {
    type: Number,
    required: false,
    min: 0,
    default: 0
  },
  stockHalfKilos: {
    type: Number,
    required: false,
    min: 0,
    default: 0
  },
  
  price: {
    type: Number,
    required: function() {
      return this.category === 'supplements';
    },
    min: 0,
    default: 0
  },
  cost: {
    type: Number,
    required: false,
    min: 0,
    default: 0
  },
  stock: {
    type: Number,
    required: function() {
      return this.category === 'supplements';
    },
    min: 0,
    default: 0
  },
  unit: {
    type: String,
    required: false,
    enum: ['sack', 'kilo', 'bag', 'kg', 'ton', 'liter', 'piece', 'units']
  },
  imageUrl: {
    type: String,
    default: ''
  },
  imageId: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  qrCode: {
    type: String,
    required: false,
    unique: true,
    sparse: true
  },
  customId: {
    type: String,
    required: false,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});


// Virtual fields for automatic stock calculation
productSchema.virtual('calculatedStockKilos').get(function() {
  if (this.category === 'feeds' && this.stockSacks !== undefined) {
    const netWeight = this.netWeightPerSack || 25; // Use net weight, default to 25kg
    return this.stockSacks * netWeight;
  }
  return this.stockKilos || 0;
});

productSchema.virtual('calculatedStockHalfKilos').get(function() {
  if (this.category === 'feeds' && this.stockSacks !== undefined) {
    const netWeight = this.netWeightPerSack || 25; // Use net weight, default to 25kg
    return this.stockSacks * netWeight * 2; // Half-kilos are half of kilos
  }
  return this.stockHalfKilos || 0;
});

// Method to update stock based on sack changes
productSchema.methods.updateStockFromSacks = function() {
  if (this.category === 'feeds') {
    const netWeight = this.netWeightPerSack || 25;
    this.stockKilos = Math.round((this.stockSacks * netWeight) * 100) / 100; // Round to 2 decimal places
    this.stockHalfKilos = Math.round((this.stockSacks * netWeight * 2) * 100) / 100; // Round to 2 decimal places
  }
  return this;
};

// Method to update stock based on kilo changes
productSchema.methods.updateStockFromKilos = function() {
  if (this.category === 'feeds') {
    const netWeight = this.netWeightPerSack || 25;
    this.stockSacks = Math.round((this.stockKilos / netWeight) * 100) / 100; // Round to 2 decimal places
    this.stockHalfKilos = Math.round((this.stockKilos * 2) * 100) / 100; // Round to 2 decimal places
  }
  return this;
};

// Method to update stock based on half-kilo changes
productSchema.methods.updateStockFromHalfKilos = function() {
  if (this.category === 'feeds') {
    const netWeight = this.netWeightPerSack || 25;
    this.stockSacks = Math.round((this.stockHalfKilos / (netWeight * 2)) * 100) / 100; // Round to 2 decimal places
    this.stockKilos = Math.round((this.stockHalfKilos / 2) * 100) / 100; // Round to 2 decimal places
  }
  return this;
};

// Pre-save middleware to auto-calculate stock
productSchema.pre('save', function(next) {
  if (this.category === 'feeds' && this.stockSacks !== undefined) {
    // Auto-calculate kilo and half-kilo from sacks using net weight
    const netWeight = this.netWeightPerSack || 25;
    this.stockKilos = Math.round((this.stockSacks * netWeight) * 100) / 100; // Round to 2 decimal places
    this.stockHalfKilos = Math.round((this.stockSacks * netWeight * 2) * 100) / 100; // Round to 2 decimal places
    
    // Ensure stock values are never negative
    this.stockSacks = Math.max(0, this.stockSacks);
    this.stockKilos = Math.max(0, this.stockKilos);
    this.stockHalfKilos = Math.max(0, this.stockHalfKilos);
  } else if (this.category === 'supplements') {
    // For supplements, set kilos and half-kilos to 0
    this.stockKilos = 0;
    this.stockHalfKilos = 0;
    
    // Ensure stock values are never negative
    this.stockSacks = Math.max(0, this.stockSacks);
  }
  
  // Ensure all stock values are never negative
  if (this.stock !== undefined) {
    this.stock = Math.max(0, this.stock);
  }
  if (this.stockSacks !== undefined) {
    this.stockSacks = Math.max(0, this.stockSacks);
  }
  if (this.stockKilos !== undefined) {
    this.stockKilos = Math.max(0, this.stockKilos);
  }
  if (this.stockHalfKilos !== undefined) {
    this.stockHalfKilos = Math.max(0, this.stockHalfKilos);
  }
  
  next();
});

productSchema.index({ animal: 1, category: 1 });
productSchema.index({ name: 'text', description: 'text' });
// Performance optimization indexes
productSchema.index({ isActive: 1 });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ stockSacks: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ featured: 1, isActive: 1 });

module.exports = mongoose.model('Product', productSchema);
