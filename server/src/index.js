require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const axios = require('axios');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const archiveRoutes = require('./routes/archive');
const fileRoutes = require('./routes/files');
const folderRoutes = require('./routes/folders');
const bucketRoutes = require('./routes/bucket');
const storageRoutes = require('./routes/storage');
const { startAutoArchiveScheduler } = require('./services/autoArchive');
const mongoose = require('mongoose');

const app = express();

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://daylyticsv1.onrender.com'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

connectDB();

// Keep-alive ping for free tier hosting (only ping if URL is set)
const url = process.env.BACKEND_URL;
if (url) {
  const interval = 600000; // 10 minutes
  setInterval(() => {
    axios.get(`${url}/api/health`)
      .then(() => console.log('Keep-alive ping successful'))
      .catch(err => console.log('Keep-alive ping failed:', err.message));
  }, interval);
  console.log('Keep-alive pinger started');
}

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/archive', archiveRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/bucket', bucketRoutes);
app.use('/api/storage', storageRoutes);

// Health check endpoints
app.get('/', (req, res) => res.json({ 
  status: 'ok', 
  message: 'Daylytics API is running',
  version: '1.7.9',
  timestamp: new Date().toISOString() 
}));

app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  res.json({ 
    status: dbState === 1 ? 'ok' : 'degraded',
    database: dbState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString() 
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    const state = mongoose.connection.readyState;
    const stateText = state === 1 ? 'connected' : state === 2 ? 'connecting' : state === 0 ? 'disconnected' : 'unknown';
    console.log(`MongoDB status: ${stateText}`);
    
    // Start auto-archive scheduler after server starts
    if (state === 1) {
      startAutoArchiveScheduler();
      console.log('Auto-archive scheduler started');
    } else {
      console.log('Waiting for MongoDB connection to start scheduler...');
      mongoose.connection.once('connected', () => {
        startAutoArchiveScheduler();
        console.log('Auto-archive scheduler started');
      });
    }
});
