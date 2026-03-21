const express = require('express');
const router = express.Router();
const restaurantController = require('../controllers/restaurant.controller');
const verifyToken = require('../middleware/auth.middleware');
const { verifyRole } = require('../middleware/role.middleware');

// Base middleware for restaurant API (Owners Only)
router.use(verifyToken);
router.use(verifyRole(['owner']));

// Restaurant Profile
router.route('/profile')
  .get(restaurantController.getProfile)
  .put(restaurantController.updateProfile);

// Staff Management
router.route('/users')
  .get(restaurantController.getStaff)
  .post(restaurantController.createStaff);

router.route('/users/:id')
  .put(restaurantController.updateStaff)
  .delete(restaurantController.deleteStaff);

module.exports = router;
