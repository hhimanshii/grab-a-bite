const Order = require('../models/orderModel');
const PDFDocument = require('pdfkit');

// Helper to generate a unique order number
const generateOrderNumber = async (restaurantId) => {
    // Basic logic: "ORD-" + timestamp for simplicity. 
    // In production, might want a sequence counter.
    return `ORD-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
};

// ---------------- ORDERS ----------------
exports.getOrders = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    if (!restaurantId) return res.status(403).json({ success: false, message: 'Not linked to a restaurant' });

    // Extract potential filters
    const { status, date, staffId } = req.query;
    
    let query = { restaurantId };
    
    if (status) query.status = status;
    if (staffId) query.userId = staffId;
    
    // date filter (assuming YYYY-MM-DD)
    if (date) {
        const start = new Date(date);
        start.setUTCHours(0,0,0,0);
        const end = new Date(date);
        end.setUTCHours(23,59,59,999);
        query.createdAt = { $gte: start, $lte: end };
    }

    const orders = await Order.find(query).populate('userId', 'name').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createOrder = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    if (!restaurantId) return res.status(403).json({ success: false, message: 'Not linked to a restaurant' });

    const orderNumber = await generateOrderNumber(restaurantId);

    const newOrder = new Order({
      ...req.body,
      orderNumber,
      restaurantId,
      userId: req.user.id // Staff who created the order
    });

    const order = await newOrder.save();
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const { status } = req.body;

    let updateFields = { status };
    if (status === 'completed') updateFields.completedAt = Date.now();
    if (status === 'cancelled') updateFields.cancelledAt = Date.now();

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, restaurantId },
      updateFields,
      { new: true, runValidators: true }
    );

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrderById = async (req, res) => {
    try {
        const restaurantId = req.user.restaurantId;
        const order = await Order.findOne({ _id: req.params.id, restaurantId })
            .populate('userId', 'name')
            .populate('restaurantId', 'name address'); // useful for receipt

        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        res.status(200).json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.generateReceipt = async (req, res) => {
    try {
        let order;
        // If superadmin, bypass restaurantId check
        if (req.user.role === 'superadmin') {
           order = await Order.findById(req.params.id)
            .populate('userId', 'name')
            .populate('restaurantId', 'name address');
        } else {
           const restaurantId = req.user.restaurantId;
           order = await Order.findOne({ _id: req.params.id, restaurantId })
            .populate('userId', 'name')
            .populate('restaurantId', 'name address');
        }

        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        // Generate PDF using pdfkit
        const doc = new PDFDocument({ margin: 50 });
        
        // Set up the response to serve a PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=receipt-${order.orderNumber}.pdf`);
        
        doc.pipe(res);
        
        // Header
        doc.fontSize(20).text(order.restaurantId?.name || 'Grab-A-Bite', { align: 'center' });
        doc.moveDown(0.5);
        doc.fontSize(10).text(`Order #${order.orderNumber}`, { align: 'center' });
        doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`, { align: 'center' });
        doc.text(`Type: ${order.orderType?.toUpperCase() || 'N/A'}`, { align: 'center' });
        doc.moveDown(2);
        
        // Items Table Header
        doc.fontSize(12).text('Item', 50, doc.y, { continued: true });
        doc.text('Qty', 300, doc.y, { continued: true });
        doc.text('Price', 400, doc.y, { continued: true });
        doc.text('Total', 500, doc.y);
        doc.moveDown(0.5);
        
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);
        
        // Items
        order.items.forEach(item => {
            const itemTotal = item.price * item.quantity;
            doc.text(item.name || 'Unknown Item', 50, doc.y, { continued: true });
            doc.text(item.quantity.toString(), 300, doc.y, { continued: true });
            doc.text(`$${item.price.toFixed(2)}`, 400, doc.y, { continued: true });
            doc.text(`$${itemTotal.toFixed(2)}`, 500, doc.y);
        });
        
        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Totals
        doc.fontSize(14).text(`Total Amount: $${order.totalAmount.toFixed(2)}`, { align: 'right' });
        
        doc.moveDown(2);
        doc.fontSize(10).text('Thank you for dining with us!', { align: 'center' });
        
        // Finalize PDF
        doc.end();

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
