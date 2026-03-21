const jwt = require('jsonwebtoken');

// NOTE: Ensure you have created a 'token.secret' in your .env file before running this.
const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-change-me';

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Extract token from "Bearer <token>"

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access Denied. No token provided.' 
});
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach user data to the request object so Controllers can use it
    req.user = decoded; 
    req.userId = decoded.id; 
    
    next(); // Move to the next middleware or route handler
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

module.exports = verifyToken;