const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Please enter a goal title'],
      trim: true,
      maxlength: [150, 'Goal title cannot exceed 150 characters']
    },
    category: {
      type: String,
      enum: ['Daily', 'Weekly', 'Semester'],
      default: 'Weekly'
    },
    targetHours: {
      type: Number,
      required: [true, 'Please specify target study hours'],
      min: 1,
      max: 100,
      default: 5
    },
    completedHours: {
      type: Number,
      default: 0,
      min: 0
    },
    deadline: {
      type: Date
    },
    status: {
      type: String,
      enum: ['In Progress', 'Completed'],
      default: 'In Progress'
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

// Virtual for progress percentage
goalSchema.virtual('progressPercentage').get(function () {
  if (!this.targetHours || this.targetHours <= 0) return 0;
  const pct = Math.round((this.completedHours / this.targetHours) * 100);
  return Math.min(100, pct);
});

goalSchema.set('toJSON', { virtuals: true });
goalSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Goal', goalSchema);
