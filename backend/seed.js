require('dotenv').config();
const mongoose = require('mongoose');
const Restaurant = require('./src/models/restaurantModel');
const User = require('./src/models/userModel');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/grab-a-bite';

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

    // Create Super Admin
    const superAdminExists = await User.findOne({ phone: '+910000000000' });
    if (!superAdminExists) {
      await User.create({
        name: 'System Super Admin',
        phone: '+910000000000',
        role: 'superadmin',
        password: 'admin123',
      });
      console.log('Super Admin inserted with phone: +910000000000 and password: admin123');
    } else {
      console.log('Super Admin already exists.');
    }

    // Create a Dummy Owner linked to restaurant
    let owner = await User.findOne({ phone: '+911111111111' });
    if (!owner) {
      owner = await User.create({
        name: 'Demo Restaurant Owner',
        phone: '+911111111111',
        role: 'owner',
        restaurantId: restaurant._id,
        password: 'owner123',
      });
      console.log('Owner inserted with phone: +911111111111, password: owner123 and linked to restaurant');
    } else if (!owner.restaurantId) {
      owner.restaurantId = restaurant._id;
      await owner.save();
      console.log('Existing Owner linked to restaurant');
    } else {
      console.log('Owner already exists and linked.');
    }

    // Create a Dummy Cashier linked to restaurant
    let cashier = await User.findOne({ phone: '+912222222222' });
    if (!cashier) {
      cashier = await User.create({
        name: 'Demo Cashier',
        phone: '+912222222222',
        role: 'cashier',
        restaurantId: restaurant._id,
        password: 'cashier123',
      });
      console.log('Cashier inserted with phone: +912222222222, password: cashier123 and linked to restaurant');
    } else if (!cashier.restaurantId) {
      cashier.restaurantId = restaurant._id;
      await cashier.save();
      console.log('Existing Cashier linked to restaurant');
    } else {
      console.log('Cashier already exists and linked.');
    }

    console.log('Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
