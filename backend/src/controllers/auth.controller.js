const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-change-me';
const PASSWORD_MIN_LENGTH = 6;

const getRedirectUrl = (role) => {
  if (role === 'superadmin') {
    return '/admin/restaurants';
  }

  if (['cashier', 'waiter', 'manager'].includes(role)) {
    return '/pos';
  }

  return '/dashboard';
};

const sanitizeUser = (user) => {
  const userObject = user.toObject ? user.toObject() : { ...user };
  delete userObject.password;
  delete userObject.__v;
  return userObject;
};

const buildAuthResponse = (user) => {
  const sanitizedUser = sanitizeUser(user);

  return {
    token: jwt.sign(
      {
        id: user._id,
        role: user.role,
        restaurantId: user.restaurantId,
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    ),
    user: sanitizedUser,
    redirectUrl: getRedirectUrl(user.role),
  };
};

exports.validatePassword = (password) => {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`;
  }

  return null;
};

/**
 * Standard Username/Password Login
 * POST /api/v1/auth/login
 * Body: { login: string, password: string } (login can be email or phone)
 */
exports.login = async (req, res) => {
  try {
    const loginInput = req.body.login?.trim();
    const password = req.body.password;

    if (!loginInput || !password) {
      return res.status(400).json({ success: false, message: "Login and password are required" });
    }

    const user = await User.findOne({
      $or: [
        { email: loginInput.toLowerCase() },
        { phone: loginInput }
      ]
    }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "User account is disabled" });
    }

    // 2. Check password
    // Note: Older users without passwords won't be able to log in this way
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: buildAuthResponse(user)
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Login failed" });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    const passwordValidationError = exports.validatePassword(newPassword);
    if (passwordValidationError) {
      return res.status(400).json({ success: false, message: passwordValidationError });
    }

    const user = await User.findById(req.userId).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
};
