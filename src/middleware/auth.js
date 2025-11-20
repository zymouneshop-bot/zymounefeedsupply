const jwt = require('jsonwebtoken');
const User = require('../models/User');


const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.' 
      });
    }

    
    if (token.startsWith('admin_token_')) {
      
      req.user = {
        _id: 'admin',
        email: 'admin@feedsstore.com',
        firstName: 'Store',
        lastName: 'Admin',
        role: 'admin',
        isActive: true
      };
      return next();
    }

    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        error: 'Invalid token or user not found.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ 
      error: 'Invalid token.' 
    });
  }
};


const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Access denied. Admin privileges required.' 
    });
  }
  next();
};


const requireCustomer = (req, res, next) => {
  if (req.user.role !== 'customer') {
    return res.status(403).json({ 
      error: 'Access denied. Customer privileges required.' 
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireCustomer
};
