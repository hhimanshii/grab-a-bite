const Order = require('../models/orderModel');

// ---------------- REPORTS (OWNER ONLY) ----------------

exports.getSales = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    if (!restaurantId) return res.status(403).json({ success: false, message: 'Not linked to a restaurant' });

    const { startDate, endDate } = req.query;
    
    let query = { restaurantId, status: 'completed' };
    
    // date filter
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const sales = await Order.aggregate([
      { $match: query },
      { $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalOrders: { $sum: 1 }
      }}
    ]);

    const result = sales.length > 0 ? sales[0] : { totalRevenue: 0, totalOrders: 0 };
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTopItems = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    if (!restaurantId) return res.status(403).json({ success: false, message: 'Not linked to a restaurant' });

    const { startDate, endDate, category } = req.query;
    
    let query = { restaurantId, status: 'completed' };
    
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    // Aggregation pipeline
    // Note: since category relies on matching MenuItem, we could lookup, but we just want to sort items by quantity. 
    // Wait, the spec says "filter by category". The Order schema only mapped Name and Price.
    // So to filter by category, we need to populate or lookup the MenuItem schema. 
    // Let's implement $lookup to join with MenuItems if category is provided.

    let pipeline = [
      { $match: query },
      { $unwind: "$items" },
      { $lookup: {
          from: "menuitems", // the collection name in MongoDB (usually lowercase plural)
          localField: "items.menuItemId",
          foreignField: "_id",
          as: "menuItemDetails"
        }
      },
      { $unwind: "$menuItemDetails" }
    ];

    if (category) {
        pipeline.push({
            $match: { "menuItemDetails.category": category }
        });
    }

    pipeline.push(
      { $group: {
          _id: "$items.name", // Group by the item name snapshot
          totalSold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } }
      }},
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    );

    const topItems = await Order.aggregate(pipeline);
    res.status(200).json({ success: true, data: topItems });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStaffPerformance = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    if (!restaurantId) return res.status(403).json({ success: false, message: 'Not linked to a restaurant' });

    const staffPerformance = await Order.aggregate([
      { $match: { restaurantId, status: 'completed' } },
      { $group: {
          _id: "$userId",
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" }
      }},
      { $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "staffDetails"
      }},
      { $unwind: "$staffDetails" },
      { $project: {
          staffName: "$staffDetails.name",
          role: "$staffDetails.role",
          totalOrders: 1,
          totalRevenue: 1
      }},
      { $sort: { totalOrders: -1 } }
    ]);

    res.status(200).json({ success: true, count: staffPerformance.length, data: staffPerformance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
