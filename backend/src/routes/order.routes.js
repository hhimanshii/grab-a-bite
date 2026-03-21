const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const verifyToken = require('../middleware/auth.middleware');
const { verifyRole } = require('../middleware/role.middleware');

router.use(verifyToken);

// GET /api/orders -> Owners can view all for their restaurant, Staff might view their own or all pending
// As per spec: "Order Routes (staff creates, owner views all)", but staff also completes orders
router.route('/')
  .get(verifyRole(['owner', 'manager', 'cashier', 'waiter']), orderController.getOrders)
  .post(verifyRole(['manager', 'cashier', 'waiter']), orderController.createOrder); // Staff creates

router.route('/:id')
  .get(verifyRole(['owner', 'manager', 'cashier', 'waiter']), orderController.getOrderById);

router.route('/:id/status')
  .put(verifyRole(['owner', 'manager', 'cashier', 'waiter']), orderController.updateOrderStatus);

router.route('/:id/receipt')
  .get(verifyRole(['owner', 'manager', 'cashier', 'waiter', 'superadmin']), orderController.generateReceipt);

module.exports = router;
