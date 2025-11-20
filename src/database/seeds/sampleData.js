const User = require('../../models/User');
const Product = require('../../models/Product');

const sampleProducts = [
  
  {
    name: 'Premium Starter Feed',
    description: 'High-quality starter feed for young chickens (0-8 weeks)',
    animal: 'chicken',
    category: 'feeds',
    type: 'starter',
    pricePerSack: 25.99,
    pricePerKilo: 1.04,
    stockSacks: 50,
    stockKilos: 1250,
    imageUrl: '',
    
    price: 25.99,
    stock: 50,
    unit: 'sack'
  },
  {
    name: 'Grower Feed Premium',
    description: 'Balanced nutrition for growing chickens (8-20 weeks)',
    animal: 'chicken',
    category: 'feeds',
    type: 'grower',
    pricePerSack: 23.99,
    pricePerKilo: 0.96,
    stockSacks: 75,
    stockKilos: 1875,
    imageUrl: '',
    
    price: 23.99,
    stock: 75,
    unit: 'sack'
  },
  {
    name: 'Layer Feed Complete',
    description: 'Complete nutrition for egg-laying hens',
    animal: 'chicken',
    category: 'feeds',
    type: 'layer',
    pricePerSack: 27.99,
    pricePerKilo: 1.12,
    stockSacks: 60,
    stockKilos: 1500,
    imageUrl: '',
    
    price: 27.99,
    stock: 60,
    unit: 'sack'
  },
  {
    name: 'Chicken Vitamin Supplement',
    description: 'Essential vitamins for chicken health and egg production',
    animal: 'chicken',
    category: 'supplements',
    type: 'vitamins',
    price: 15.99,
    stock: 25,
    unit: 'kilo',
    imageUrl: ''
  },
  {
    name: 'Chicken Mineral Supplement',
    description: 'Essential minerals for bone strength and eggshell quality',
    animal: 'chicken',
    category: 'supplements',
    type: 'minerals',
    price: 12.99,
    stock: 30,
    unit: 'kilo',
    imageUrl: ''
  },
  
  
  {
    name: 'Piglet Starter Feed',
    description: 'Premium starter feed for piglets (3-8 weeks)',
    animal: 'pig',
    category: 'feeds',
    type: 'starter',
    price: 32.99,
    stock: 38,
    unit: 'sack',
    imageUrl: ''
  },
  {
    name: 'Pig Grower Feed',
    description: 'High-energy feed for growing pigs (8-20 weeks)',
    animal: 'pig',
    category: 'feeds',
    type: 'grower',
    price: 30.99,
    stock: 15,
    unit: 'sack',
    imageUrl: ''
  },
  {
    name: 'Pig Finisher Feed',
    description: 'Final stage feed for market-ready pigs',
    animal: 'pig',
    category: 'feeds',
    type: 'finisher',
    price: 28.99,
    stock: 8,
    unit: 'sack',
    imageUrl: ''
  },
  {
    name: 'Pig Vitamin Supplement',
    description: 'Specialized vitamins for pig health and growth',
    animal: 'pig',
    category: 'supplements',
    type: 'vitamins',
    price: 18.99,
    stock: 20,
    unit: 'kilo',
    imageUrl: ''
  },
  {
    name: 'Pig Mineral Supplement',
    description: 'Essential minerals for pig bone and muscle development',
    animal: 'pig',
    category: 'supplements',
    type: 'minerals',
    price: 16.99,
    stock: 18,
    unit: 'kilo',
    imageUrl: ''
  }
];

const createSampleData = async () => {
  try {
    
    const adminExists = await User.findOne({ email: 'admin@feedsstore.com' });
    if (!adminExists) {
      const admin = new User({
        email: 'admin@feedsstore.com',
        password: 'admin123',
        firstName: 'Store',
        lastName: 'Admin',
        phone: '+1234567890',
        role: 'admin'
      });
      await admin.save();
      console.log('✅ Admin user created: admin@feedsstore.com / admin123');
    }

    
    const customerExists = await User.findOne({ email: 'customer@example.com' });
    if (!customerExists) {
      const customer = new User({
        email: 'customer@example.com',
        password: 'customer123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567891',
        address: {
          street: '123 Farm Road',
          city: 'Farmville',
          state: 'CA',
          zipCode: '12345',
          country: 'USA'
        },
        role: 'customer'
      });
      await customer.save();
      console.log('✅ Sample customer created: customer@example.com / customer123');
    }

    
    await Product.deleteMany({}); 
    await Product.insertMany(sampleProducts);
    console.log('✅ Sample products created');

    console.log('🎉 Sample data setup complete!');
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  }
};

module.exports = createSampleData;
