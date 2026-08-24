require('dotenv').config();

const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGO_URI: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agricultural_ecom',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_production_jwt_key_agri_2026',
  ADMIN_JWT_SECRET: process.env.ADMIN_JWT_SECRET || 'super_secret_admin_jwt_key_portal_2026',
  ADMIN_PANEL_PATH: process.env.ADMIN_PANEL_PATH || '/secure-admin-portal',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@agrimachinery.com',
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'superadmin',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'AgriAdmin@2026#Secure',
  ADMIN_NAME: process.env.ADMIN_NAME || 'Master Agri Administrator',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || 'rzp_test_TSjrOFCBv53fsK',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || 'rhATHfy93s5sMhwreOL2zfYy'
};

module.exports = env;
