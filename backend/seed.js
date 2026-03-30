require('dotenv').config();
const mongoose = require('mongoose');
const Restaurant = require('./src/models/restaurantModel');
const User = require('./src/models/userModel');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/grab-a-bite';

async function ensureDemoUser({ name, phone, role, password, restaurantId }) {
  let user = await User.findOne({ phone }).select('+password');

  if (!user) {
    user = new User({
      name,
      phone,
      role,
      password,
      restaurantId,
      isActive: true,
    });

    await user.save();
    console.log(`${role} inserted with phone: ${phone} and password: ${password}`);
    return;
  }

  user.name = name;
  user.role = role;
  user.password = password;
  user.isActive = true;

  if (restaurantId) {
    user.restaurantId = restaurantId;
  }

  await user.save();
  console.log(`${role} refreshed with phone: ${phone} and password: ${password}`);
}

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    
    // Create Dummy Restaurant
    let restaurant = await Restaurant.findOne({ name: 'The Demo Diner' });
    if (!restaurant) {
      restaurant = await Restaurant.create({
        name: 'The Demo Diner',
        ownerPhone: '+911111111111',
        address: {
          street: '123 Tech Park',
          city: 'Bangalore',
          state: 'Karnataka',
          zipCode: '560001',
          country: 'India'
        }
      });
      console.log('Dummy Restaurant created.');
    }

    await ensureDemoUser({
      name: 'System Super Admin',
      phone: '+910000000000',
      role: 'superadmin',
      password: 'admin123',
    });

    // Create a Dummy Owner linked to restaurant
    await ensureDemoUser({
      name: 'Demo Restaurant Owner',
      phone: '+911111111111',
      role: 'owner',
      restaurantId: restaurant._id,
      password: 'owner123',
    });

    // Create a Dummy Cashier linked to restaurant
    await ensureDemoUser({
      name: 'Demo Cashier',
      phone: '+912222222222',
      role: 'cashier',
      restaurantId: restaurant._id,
      password: 'cashier123',
    });

    console.log('Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
