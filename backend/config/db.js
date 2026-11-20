const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student_study_planner');
    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error('👉 Please make sure MongoDB service is running (or check your MONGODB_URI).');
    // Don't kill process immediately in dev so informative error messages can be returned
  }
};

module.exports = connectDB;
