const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const Subject = require('../models/Subject');
const Task = require('../models/Task');
const Goal = require('../models/Goal');

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student_study_planner';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
    console.log('🌱 Seeding database...');

    // Clear existing demo student if exists
    const demoEmail = 'alex.student@college.edu';
    let demoUser = await User.findOne({ email: demoEmail });
    if (demoUser) {
      await Task.deleteMany({ user: demoUser._id });
      await Subject.deleteMany({ user: demoUser._id });
      await Goal.deleteMany({ user: demoUser._id });
      await User.deleteOne({ _id: demoUser._id });
    }

    // Create demo student
    demoUser = await User.create({
      name: 'Alex Johnson',
      email: demoEmail,
      password: 'password123',
      college: 'Apex Institute of Technology',
      major: 'B.Tech Computer Science & Engineering',
      semester: 'Semester 6',
      targetDailyHours: 5
    });

    console.log(`👤 Created Demo User: ${demoUser.name} (${demoUser.email})`);

    // Create realistic subjects
    const subjectsData = [
      {
        user: demoUser._id,
        name: 'Data Structures & Algorithms',
        code: 'CS301',
        instructor: 'Dr. Robert Miller',
        color: '#4F46E5', // Indigo
        targetHoursPerWeek: 8,
        credits: 4,
        description: 'Binary trees, graphs, dynamic programming, and algorithm complexity.'
      },
      {
        user: demoUser._id,
        name: 'Database Management Systems',
        code: 'CS302',
        instructor: 'Prof. Anita Sharma',
        color: '#06B6D4', // Cyan
        targetHoursPerWeek: 6,
        credits: 3,
        description: 'Relational algebra, SQL, indexing, transaction management, and NoSQL.'
      },
      {
        user: demoUser._id,
        name: 'Operating Systems',
        code: 'CS303',
        instructor: 'Dr. Alan Vance',
        color: '#8B5CF6', // Purple
        targetHoursPerWeek: 6,
        credits: 4,
        description: 'Process scheduling, deadlocks, virtual memory management, and file systems.'
      },
      {
        user: demoUser._id,
        name: 'Computer Networks',
        code: 'CS304',
        instructor: 'Prof. Rajesh K.',
        color: '#10B981', // Emerald green
        targetHoursPerWeek: 5,
        credits: 3,
        description: 'OSI & TCP/IP stack, routing protocols, socket programming, and network security.'
      },
      {
        user: demoUser._id,
        name: 'Full Stack Web Development',
        code: 'CS305',
        instructor: 'Prof. Clara Higgins',
        color: '#F59E0B', // Amber
        targetHoursPerWeek: 7,
        credits: 3,
        description: 'MERN Stack development, REST APIs, responsive UI design, and cloud deployment.'
      }
    ];

    const subjects = await Subject.insertMany(subjectsData);
    console.log(`📚 Created ${subjects.length} Subjects`);

    // Helper dates
    const today = new Date();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const dayAfterTomorrow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const inThreeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    const inFiveDays = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const lastWeek = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

    // Create Tasks
    const tasksData = [
      {
        user: demoUser._id,
        subject: subjects[0]._id, // DSA
        title: 'Revise Graph Traversal (BFS & DFS)',
        description: 'Practice LeetCode medium questions on topological sort and shortest path.',
        dueDate: today,
        dueTime: '17:00',
        priority: 'High',
        estimatedHours: 2.5,
        status: 'Pending'
      },
      {
        user: demoUser._id,
        subject: subjects[1]._id, // DBMS
        title: 'Complete B+ Tree Indexing Assignment',
        description: 'Solve questions 4-10 from chapter 14 and verify query performance.',
        dueDate: today,
        dueTime: '20:30',
        priority: 'High',
        estimatedHours: 2.0,
        status: 'Pending'
      },
      {
        user: demoUser._id,
        subject: subjects[4]._id, // Web Dev
        title: 'Build Express JWT Auth Middleware',
        description: 'Implement token verification, role checking, and cookie handling.',
        dueDate: yesterday,
        dueTime: '18:00',
        priority: 'Medium',
        estimatedHours: 3.0,
        status: 'Completed',
        completedAt: yesterday
      },
      {
        user: demoUser._id,
        subject: subjects[2]._id, // OS
        title: 'Study Banker Algorithm for Deadlock Avoidance',
        description: 'Work through 3 matrix allocation numerical problems for internal test.',
        dueDate: tomorrow,
        dueTime: '15:00',
        priority: 'Medium',
        estimatedHours: 2.0,
        status: 'Pending'
      },
      {
        user: demoUser._id,
        subject: subjects[3]._id, // Networks
        title: 'Prepare Presentation on TCP vs UDP',
        description: 'Create 10 slides covering 3-way handshake, congestion control, and use cases.',
        dueDate: dayAfterTomorrow,
        dueTime: '11:00',
        priority: 'Low',
        estimatedHours: 1.5,
        status: 'Pending'
      },
      {
        user: demoUser._id,
        subject: subjects[0]._id, // DSA
        title: 'Dynamic Programming - Knapsack Problem',
        description: 'Analyze 0/1 knapsack, unbounded knapsack, and space optimization technique.',
        dueDate: inThreeDays,
        dueTime: '19:00',
        priority: 'High',
        estimatedHours: 3.0,
        status: 'Pending'
      },
      {
        user: demoUser._id,
        subject: subjects[1]._id, // DBMS
        title: 'Normalization Practice (1NF to BCNF)',
        description: 'Deconstruct unnormalized functional dependencies and identify candidate keys.',
        dueDate: lastWeek,
        dueTime: '16:00',
        priority: 'Medium',
        estimatedHours: 2.0,
        status: 'Completed',
        completedAt: lastWeek
      },
      {
        user: demoUser._id,
        subject: subjects[4]._id, // Web Dev
        title: 'Design Responsive Student Dashboard UI',
        description: 'Use CSS Grid and Flexbox for modern sidebar, metric cards, and charts.',
        dueDate: today,
        dueTime: '22:00',
        priority: 'High',
        estimatedHours: 3.5,
        status: 'Completed',
        completedAt: today
      },
      {
        user: demoUser._id,
        subject: subjects[2]._id, // OS
        title: 'Virtual Memory Paging Numerical Questions',
        description: 'Calculate page fault frequency and effective memory access time.',
        dueDate: inFiveDays,
        dueTime: '14:00',
        priority: 'Low',
        estimatedHours: 1.5,
        status: 'Pending'
      }
    ];

    const tasks = await Task.insertMany(tasksData);
    console.log(`📝 Created ${tasks.length} Study Tasks`);

    // Create Goals
    const goalsData = [
      {
        user: demoUser._id,
        title: 'Master Dynamic Programming & Graph Theory',
        category: 'Weekly',
        targetHours: 12,
        completedHours: 8,
        deadline: inFiveDays,
        description: 'Complete 15 medium problems on LeetCode/CodeChef.',
        status: 'In Progress'
      },
      {
        user: demoUser._id,
        title: 'Daily DBMS & OS Revision',
        category: 'Daily',
        targetHours: 4,
        completedHours: 3,
        deadline: today,
        description: 'Review previous lecture notes and make formula flashcards.',
        status: 'In Progress'
      },
      {
        user: demoUser._id,
        title: 'Full Stack MERN Mini-Project Submission',
        category: 'Weekly',
        targetHours: 15,
        completedHours: 15,
        deadline: dayAfterTomorrow,
        description: 'Complete all CRUD features, charts, and presentation documentation.',
        status: 'Completed'
      },
      {
        user: demoUser._id,
        title: 'Maintain Minimum 8.5 SGPA This Semester',
        category: 'Semester',
        targetHours: 80,
        completedHours: 54,
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        description: 'Attend all lab sessions, submit projects on time, and ace mid-terms.',
        status: 'In Progress'
      }
    ];

    const goals = await Goal.insertMany(goalsData);
    console.log(`🎯 Created ${goals.length} Goals`);

    console.log('🎉 Database Seeding Complete!');
    return { demoUser, subjects, tasks, goals };
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    throw error;
  }
};

// Execute if run directly via `node seedData.js`
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Done! Press Ctrl+C to exit.');
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = seedDatabase;
