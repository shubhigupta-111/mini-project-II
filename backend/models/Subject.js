const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: [true, 'Please provide subject name'],
      trim: true,
      maxlength: [100, 'Subject name cannot exceed 100 characters']
    },
    code: {
      type: String,
      trim: true,
      uppercase: true,
      default: 'SUB101'
    },
    instructor: {
      type: String,
      trim: true,
      default: 'Faculty'
    },
    color: {
      type: String,
      default: '#4F46E5' // Default indigo
    },
    targetHoursPerWeek: {
      type: Number,
      default: 6,
      min: 1,
      max: 40
    },
    credits: {
      type: Number,
      default: 3,
      min: 1,
      max: 10
    },
    description: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Subject', subjectSchema);
