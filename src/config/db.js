const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      autoIndex: true,
      maxPoolSize: 50, // Maintain up to 50 active socket connections for concurrent requests
      minPoolSize: 10, // Maintain at least 10 hot standby connections to eliminate handshake lag
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    });
    console.log(`[Database] MongoDB Connected (Pool Size: 50): ${conn.connection.host} / ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
