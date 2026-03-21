const MenuItem = require('../models/menuItemModel');

// ---------------- MENU ----------------
exports.getMenu = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    if (!restaurantId) return res.status(403).json({ success: false, message: 'Not linked to a restaurant' });

    // Both staff and owners can view the menu
    const menuItems = await MenuItem.find({ restaurantId }).sort({ category: 1 });
    res.status(200).json({ success: true, count: menuItems.length, data: menuItems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createMenuItem = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    if (!restaurantId) return res.status(403).json({ success: false, message: 'Not linked to a restaurant' });

    // owners only (via route middleware)
    const newMenuItem = new MenuItem({
      ...req.body,
      restaurantId
    });

    const menuItem = await newMenuItem.save();
    res.status(201).json({ success: true, data: menuItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateMenuItem = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;

    const menuItem = await MenuItem.findOneAndUpdate(
      { _id: req.params.id, restaurantId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!menuItem) return res.status(404).json({ success: false, message: 'Menu item not found or access denied' });
    res.status(200).json({ success: true, data: menuItem });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteMenuItem = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;

    const menuItem = await MenuItem.findOneAndDelete({ _id: req.params.id, restaurantId });
    if (!menuItem) return res.status(404).json({ success: false, message: 'Menu item not found or access denied' });
    
    res.status(200).json({ success: true, message: 'Menu item deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
