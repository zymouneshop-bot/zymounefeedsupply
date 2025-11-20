const mongoose = require('mongoose');
require('dotenv').config();


const mongoUri = process.env.MONGODB_URI || 'mongodb+srv:

console.log('🔍 Checking database connection...');
console.log('🔍 Connection string:', mongoUri);

mongoose.connect(mongoUri, {
  dbName: 'feeds_store'
});

mongoose.connection.on('connected', async () => {
  console.log('📦 Connected to MongoDB');
  console.log('📦 Database name:', mongoose.connection.db.databaseName);
  
  if (mongoose.connection.db.databaseName !== 'feeds_store') {
    console.log('⚠️  WARNING: Connected to wrong database!');
    console.log('⚠️  Expected: feeds_store');
    console.log('⚠️  Actual:', mongoose.connection.db.databaseName);
  } else {
    console.log('✅ Connected to correct database: feeds_store');
  }
  
  try {
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📦 Available collections:', collections.map(c => c.name));
    
    
    const Staff = require('../src/models/Staff');
    const staffCount = await Staff.countDocuments({});
    console.log('👥 Staff count in feeds_store database:', staffCount);
    
    if (staffCount > 0) {
      const allStaff = await Staff.find({}).select('firstName lastName email status createdAt');
      console.log('👥 Staff members:', allStaff);
    }
    
    
    console.log('\n🔍 Checking sample_mflix database...');
    const sampleMflixDb = mongoose.connection.client.db('sample_mflix');
    const sampleCollections = await sampleMflixDb.listCollections().toArray();
    console.log('📦 Collections in sample_mflix:', sampleCollections.map(c => c.name));
    
    if (sampleCollections.some(c => c.name === 'staffs')) {
      const sampleStaffCount = await sampleMflixDb.collection('staffs').countDocuments();
      console.log('👥 Staff count in sample_mflix database:', sampleStaffCount);
      
      if (sampleStaffCount > 0) {
        const sampleStaff = await sampleMflixDb.collection('staffs').find({}).toArray();
        console.log('👥 Staff in sample_mflix:', sampleStaff.map(s => ({
          name: s.firstName + ' ' + s.lastName,
          email: s.email,
          status: s.status
        })));
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  }
  
  mongoose.connection.close();
});

mongoose.connection.on('error', (err) => {
  console.log('❌ MongoDB connection error:', err);
  process.exit(1);
});
