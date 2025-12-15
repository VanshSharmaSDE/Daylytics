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
const { startAutoArchiveScheduler } = require('./services/autoArchive');
const mongoose = require('mongoose');

const app = express();

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://daylytics.onrender.com'
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

const url = process.env.BACKEND_URL;
const interval = 600000; 

//Pinging server
function reloadWebsite() {
  axios.get(url)
    .then(response => {
      // Server pinged successfully
    })
    .catch(error => {
      // Error pinging server
    });
}

setInterval(reloadWebsite, interval);

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/archive', archiveRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/folders', folderRoutes);

// Simple health route
app.get('/api/health', (req, res) => res.json({ status: 'ok', now: new Date().toISOString() }));

const PORT = process.env.PORT || 5000;
mongoose.connection.on('connected', () => {});
mongoose.connection.on('error', (err) => {});

app.listen(PORT, () => {
    const state = mongoose.connection.readyState;
    const stateText = state === 1 ? 'connected' : state === 2 ? 'connecting' : state === 0 ? 'disconnected' : 'unknown';
    
    // Start auto-archive scheduler after server starts
    startAutoArchiveScheduler();
});
