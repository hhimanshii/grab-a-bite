const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const verifyToken = require('../middleware/auth.middleware');
const { verifyRole } = require('../middleware/role.middleware');

router.use(verifyToken);
router.use(verifyRole(['owner']));

// GET /api/reports/sales
router.get('/sales', reportController.getSales);

// GET /api/reports/top-items
router.get('/top-items', reportController.getTopItems);

// GET /api/reports/staff
router.get('/staff', reportController.getStaffPerformance);

module.exports = router;
