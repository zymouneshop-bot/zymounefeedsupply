const mongoose = require('mongoose');
require('dotenv').config();


const mongoUri = process.env.MONGODB_URI || 'mongodb+srv:

console.log('🔍 Testing MongoDB Atlas connection...');
console.log('📡 Connection string:', mongoUri.replace(/\/\/.*@/, '


const connectionOptions = {
  dbName: 'feeds_store',
  tls: true,
  tlsAllowInvalidCertificates: false,
  tlsAllowInvalidHostnames: false,
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 30000,
  maxPoolSize: 10,
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
  retryWrites: true,
  w: 'majority'
};


async function testConnection() {
  try {
    console.log('⏳ Attempting to connect...');
    
    await mongoose.connect(mongoUri, connectionOptions);
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log('📦 Database:', mongoose.connection.db.databaseName);
    console.log('🔗 Connection state:', mongoose.connection.readyState);
    
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📚 Available collections:', collections.map(c => c.name));
    
    
    const User = require('../src/models/User');
    const userCount = await User.countDocuments();
    console.log('👥 User count:', userCount);
    
    console.log('🎉 Connection test completed successfully!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    if (error.message.includes('IP')) {
      console.log('\n💡 Possible solutions:');
      console.log('1. Add your IP address to MongoDB Atlas Network Access whitelist');
      console.log('2. Use 0.0.0.0/0 to allow all IPs (less secure)');
      console.log('3. Check your firewall settings');
    }
    
    if (error.message.includes('SSL') || error.message.includes('TLS')) {
      console.log('\n💡 SSL/TLS solutions:');
      console.log('1. Update Node.js to latest version');
      console.log('2. Update mongoose to latest version');
      console.log('3. Check your network/firewall settings');
    }
    
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}


testConnection();
