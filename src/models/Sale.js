const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  productCategory: {
    type: String,
    required: true
  },
  productAnimal: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true,
    enum: ['sack', 'kilo', 'bag', 'kg', 'ton', 'liter', 'piece']
  },
  pricePerUnit: {
    type: Number,
    required: true,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  costPerUnit: {
    type: Number,
    required: false,
    min: 0,
    default: 0
  },
  totalCost: {
    type: Number,
    required: false,
    min: 0,
    default: 0
  },
  profit: {
    type: Number,
    required: false,
    min: 0,
    default: 0
  },
  customerInfo: {
    name: String,
    phone: String,
    email: String
  },
  saleDate: {
    type: Date,
    default: Date.now
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'online'],
    default: 'cash'
  },
  status: {
    type: String,
    enum: ['completed', 'pending', 'cancelled'],
    default: 'completed'
  }
}, {
  timestamps: true
});


saleSchema.index({ saleDate: -1 });
saleSchema.index({ productId: 1, saleDate: -1 });
saleSchema.index({ productAnimal: 1, saleDate: -1 });

module.exports = mongoose.model('Sale', saleSchema);
