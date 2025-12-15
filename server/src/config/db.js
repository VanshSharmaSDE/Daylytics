const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/daylytics';
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  } catch (err) {
    process.exit(1);
  }
};

module.exports = connectDB;
