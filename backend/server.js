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

// Rate limiting temporarily disabled to troubleshoot CORS issues
// TODO: Re-enable rate limiting after CORS issues are resolved
console.log('⚠️  Rate limiting is currently DISABLED for troubleshooting');

// Commented out rate limiting code
/*
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.floor((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
});

if (process.env.NODE_ENV === 'production') {
  app.use('/api/', limiter);
}
*/

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
const allowedOrigins = [
  'https://mama-care-2m7mq1hws-talent5s-projects.vercel.app', // Your current Vercel frontend
  'https://mama-care-git-master-talent5s-projects.vercel.app/',
  'https://mama-care-talent5s-projects.vercel.app/',
  'https://mama-care-p2miylqnd-talent5s-projects.vercel.app/', // Potential production domain
  'http://localhost:3000', // React dev server
  'http://localhost:3001', // Alternative React port
  'http://localhost:5173', // Vite dev server
  'https://localhost:5173', // Vite dev server (HTTPS)
  'http://localhost:8081', // Expo dev server
  'http://127.0.0.1:3000', // Localhost alternative
  'http://127.0.0.1:5173', // Localhost alternative for Vite
  'http://127.0.0.1:8081', // Localhost alternative for Expo
  'http://192.168.0.49:3000', // Local network access
  'http://192.168.0.49:5173', // Local network access for Vite
  'http://192.168.0.49:8081', // Local network access for Expo
  'http://10.0.2.2:5173', // Android emulator
  'http://10.0.2.2:3000', // Android emulator
  'https://yourdomain.com' // Placeholder for your custom domain
];

// Add environment variable origins if available
if (process.env.CORS_ORIGINS) {
  allowedOrigins.push(...process.env.CORS_ORIGINS.split(','));
}

const corsOriginFunction = (origin, callback) => {
  console.log(`🌐 [CORS] Request from origin: ${origin || 'no-origin'}`);
  
  // Allow requests with no origin (like mobile apps, Postman, etc.)
  if (!origin) {
    console.log(`✅ [CORS] Allowing request with no origin`);
    return callback(null, true);
  }
  
  // Check if origin is in allowed list
  if (allowedOrigins.includes(origin)) {
    console.log(`✅ [CORS] Allowing origin: ${origin}`);
    return callback(null, true);
  }
  
  // In development, allow all localhost and local network origins
  if (process.env.NODE_ENV !== 'production') {
    // Allow any localhost with any port
    if (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:') ||
        origin.startsWith('http://127.0.0.1:') || origin.startsWith('https://127.0.0.1:')) {
      console.log(`✅ [CORS] Allowing localhost origin in development: ${origin}`);
      return callback(null, true);
    }
    
    // Allow local network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
    const localNetworkRegex = /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.).+/;
    if (localNetworkRegex.test(origin)) {
      console.log(`✅ [CORS] Allowing local network origin in development: ${origin}`);
      return callback(null, true);
    }
    
    // Allow Expo development URLs
    if (origin.includes('exp://') || origin.includes('expo://')) {
      console.log(`✅ [CORS] Allowing Expo origin in development: ${origin}`);
      return callback(null, true);
    }
  }
  
  console.log(`❌ [CORS] Rejecting origin: ${origin}`);
  callback(new Error('Not allowed by CORS'), false);
};

app.use(cors({
  origin: corsOriginFunction,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Additional CORS headers middleware for extra compatibility
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Log all requests for debugging
  console.log(`🌐 [REQUEST] ${req.method} ${req.path} from origin: ${origin || 'no-origin'}`);
  
  // Check if origin should be allowed
  let allowOrigin = false;
  
  if (origin) {
    // Check against allowed origins list
    if (allowedOrigins.includes(origin)) {
      allowOrigin = true;
    }
    // In development, allow localhost and local network origins
    else if (process.env.NODE_ENV !== 'production') {
      if (origin.startsWith('http://localhost:') || origin.startsWith('https://localhost:') ||
          origin.startsWith('http://127.0.0.1:') || origin.startsWith('https://127.0.0.1:')) {
        allowOrigin = true;
      }
      
      // Allow local network IPs
      const localNetworkRegex = /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.).+/;
      if (localNetworkRegex.test(origin)) {
        allowOrigin = true;
      }
      
      // Allow Expo development URLs
      if (origin.includes('exp://') || origin.includes('expo://')) {
        allowOrigin = true;
      }
    }
  }
  
  // Set CORS headers based on origin check
  if (allowOrigin && origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // For requests without origin (mobile apps, etc.)
    res.header('Access-Control-Allow-Origin', '*');
  }
  
  // Set other CORS headers
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS,HEAD');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`✅ [PREFLIGHT] Handled for ${origin || 'no-origin'} to ${req.path}`);
    res.status(204).end();
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
