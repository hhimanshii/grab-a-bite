const Restaurant = require('../models/restaurantModel');
const User = require('../models/userModel');
const { validatePassword } = require('./auth.controller');

const sanitizeUser = (user) => {
  const userObject = user.toObject ? user.toObject() : { ...user };
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

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

    if (!req.body.password) {
      return res.status(400).json({ success: false, message: 'Password is required' });
    }

    const passwordValidationError = validatePassword(req.body.password);
    if (passwordValidationError) {
      return res.status(400).json({ success: false, message: passwordValidationError });
    }

    const newStaff = new User({
      ...req.body,
      phone: req.body.phone?.trim(),
      email: req.body.email ? req.body.email.trim().toLowerCase() : undefined,
      restaurantId // Lock the staff to the creator's restaurant
    });

    const user = await newStaff.save();
    res.status(201).json({ success: true, data: sanitizeUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'Phone number or email already exists' });
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const user = await User.findOne({ _id: req.params.id, restaurantId }).select('+password');

    if (!user) return res.status(404).json({ success: false, message: 'Staff member not found or access denied' });

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
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'Phone number or email already exists' });
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
