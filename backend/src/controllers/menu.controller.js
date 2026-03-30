const MenuItem = require('../models/menuItemModel');

const buildMenuPayload = (body = {}) => {
  const payload = {};

  if (Object.prototype.hasOwnProperty.call(body, 'name')) {
    payload.name = typeof body.name === 'string' ? body.name.trim() : body.name;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'description')) {
    payload.description = typeof body.description === 'string' ? body.description.trim() : '';
  }

  if (Object.prototype.hasOwnProperty.call(body, 'price')) {
    payload.price = Number(body.price);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'category')) {
    payload.category = typeof body.category === 'string' ? body.category.trim() : body.category;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'isAvailable')) {
    payload.isAvailable = body.isAvailable === false ? false : Boolean(body.isAvailable);
  }

  if (Object.prototype.hasOwnProperty.call(body, 'imageUrl')) {
    payload.imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : '';
  }

  if (Object.prototype.hasOwnProperty.call(body, 'prepTime')) {
    if (body.prepTime === '' || body.prepTime === null || body.prepTime === undefined) {
      payload.prepTime = undefined;
    } else {
      payload.prepTime = Number(body.prepTime);
    }
  }

  return payload;
};

const validateMenuPayload = (payload) => {
  if (!payload.name) {
    return 'Menu item name is required';
  }

  if (!payload.category) {
    return 'Category is required';
  }

  if (Number.isNaN(payload.price) || payload.price <= 0) {
    return 'Price must be greater than 0';
  }

  if (payload.prepTime !== undefined && (Number.isNaN(payload.prepTime) || payload.prepTime <= 0)) {
    return 'Prep time must be greater than 0';
  }

  return null;
};

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

    const payload = buildMenuPayload(req.body);
    const validationError = validateMenuPayload(payload);

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const newMenuItem = new MenuItem({
      ...payload,
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
    const menuItem = await MenuItem.findOne({ _id: req.params.id, restaurantId });

    if (!menuItem) return res.status(404).json({ success: false, message: 'Menu item not found or access denied' });

    const payload = buildMenuPayload({ ...menuItem.toObject(), ...req.body });
    const validationError = validateMenuPayload(payload);

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    menuItem.name = payload.name;
    menuItem.description = payload.description;
    menuItem.price = payload.price;
    menuItem.category = payload.category;
    menuItem.isAvailable = payload.isAvailable;
    menuItem.imageUrl = payload.imageUrl;
    menuItem.prepTime = payload.prepTime;

    await menuItem.save();
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
