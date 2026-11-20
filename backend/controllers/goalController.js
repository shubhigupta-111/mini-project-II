const Goal = require('../models/Goal');

// @desc    Get all study goals for logged in student
// @route   GET /api/goals
// @access  Private
exports.getGoals = async (req, res) => {
  try {
    const { category, status } = req.query;
    let query = { user: req.user._id };

    if (category && category !== 'all') {
      query.category = category;
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    const goals = await Goal.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: goals.length,
      data: goals
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new goal
// @route   POST /api/goals
// @access  Private
exports.createGoal = async (req, res) => {
  try {
    const { title, category, targetHours, completedHours, deadline, description } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Please provide a goal title' });
    }

    const goal = await Goal.create({
      user: req.user._id,
      title,
      category: category || 'Weekly',
      targetHours: targetHours || 5,
      completedHours: completedHours || 0,
      deadline: deadline || null,
      description: description || '',
      status: 'In Progress'
    });

    res.status(201).json({
      success: true,
      message: 'Goal created successfully',
      data: goal
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a goal
// @route   PUT /api/goals/:id
// @access  Private
exports.updateGoal = async (req, res) => {
  try {
    let goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    const { title, category, targetHours, completedHours, deadline, description, status } = req.body;

    goal.title = title ?? goal.title;
    goal.category = category ?? goal.category;
    goal.targetHours = targetHours !== undefined ? Number(targetHours) : goal.targetHours;
    goal.completedHours = completedHours !== undefined ? Number(completedHours) : goal.completedHours;
    goal.deadline = deadline ?? goal.deadline;
    goal.description = description ?? goal.description;

    if (status) {
      goal.status = status;
    } else if (goal.completedHours >= goal.targetHours) {
      goal.status = 'Completed';
    } else {
      goal.status = 'In Progress';
    }

    await goal.save();

    res.status(200).json({
      success: true,
      message: 'Goal updated successfully',
      data: goal
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Log / increment study hours on a goal
// @route   PATCH /api/goals/:id/log-hours
// @access  Private
exports.logHours = async (req, res) => {
  try {
    const { hours } = req.body;
    const increment = Number(hours) || 1;

    let goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    goal.completedHours = Math.max(0, goal.completedHours + increment);
    if (goal.completedHours >= goal.targetHours) {
      goal.status = 'Completed';
    }

    await goal.save();

    res.status(200).json({
      success: true,
      message: `Logged ${increment} hours towards goal!`,
      data: goal
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a goal
// @route   DELETE /api/goals/:id
// @access  Private
exports.deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    await goal.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Goal deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
