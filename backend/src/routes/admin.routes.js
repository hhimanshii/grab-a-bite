const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const verifyToken = require('../middleware/auth.middleware');
const { verifyRole } = require('../middleware/role.middleware');

// Apply auth & RBAC middleware to ALL routes in this file
router.use(verifyToken);
router.use(verifyRole(['superadmin']));

// RESTAURANTS
router.route('/restaurants')
  .get(adminController.getRestaurants)
  .post(adminController.createRestaurant);

router.route('/restaurants/:id')
  .get(adminController.getRestaurantById)
  .put(adminController.updateRestaurant)
  .delete(adminController.deleteRestaurant);

// USERS
router.route('/users')
  .get(adminController.getUsers)
  .post(adminController.createUser);

router.route('/users/:id')
  .put(adminController.updateUser)
  .delete(adminController.deleteUser);

// MENU
router.route('/menu')
  .get(adminController.getGlobalMenu)
  .post(adminController.createGlobalMenu);

router.route('/menu/:id')
  .put(adminController.updateGlobalMenu)
  .delete(adminController.deleteGlobalMenu);

// ORDERS
router.route('/orders')
  .get(adminController.getGlobalOrders);

router.route('/orders/:id')
  .get(adminController.getGlobalOrderById);

router.route('/orders/:id/status')
  .put(adminController.updateGlobalOrderStatus);

router.route('/orders/:id/receipt')
  .get(adminController.getGlobalOrderReceipt);

// REPORTS
router.get('/reports/sales', adminController.getGlobalSales);
router.get('/reports/top-items', adminController.getGlobalTopItems);

module.exports = router;
