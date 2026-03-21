const Restaurant = require('../models/restaurantModel');
const User = require('../models/userModel');

// ---------------- RESTAURANT PROFILE ----------------
exports.getProfile = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    if (!restaurantId) return res.status(403).json({ success: false, message: 'Not linked to a restaurant' });

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    
    res.status(200).json({ success: true, data: restaurant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    if (!restaurantId) return res.status(403).json({ success: false, message: 'Not linked to a restaurant' });

    const restaurant = await Restaurant.findByIdAndUpdate(restaurantId, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: restaurant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------- STAFF MANAGEMENT ----------------
exports.getStaff = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    if (!restaurantId) return res.status(403).json({ success: false, message: 'Not linked to a restaurant' });

    // Fetch users linked to this restaurant who are NOT owners
    const staff = await User.find({ restaurantId, role: { $ne: 'owner' } });
    res.status(200).json({ success: true, count: staff.length, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createStaff = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    if (!restaurantId) return res.status(403).json({ success: false, message: 'Not linked to a restaurant' });

    const newStaff = new User({
      ...req.body,
      restaurantId // Lock the staff to the creator's restaurant
    });

    const user = await newStaff.save();
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'Phone number already exists' });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    
    // Ensure the staff belongs to this owner's restaurant
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, restaurantId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ success: false, message: 'Staff member not found or access denied' });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    
    const user = await User.findOneAndDelete({ _id: req.params.id, restaurantId });
    if (!user) return res.status(404).json({ success: false, message: 'Staff member not found or access denied' });
    
    res.status(200).json({ success: true, message: 'Staff member deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
