const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  name: String,      // Snapshot of item name
  quantity: Number,  // Quantity ordered
  price: Number,     // Snapshot of price at time of order
  options: [{ type: mongoose.Schema.Types.String }] // e.g., "no onions", "extra cheese"
});

const orderSchema = new mongoose.Schema({
  restaurantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Restaurant', 
    required: true,
    index: true 
  },
  orderNumber: { type: String, required: true, unique: true }, // e.g., "ORD-2023-001"
  userId: { // Who created it (Owner for admin, Staff for POS)
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  items: [orderItemSchema], // Array of snapshots
  
  orderType: {
    type: String,
    enum: ['dine-in', 'takeaway'],
    required: true
  },
  totalAmount: { type: Number, required: true },
  taxAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  finalAmount: { type: Number, default: 0 },
  
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded', 'failed'], default: 'pending' },
  
  paymentMethod: { type: String, default: 'cash' }, // cash, card, online
  paymentIntentId: String, // For Razorpay future integration
  
  location: { // Where the food was sent/delivered
    type: {
      lat: Number,
      lng: Number
    }
  },
  
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date }, // Populated when status becomes 'completed'
  cancelledAt: { type: Date } // Populated when status becomes 'cancelled'
});

// Indexes for efficient reporting
orderSchema.index({ restaurantId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ userId: 1 });

module.exports = mongoose.model('Order', orderSchema);
