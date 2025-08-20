import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Basic authentication middleware
export const auth = async (req, res, next) => {
  try {
    // Skip authentication for OPTIONS requests
    if (req.method === 'OPTIONS') {
      return next();
    }

    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }

    req.user = { 
      id: user._id, 
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email
    };
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};

// Admin authentication middleware (system_admin only)
export const adminAuth = (req, res, next) => {
  // Skip authentication for OPTIONS requests
  if (req.method === 'OPTIONS') {
    return next();
  }
  
  if (req.user && req.user.role === 'system_admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. System admin privileges required.'
    });
  }
};

// Healthcare provider authentication middleware (doctor and nurse)
export const providerAuth = (req, res, next) => {
  if (req.user && ['doctor', 'nurse', 'system_admin'].includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Healthcare provider privileges required.'
    });
  }
};

// Ministry official authentication middleware
export const ministryAuth = (req, res, next) => {
  if (req.user && ['ministry_official', 'system_admin'].includes(req.user.role)) {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Ministry official privileges required.'
    });
  }
};

// Multi-role authentication middleware
export const roleAuth = (...roles) => {
  return (req, res, next) => {
    // Skip authentication for OPTIONS requests
    if (req.method === 'OPTIONS') {
      return next();
    }
    
    if (req.user && (roles.includes(req.user.role) || req.user.role === 'system_admin')) {
      next();
    } else {
      res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}`
      });
    }
  };
};
