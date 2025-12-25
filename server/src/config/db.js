const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/daylytics';
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✓ MongoDB Connected');
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message);
    // Don't exit immediately, let Render handle restart
    setTimeout(() => process.exit(1), 1000);
  }
};

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err.message);
});

module.exports = connectDB;
