const verifyRole = (allowedRoles) => {
    return (req, res, next) => {
      const userRole = req.user?.role; // req.user is populated by auth.middleware.js
  
      // If user is not in the allowed roles list
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ 
          success: false, 
          message: `Access Denied. Role '${userRole}' is not authorized for this resource.` 
        });
      }
  
      // If role is allowed, proceed
      next();
    };
  };
  
  // Helper function to export common roles easily
  module.exports = {
    verifyRole,
    // Example usage export:
    // const isSuperAdmin = verifyRole(['superadmin']);
  };
  