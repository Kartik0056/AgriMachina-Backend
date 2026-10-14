const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');

const env = require('./config/env');
const connectDB = require('./config/db');
const bootstrapAdminSystem = require('./services/adminBootstrapService');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS setup
const configuredOrigins = (env.CLIENT_URL || '')
  .split(',')
  .map(url => url.trim().replace(/\/$/, ''))
  .filter(Boolean);

const defaultOrigins = [
  'https://agri-machina-frontend.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://localhost:4173'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, curl, server-to-server, Render health checks)
    if (!origin) return callback(null, true);
    if (
      configuredOrigins.includes(origin) ||
      defaultOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.onrender.com') ||
      origin.endsWith('.netlify.app') ||
      env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Request logger
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body & Cookie parsers
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(cookieParser());

// Static file serving for uploaded media
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Root endpoint (Fixes 404 on Render root ping & direct URL access)
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'AgriMachina E-Commerce API is live and running 🚜',
    environment: env.NODE_ENV,
    health: '/api/health',
    timestamp: new Date()
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    system: 'Agricultural E-Commerce & Admin CMS API',
    timestamp: new Date()
  });
});

// API Routes
app.use('/api', routes);

// Global Error Handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // 1. Connect MongoDB
    await connectDB();

    // 2. Run first-run admin bootstrap check
    await bootstrapAdminSystem();

    // 3. Listen on port
    const PORT = env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`[Server] Agricultural E-Commerce API running on port ${PORT} (${env.NODE_ENV})`);
      console.log(`[Server] Client Origin: ${env.CLIENT_URL}`);
    });
  } catch (error) {
    console.error(`[Server Launch Error] ${error.message}`);
    process.exit(1);
  }
};

startServer();

module.exports = app;
