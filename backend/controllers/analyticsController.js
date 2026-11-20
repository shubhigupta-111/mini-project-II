const Subject = require('../models/Subject');
const Task = require('../models/Task');
const Goal = require('../models/Goal');

// @desc    Get dashboard summary statistics & chart datasets
// @route   GET /api/analytics/dashboard
// @access  Private
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Basic metrics
    const totalSubjects = await Subject.countDocuments({ user: userId });
    const totalTasks = await Task.countDocuments({ user: userId });
    const completedTasks = await Task.countDocuments({ user: userId, status: 'Completed' });
    const pendingTasks = await Task.countDocuments({ user: userId, status: 'Pending' });

    const now = new Date();
    const overdueTasks = await Task.countDocuments({
      user: userId,
      status: 'Pending',
      dueDate: { $lt: now }
    });

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // 2. Today's study schedule
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayTasks = await Task.find({
      user: userId,
      dueDate: { $gte: startOfToday, $lte: endOfToday }
    })
      .populate('subject', 'name code color')
      .sort({ dueTime: 1 });

    // 3. Weekly Activity Chart Data (last 7 days)
    const daysLabels = [];
    const dailyCompletedHours = [];
    const dailyCompletedTasksCount = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      daysLabels.push(dayName);

      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);

      // Tasks completed on this day or scheduled on this day that are completed
      const completedOnDay = await Task.find({
        user: userId,
        status: 'Completed',
        $or: [
          { completedAt: { $gte: dayStart, $lte: dayEnd } },
          { dueDate: { $gte: dayStart, $lte: dayEnd }, completedAt: { $exists: false } }
        ]
      });

      const hours = completedOnDay.reduce((acc, t) => acc + (t.estimatedHours || 1), 0);
      dailyCompletedHours.push(Number(hours.toFixed(1)));
      dailyCompletedTasksCount.push(completedOnDay.length);
    }

    // 4. Upcoming Deadlines (next 5 pending tasks)
    const upcomingDeadlines = await Task.find({
      user: userId,
      status: 'Pending',
      dueDate: { $gte: startOfToday }
    })
      .populate('subject', 'name code color')
      .sort({ dueDate: 1 })
      .limit(5);

    // 5. Active Goals
    const activeGoals = await Goal.find({ user: userId }).sort({ createdAt: -1 }).limit(4);

    res.status(200).json({
      success: true,
      stats: {
        totalSubjects,
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        completionRate,
        todayTasksCount: todayTasks.length
      },
      todaySchedule: todayTasks,
      weeklyChart: {
        labels: daysLabels,
        hours: dailyCompletedHours,
        taskCounts: dailyCompletedTasksCount
      },
      upcomingDeadlines,
      activeGoals
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get detailed progress breakdown (Subject-wise & Priority)
// @route   GET /api/analytics/progress
// @access  Private
exports.getProgressDetails = async (req, res) => {
  try {
    const userId = req.user._id;

    // Subjects breakdown
    const subjects = await Subject.find({ user: userId });
    const subjectProgress = await Promise.all(
      subjects.map(async (subj) => {
        const total = await Task.countDocuments({ subject: subj._id });
        const completed = await Task.countDocuments({ subject: subj._id, status: 'Completed' });
        const pending = total - completed;
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
          id: subj._id,
          name: subj.name,
          code: subj.code,
          color: subj.color,
          credits: subj.credits,
          targetHoursPerWeek: subj.targetHoursPerWeek,
          totalTasks: total,
          completedTasks: completed,
          pendingTasks: pending,
          progressPercentage: pct
        };
      })
    );

    // Priority breakdown
    const highPriority = await Task.countDocuments({ user: userId, priority: 'High', status: 'Pending' });
    const mediumPriority = await Task.countDocuments({ user: userId, priority: 'Medium', status: 'Pending' });
    const lowPriority = await Task.countDocuments({ user: userId, priority: 'Low', status: 'Pending' });

    // Goals breakdown
    const totalGoals = await Goal.countDocuments({ user: userId });
    const completedGoals = await Goal.countDocuments({ user: userId, status: 'Completed' });

    res.status(200).json({
      success: true,
      subjectProgress,
      priorityDistribution: {
        high: highPriority,
        medium: mediumPriority,
        low: lowPriority
      },
      goalsSummary: {
        total: totalGoals,
        completed: completedGoals,
        rate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
