const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menu.controller');
const verifyToken = require('../middleware/auth.middleware');
const { verifyRole } = require('../middleware/role.middleware');

router.use(verifyToken);

// Anyone in the restaurant (staff or owner) can view the menu
router.get('/', menuController.getMenu);

// Only Owners can manage the menu
router.post('/', verifyRole(['owner']), menuController.createMenuItem);
router.put('/:id', verifyRole(['owner']), menuController.updateMenuItem);
router.delete('/:id', verifyRole(['owner']), menuController.deleteMenuItem);

module.exports = router;
