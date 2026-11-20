const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Please select a subject']
    },
    title: {
      type: String,
      required: [true, 'Please provide task title'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    dueDate: {
      type: Date,
      required: [true, 'Please select a due date']
    },
    dueTime: {
      type: String,
      default: '23:59'
    },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium'
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed'],
      default: 'Pending'
    },
    estimatedHours: {
      type: Number,
      default: 2,
      min: 0.5,
      max: 24
    },
    completedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Virtual for overdue check
taskSchema.virtual('isOverdue').get(function () {
  if (this.status === 'Completed') return false;
  const now = new Date();
  const due = new Date(this.dueDate);
  return due < now;
});

taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Task', taskSchema);
