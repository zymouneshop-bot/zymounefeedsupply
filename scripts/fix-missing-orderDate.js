// Script to update missing orderDate fields in MongoDB
// Usage: node scripts/fix-missing-orderDate.js

const mongoose = require('mongoose');
const Order = require('../src/models/Order');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/zymounefeedsupply';

async function fixOrderDates() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const orders = await Order.find({ $or: [ { orderDate: { $exists: false } }, { orderDate: null } ] });
  console.log(`Found ${orders.length} orders missing orderDate.`);
  let updated = 0;
  for (const order of orders) {
    let newDate = order.createdAt || order.updatedAt || new Date();
    order.orderDate = newDate;
    await order.save();
    updated++;
    console.log(`Updated order ${order._id} with orderDate ${newDate}`);
  }
  console.log(`Updated ${updated} orders.`);
  await mongoose.disconnect();
}

fixOrderDates().catch(err => {
  console.error('Error updating orders:', err);
  process.exit(1);
});
