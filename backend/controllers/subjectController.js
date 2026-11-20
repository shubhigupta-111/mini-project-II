const Subject = require('../models/Subject');
const Task = require('../models/Task');

// @desc    Get all subjects for current student with task statistics
// @route   GET /api/subjects
// @access  Private
exports.getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ user: req.user._id }).sort({ createdAt: -1 });

    // Enhance subjects with task metrics
    const enhancedSubjects = await Promise.all(
      subjects.map(async (subj) => {
        const totalTasks = await Task.countDocuments({ subject: subj._id });
        const completedTasks = await Task.countDocuments({ subject: subj._id, status: 'Completed' });
        const pendingTasks = totalTasks - completedTasks;
        const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          ...subj.toObject(),
          totalTasks,
          completedTasks,
          pendingTasks,
          progressPercentage
        };
      })
    );

    res.status(200).json({
      success: true,
      count: enhancedSubjects.length,
      data: enhancedSubjects
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single subject
// @route   GET /api/subjects/:id
// @access  Private
exports.getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, user: req.user._id });
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }
    res.status(200).json({ success: true, data: subject });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new subject
// @route   POST /api/subjects
// @access  Private
exports.createSubject = async (req, res) => {
  try {
    const { name, code, instructor, color, targetHoursPerWeek, credits, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Please provide subject name' });
    }

    const subject = await Subject.create({
      user: req.user._id,
      name,
      code: code || 'CS101',
      instructor: instructor || '',
      color: color || '#4F46E5',
      targetHoursPerWeek: targetHoursPerWeek || 6,
      credits: credits || 3,
      description: description || ''
    });

    res.status(201).json({
      success: true,
      message: 'Subject added successfully',
      data: subject
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a subject
// @route   PUT /api/subjects/:id
// @access  Private
exports.updateSubject = async (req, res) => {
  try {
    let subject = await Subject.findOne({ _id: req.params.id, user: req.user._id });

    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    const { name, code, instructor, color, targetHoursPerWeek, credits, description } = req.body;

    subject.name = name ?? subject.name;
    subject.code = code ?? subject.code;
    subject.instructor = instructor ?? subject.instructor;
    subject.color = color ?? subject.color;
    subject.targetHoursPerWeek = targetHoursPerWeek ?? subject.targetHoursPerWeek;
    subject.credits = credits ?? subject.credits;
    subject.description = description ?? subject.description;

    const updatedSubject = await subject.save();

    res.status(200).json({
      success: true,
      message: 'Subject updated successfully',
      data: updatedSubject
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a subject
// @route   DELETE /api/subjects/:id
// @access  Private
exports.deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findOne({ _id: req.params.id, user: req.user._id });

    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    // Cascade delete related tasks
    await Task.deleteMany({ subject: subject._id, user: req.user._id });

    await subject.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Subject and related tasks deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
