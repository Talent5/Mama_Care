import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import fileUpload from 'express-fileupload';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import patientRoutes from './routes/patients.js';
import appointmentRoutes from './routes/appointments.js';
import analyticsRoutes from './routes/analytics.js';
import adminRoutes from './routes/admin.js';
import securityRoutes from './routes/security.js';
import alertRoutes from './routes/alerts.js';
import settingsRoutes from './routes/settings.js';
import dashboardRoutes from './routes/dashboard.js';
import activityRoutes from './routes/activity.js';
import medicalRecordsRoutes from './routes/medical-records.js';
import billingRoutes from './routes/billing.js';
import telemedicineRoutes from './routes/telemedicine.js';
import initPregnancyScheduler from './jobs/pregnancyScheduler.js';
import reminderScheduler from './services/reminderScheduler.js';
import patientAssignmentRoutes from './routes/patient-assignment.js';
import notificationRoutes from './routes/notifications.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting for production
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.floor((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// More lenient rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Allow 20 login attempts per 15 minutes
  message: {
    error: 'Too many login attempts, please try again later.',
    retryAfter: 900 // 15 minutes
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes
if (process.env.NODE_ENV === 'production') {
  // Apply more lenient rate limiting to auth endpoints
  app.use('/api/auth', authLimiter);
  
  // Apply general rate limiting to other routes
  app.use('/api/', (req, res, next) => {
    // Skip auth endpoints as they have their own limiter
    if (req.path.startsWith('/auth/')) {
      return next();
    }
    return limiter(req, res, next);
  });
} else {
  // In development, apply very lenient rate limiting
  const devLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 1000, // Very high limit for development
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', devLimiter);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    memory: process.memoryUsage(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  };
  
  res.json(healthStatus);
});

// Apply CORS middleware with production configuration
const corsOrigins = process.env.NODE_ENV === 'production' 
  ? (process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['https://yourdomain.com'])
  : true; // Allow all origins in development

// Custom CORS origin function for more flexible matching
const corsOriginFunction = (origin, callback) => {
  // Allow requests with no origin (like mobile apps, Expo Go, etc.)
  if (!origin) return callback(null, true);
  
  // In development, allow all origins
  if (process.env.NODE_ENV !== 'production') {
    return callback(null, true);
  }
  
  // In production, be more permissive for now to fix the immediate issue
  // You can tighten this later once everything is working
  if (process.env.NODE_ENV === 'production') {
    // Always allow your Render deployment domains
    if (origin.includes('mama-care') && origin.includes('onrender.com')) {
      return callback(null, true);
    }
    
    // Allow your admin dashboard domains
    if (origin.includes('mamacare-admin') && origin.includes('onrender.com')) {
      return callback(null, true);
    }
  }
  
  // Check if origin is in explicitly allowed origins
  if (Array.isArray(corsOrigins) && corsOrigins.includes(origin)) {
    return callback(null, true);
  }
  
  // Allow Vercel preview deployments for your project
  if (origin.includes('talent5s-projects.vercel.app') || 
      (origin.includes('mama-care') && origin.includes('vercel.app'))) {
    return callback(null, true);
  }
  
  // Allow localhost and local development IPs (for mobile apps)
  if (origin.includes('localhost') || 
      origin.includes('127.0.0.1') || 
      origin.includes('10.0.2.2') ||
      /^https?:\/\/192\.168\.\d+\.\d+/.test(origin) ||
      /^https?:\/\/10\.\d+\.\d+\.\d+/.test(origin) ||
      /^https?:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+/.test(origin)) {
    return callback(null, true);
  }
  
  // Allow Expo development servers and mobile app origins
  if (origin.includes('expo.dev') || 
      origin.includes('exp.host') ||
      origin.startsWith('exp://') ||
      origin.startsWith('exps://')) {
    return callback(null, true);
  }
  
  console.log(`🚫 [CORS] Blocked origin: ${origin}`);
  console.log(`🔍 [DEBUG] Available CORS origins:`, corsOrigins);
  console.log(`🔍 [DEBUG] Environment:`, process.env.NODE_ENV);
  callback(new Error('Not allowed by CORS'));
};

app.use(cors({
  origin: corsOriginFunction,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Additional CORS headers middleware for all environments (more permissive for mobile apps)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Log CORS requests for debugging
  if (origin) {
    console.log(`🌐 [CORS] Request from origin: ${origin}`);
  } else {
    console.log(`🌐 [CORS] Request with no origin (likely mobile app)`);
  }
  
  // Set CORS headers more explicitly for production issues
  if (origin) {
    // In production, be more specific about allowed origins
    if (process.env.NODE_ENV === 'production') {
      if (origin.includes('mama-care') && origin.includes('onrender.com')) {
        res.header('Access-Control-Allow-Origin', origin);
      } else if (origin.includes('mamacare-admin') && origin.includes('onrender.com')) {
        res.header('Access-Control-Allow-Origin', origin);
      } else if (origin.includes('localhost')) {
        res.header('Access-Control-Allow-Origin', origin);
      }
    } else {
      // In development, allow all origins
      res.header('Access-Control-Allow-Origin', origin);
    }
  } else {
    // For requests without origin (mobile apps), allow them
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  // Set additional headers for better compatibility
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`✅ [CORS] Preflight request handled for ${origin || 'no-origin'}`);
    res.status(200).end();
    return;
  }
  
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// File upload middleware
app.use(fileUpload({
  createParentPath: true,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB max file size
  },
  abortOnLimit: true
}));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients/assignment', patientAssignmentRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin/security', securityRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/dashboard', activityRoutes);
app.use('/api/medical-records', medicalRecordsRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/telemedicine', telemedicineRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'MamaCare API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found'
  });
});

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mamacare');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

// Create uploads directory structure
import fs from 'fs';
import path from 'path';

const createUploadDirs = () => {
  const dirs = ['uploads', 'uploads/profile-photos', 'uploads/reports'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Start server
const startServer = async () => {
  await connectDB();
  createUploadDirs();
  // Initialize background jobs
  try {
    initPregnancyScheduler(console);
    await reminderScheduler.initialize();
  } catch (e) {
    console.warn('Failed to initialize background services:', e?.message || e);
  }
  
  // Bind to all network interfaces (0.0.0.0) so mobile devices can connect
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MamaCare Backend Server running on port ${PORT}`);
    console.log(`Local access: http://localhost:${PORT}/api/health`);
    console.log(`Network access: http://192.168.0.49:${PORT}/api/health`);
    console.log(`Mobile device access: Use your computer's IP address`);
  });
};

startServer();

export default app;
