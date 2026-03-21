const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  restaurantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Restaurant', 
    required: true,
    index: true 
  },
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  category: { 
    type: String, 
    required: true, 
    enum: ['Burgers', 'Pizzas', 'Drinks', 'Sides', 'Desserts'] 
  },
  isAvailable: { type: Boolean, default: true }, // Crucial for POS logic
  imageUrl: { type: String }, // URL from Cloudinary
  prepTime: { type: Number, default: 15 }, // in minutes
  createdAt: { type: Date, default: Date.now }
});

// Compound index for fast fetching all items of a specific category in a specific restaurant
menuItemSchema.index({ restaurantId: 1, category: 1 });

module.exports = mongoose.model('MenuItem', menuItemSchema);
