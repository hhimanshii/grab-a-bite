const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const verifyToken = require('../middleware/auth.middleware'); 

// Public Auth Routes
router.post('/login', authController.login);

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
router.post('/change-password', verifyToken, authController.changePassword);

module.exports = router;
