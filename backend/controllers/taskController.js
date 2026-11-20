const Task = require('../models/Task');
const Subject = require('../models/Subject');

// @desc    Get all study tasks with filtering & sorting
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    const { subject, priority, status, search, date, range } = req.query;

    let query = { user: req.user._id };

    if (subject && subject !== 'all') {
      query.subject = subject;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    if (status && status !== 'all') {
      if (status === 'Overdue') {
        query.status = 'Pending';
        query.dueDate = { $lt: new Date() };
      } else {
        query.status = status;
      }
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (date) {
      const targetDate = new Date(date);
      const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
      query.dueDate = { $gte: startOfDay, $lte: endOfDay };
    }

    if (range === 'today') {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      query.dueDate = { $gte: start, $lte: end };
    } else if (range === 'upcoming') {
      const now = new Date();
      query.dueDate = { $gte: now };
    }

    const tasks = await Task.find(query)
      .populate('subject', 'name code color')
      .sort({ dueDate: 1, priority: -1 });

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id }).populate('subject');
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new study task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res) => {
  try {
    const { title, subject, description, dueDate, dueTime, priority, estimatedHours } = req.body;

    if (!title || !subject || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide task title, subject, and due date'
      });
    }

    // Verify subject belongs to user
    const subjectExists = await Subject.findOne({ _id: subject, user: req.user._id });
    if (!subjectExists) {
      return res.status(404).json({ success: false, message: 'Invalid subject selected' });
    }

    const task = await Task.create({
      user: req.user._id,
      subject,
      title,
      description: description || '',
      dueDate,
      dueTime: dueTime || '23:59',
      priority: priority || 'Medium',
      estimatedHours: estimatedHours || 2,
      status: 'Pending'
    });

    const populatedTask = await Task.findById(task._id).populate('subject', 'name code color');

    res.status(201).json({
      success: true,
      message: 'Task added successfully',
      data: populatedTask
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a study task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    let task = await Task.findOne({ _id: req.params.id, user: req.user._id });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const { title, subject, description, dueDate, dueTime, priority, estimatedHours, status } = req.body;

    if (subject && subject !== task.subject.toString()) {
      const subjectExists = await Subject.findOne({ _id: subject, user: req.user._id });
      if (!subjectExists) {
        return res.status(404).json({ success: false, message: 'Invalid subject selected' });
      }
      task.subject = subject;
    }

    task.title = title ?? task.title;
    task.description = description ?? task.description;
    task.dueDate = dueDate ?? task.dueDate;
    task.dueTime = dueTime ?? task.dueTime;
    task.priority = priority ?? task.priority;
    task.estimatedHours = estimatedHours ?? task.estimatedHours;

    if (status && status !== task.status) {
      task.status = status;
      task.completedAt = status === 'Completed' ? new Date() : null;
    }

    await task.save();

    const populated = await Task.findById(task._id).populate('subject', 'name code color');

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: populated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle task completion status
// @route   PATCH /api/tasks/:id/toggle
// @access  Private
exports.toggleTaskStatus = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    task.status = newStatus;
    task.completedAt = newStatus === 'Completed' ? new Date() : null;

    await task.save();

    const populated = await Task.findById(task._id).populate('subject', 'name code color');

    res.status(200).json({
      success: true,
      message: `Task marked as ${newStatus}`,
      data: populated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a study task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user._id });

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    await task.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
