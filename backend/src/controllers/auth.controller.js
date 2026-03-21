const admin = require('../config/firebase');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-change-me';

/**
 * Verify Firebase OTP Token and Generate Custom Session Token
 * POST /api/v1/auth/verify-otp
 * Body: { idToken: string }
 */
exports.verifyOtp = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ success: false, message: "ID Token is required" });
    }

    // 1. Verify token using Firebase Admin SDK
    // This ensures the token was actually issued by Firebase and is valid
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const phone = decodedToken.phone_number;

    if (!phone) {
      return res.status(400).json({ success: false, message: "Phone number not found in token" });
    }

    // 2. Find user in MongoDB by phone number
    let user = await User.findOne({ phone });

    // Based on the spec, normal users/staff/owners are pre-created by the Superadmin/Owner 
    // EXCEPT that the spec implies users log in with their phone number after creation. 
    // If a user is not found, they might not have an account set up yet.
    if (!user) {
        // If we want to auto-register users as "customers", we would do it here.
        // However, the spec only mentions superadmin, owner, managers, staff.
        return res.status(404).json({ 
            success: false, 
            message: "User not found. Please contact the administrator to create an account." 
        });
    }

    if (!user.isActive) {
        return res.status(403).json({ success: false, message: "User account is disabled." });
    }

    // 3. Generate our own JWT for session management
    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role, 
        restaurantId: user.restaurantId 
      },
      JWT_SECRET,
      { expiresIn: '1d' } // JWT token (1 day)
    );

    // 4. Return success response with token and redirect info based on role
    let redirectUrl = '/dashboard'; // Default
    if (user.role === 'superadmin') {
      redirectUrl = '/admin/restaurants';
    } else if (['cashier', 'waiter', 'manager'].includes(user.role)) {
      redirectUrl = '/pos';
    }

    res.status(200).json({
      success: true,
      message: "Authentication successful",
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          restaurantId: user.restaurantId
        },
        redirectUrl
      }
    });

  } catch (error) {
    console.error("Auth Error:", error);
    if (error.code === 'auth/id-token-expired') {
        return res.status(401).json({ success: false, message: "Firebase token has expired" });
    }
    if (error.code === 'auth/argument-error') {
        return res.status(401).json({ success: false, message: "Invalid token format" });
    }
    res.status(500).json({ success: false, message: "Authentication failed" });
  }
};

/**
 * Standard Username/Password Login
 * POST /api/v1/auth/login
 * Body: { login: string, password: string } (login can be email or phone)
 */
exports.login = async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return res.status(400).json({ success: false, message: "Login and password are required" });
    }

    // 1. Find user by email or phone
    const user = await User.findOne({
      $or: [
        { email: login.toLowerCase() },
        { phone: login }
      ]
    });

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

    // 3. Generate JWT
    const token = jwt.sign(
      { 
        id: user._id, 
        role: user.role, 
        restaurantId: user.restaurantId 
      },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // 4. Return success
    let redirectUrl = '/dashboard';
    if (user.role === 'superadmin') {
      redirectUrl = '/admin/restaurants';
    } else if (['cashier', 'waiter', 'manager'].includes(user.role)) {
      redirectUrl = '/pos';
    }

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
          restaurantId: user.restaurantId
        },
        redirectUrl
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Login failed" });
  }
};