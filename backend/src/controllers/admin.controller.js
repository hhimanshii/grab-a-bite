const Restaurant = require('../models/restaurantModel');
const User = require('../models/userModel');
const MenuItem = require('../models/menuItemModel');
const Order = require('../models/orderModel');
const { validatePassword } = require('./auth.controller');
// PDF generation for receipts will be handled later in the order or admin controller (in a helper function)

const sanitizeUser = (user) => {
  const userObject = user.toObject ? user.toObject() : { ...user };
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

// ---------------- RESTAURANTS ----------------
exports.getRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: restaurants.length, data: restaurants });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    res.status(200).json({ success: true, data: restaurant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createRestaurant = async (req, res) => {
  try {
    // Body: { name, phone, logo, plan }
    const restaurant = await Restaurant.create({
      name: req.body.name,
      ownerPhone: req.body.phone, // mapping phone to ownerPhone as per schema
      description: req.body.plan, // using description field temporarily for plan since it's missing in schema, or we can just ignore
      // Note: schema doesn't have a 'logo' or 'plan' field explicitly defined beyond standard fields. We will save what maps.
      isActive: true
    });
    res.status(201).json({ success: true, data: restaurant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    res.status(200).json({ success: true, data: restaurant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndDelete(req.params.id);
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    // Cleanup related users, menus, orders? (Optional but good practice)
    res.status(200).json({ success: true, message: 'Restaurant deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- USERS ----------------
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().populate('restaurantId', 'name');
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, phone, email, password, role, restaurantId, isActive } = req.body;

    if (!name || !phone || !role || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone, role, and password are required',
      });
    }

    const passwordValidationError = validatePassword(password);
    if (passwordValidationError) {
      return res.status(400).json({ success: false, message: passwordValidationError });
    }

    const user = await User.create({
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim().toLowerCase() : undefined,
      password,
      role,
      restaurantId: restaurantId || undefined,
      isActive,
    });

    res.status(201).json({ success: true, data: sanitizeUser(user) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Phone number or email already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('+password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const { password, email, phone, ...rest } = req.body;

    if (password) {
      const passwordValidationError = validatePassword(password);
      if (passwordValidationError) {
        return res.status(400).json({ success: false, message: passwordValidationError });
      }

      user.password = password;
    }

    if (email !== undefined) {
      user.email = email ? email.trim().toLowerCase() : undefined;
    }

    if (phone !== undefined) {
      user.phone = phone ? phone.trim() : phone;
    }

    Object.assign(user, rest);
    await user.save();

    res.status(200).json({ success: true, data: sanitizeUser(user) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Phone number or email already exists' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- MENU ----------------
exports.getGlobalMenu = async (req, res) => {
  try {
    const menus = await MenuItem.find().populate('restaurantId', 'name');
    res.status(200).json({ success: true, count: menus.length, data: menus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createGlobalMenu = async (req, res) => {
  try {
    if (!req.body.restaurantId) return res.status(400).json({ success: false, message: 'restaurantId is required' });
    const menuItem = await MenuItem.create(req.body);
    res.status(201).json({ success: true, data: menuItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateGlobalMenu = async (req, res) => {
  try {
    const menuItem = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!menuItem) return res.status(404).json({ success: false, message: 'Menu item not found' });
    res.status(200).json({ success: true, data: menuItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteGlobalMenu = async (req, res) => {
  try {
    const menuItem = await MenuItem.findByIdAndDelete(req.params.id);
    if (!menuItem) return res.status(404).json({ success: false, message: 'Menu item not found' });
    res.status(200).json({ success: true, message: 'Menu item deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- ORDERS ----------------
exports.getGlobalOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('restaurantId', 'name')
      .populate('userId', 'name role')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGlobalOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('restaurantId', 'name')
      .populate('userId', 'name role');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateGlobalOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    let updateFields = { status };
    if (status === 'completed') updateFields.completedAt = Date.now();
    if (status === 'cancelled') updateFields.cancelledAt = Date.now();

    const order = await Order.findByIdAndUpdate(req.params.id, updateFields, { new: true, runValidators: true });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGlobalOrderReceipt = async (req, res) => {
  try {
    // PDF Generation will be handled centrally later, returning JSON 404 for now
    res.status(501).json({ success: false, message: 'PDF Generation logic pending' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- REPORTS ----------------
exports.getGlobalSales = async (req, res) => {
  try {
    const { restaurantId } = req.query;
    let matchStage = { status: 'completed' };
    
    // If we passed a restaurantId as a query param or string, cast to object ID could be needed
    // However string match inside aggregate sometimes works, let's keep it robust
    if (restaurantId) {
      const mongoose = require('mongoose');
      matchStage.restaurantId = new mongoose.Types.ObjectId(restaurantId);
    }

    const sales = await Order.aggregate([
      { $match: matchStage },
      { $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalOrders: { $sum: 1 }
      }}
    ]);

    const result = sales.length > 0 ? sales[0] : { totalRevenue: 0, totalOrders: 0 };
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGlobalTopItems = async (req, res) => {
  try {
    const { startDate, endDate, restaurantId } = req.query;
    let matchStage = { status: 'completed' };
    
    if (restaurantId) {
       const mongoose = require('mongoose');
       matchStage.restaurantId = new mongoose.Types.ObjectId(restaurantId);
    }
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    const topItems = await Order.aggregate([
      { $match: matchStage },
      { $unwind: "$items" },
      { $group: {
          _id: "$items.name",
          totalSold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
      }},
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({ success: true, data: topItems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
