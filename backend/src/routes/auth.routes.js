const express = require('express');
const router = express.Router();
const { verifyOtp } = require('../controllers/auth.controller');
const verifyToken = require('../middleware/auth.middleware'); 

// Public Auth Routes
router.post('/verify-otp', verifyOtp);
router.post('/login', require('../controllers/auth.controller').login);

// Protected Auth Route for fetching profile/me logic
router.get('/me', verifyToken, async (req, res) => {
    try {
        const User = require('../models/userModel');
        const user = await User.findById(req.userId).select('-__v');
        if (!user) {
             return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch user' });
    }
});

module.exports = router;