# Performance Optimization Guide

## Problem Identified
The system takes 2-3 minutes to load data because of **N+1 query problems** - where the code makes one query, then for each result, makes additional queries in a loop.

## Current Bottlenecks

### 1. **getDirectSalesData endpoint** (FIXED ✅)
**Issue**: For each order item, it queries the database separately
```javascript
// BEFORE (SLOW): Multiple queries
for (const order of orders) {
  for (const item of order.items) {
    const product = await Product.findById(item.productId); // ❌ Query in loop!
  }
}
```

**Solution Applied**: Use `.populate()` to fetch all product data in one query
```javascript
// AFTER (FAST): Single query
const orders = await Order.find({...}).populate('items.productId', 'fields');
```

### 2. **getAdminDashboard endpoint** (Needs optimization)
**Issue**: Makes 5 separate count queries that could be aggregated
```javascript
const totalCustomers = await User.countDocuments({...}); // Query 1
const totalProducts = await Product.countDocuments({...}); // Query 2
const lowStockProducts = await Product.find({...}); // Query 3
const recentProducts = await Product.find({...}); // Query 4
// Plus 3 more count queries for categories
```

**Solution**: Use MongoDB aggregation pipeline to run multiple operations efficiently

### 3. **getSalesAnalytics in SalesService** (Major issue)
**Issue**: Loops through orders and items, making individual product queries
- Finds all products first: `await Product.find({})`
- Then for each order item: `await Product.findById(item.productId)` (repeated!)
- Then calculates revenue: `await Product.findById(item.productId)` (AGAIN!)

## Recommended Fixes

### Fix 1: Optimize getAdminDashboard
```javascript
// Use aggregation pipeline for dashboard stats
const stats = await Product.aggregate([
  { $match: { isActive: true } },
  { $facet: {
    total: [{ $count: "count" }],
    lowStock: [{ $match: { stockSacks: { $lt: 10 } } }, { $count: "count" }],
    byCategory: [
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]
  }}
]);
```

### Fix 2: Add Database Indexes
Ensure these fields are indexed for faster queries:
```javascript
// In Product model
productSchema.index({ isActive: 1 });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ stockSacks: 1 });
productSchema.index({ createdAt: -1 });

// In Order model
orderSchema.index({ createdAt: 1 });
orderSchema.index({ status: 1 });
```

### Fix 3: Implement Query Result Caching
For dashboard data that doesn't change frequently:
```javascript
// Cache dashboard stats for 5 minutes
const dashboardCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedAdminDashboard() {
  const now = Date.now();
  if (dashboardCache.has('admin') && now - dashboardCache.get('admin').timestamp < CACHE_TTL) {
    return dashboardCache.get('admin').data;
  }
  
  const data = await fetchFreshDashboard();
  dashboardCache.set('admin', { data, timestamp: now });
  return data;
}
```

### Fix 4: Use .lean() for Read-Only Queries
```javascript
// .lean() returns plain JavaScript objects (faster)
const orders = await Order.find({...}).lean().populate('items.productId');
```

### Fix 5: Implement Pagination/Lazy Loading
For large datasets, load data in chunks:
```javascript
// Load only what's needed, not everything
const orders = await Order.find({...})
  .limit(50)  // Load 50 at a time
  .skip((page - 1) * 50)
  .populate('items.productId');
```

## Quick Wins (Implement First)

1. ✅ **Already Fixed**: `getDirectSalesData` - Added `.populate()` to fetch products with orders
2. **Add indexes** to Product and Order models - Takes 5 minutes
3. **Cache dashboard stats** - Reduces database load significantly
4. **Lazy load analytics** - Show summary first, detailed data on demand

## Expected Performance Improvement

After applying all fixes:
- **Current**: 2-3 minutes load time
- **Target**: 200-500ms load time (3-5x faster)

## Implementation Priority

1. **High Priority**: Add database indexes
2. **High Priority**: Optimize analytics query with aggregation
3. **Medium Priority**: Implement caching for dashboard
4. **Medium Priority**: Add pagination to large datasets
5. **Low Priority**: Lazy load detailed analytics

## Monitoring

Monitor slow queries with:
```javascript
// In app.js
mongoose.set('debug', true); // Enable MongoDB logging to see query times
```

## Next Steps

1. Verify the `getDirectSalesData` fix resolved the immediate issue
2. Add indexes to Product and Order collections
3. Implement aggregation pipeline for analytics
4. Add caching layer for dashboard data
