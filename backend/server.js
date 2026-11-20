const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const seedDatabase = require('./utils/seedData');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Serve Frontend Static Files
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/subjects', require('./routes/subjectRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/goals', require('./routes/goalRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// Demo / Seed Database Endpoint (for easy evaluation & testing)
app.post('/api/seed', async (req, res) => {
  try {
    const result = await seedDatabase();
    res.status(200).json({
      success: true,
      message: 'Demo dataset created successfully! You can login with email: alex.student@college.edu and password: password123',
      credentials: {
        email: 'alex.student@college.edu',
        password: 'password123'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to seed database: ' + error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Student Study Planner & Progress Tracker API'
  });
});

// Fallback to frontend index.html for non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// 404 Handler for undefined API routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.originalUrl}`
  });
});

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('Server Unhandled Error:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Student Study Planner Server running on port ${PORT}`);
  console.log(`🌐 Website URL: http://localhost:${PORT}`);
  console.log(`📚 API Endpoint: http://localhost:${PORT}/api`);
  console.log(`=======================================================`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Error: ${err.message}`);
});
