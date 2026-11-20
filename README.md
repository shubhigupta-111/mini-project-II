# 🎓 Student Study Planner & Progress Tracker

A modern, responsive, full-stack student productivity web application designed to help college students organize daily study schedules, manage academic courses, set milestone goals, prioritize assignments, and monitor overall academic progress with real-time visual charts.

Built with **HTML5, CSS3, JavaScript, Node.js, Express.js, MongoDB, and Chart.js**. Suitable for a **B.Tech Computer Science & Engineering Mini-Project Demonstration**.

---

## 🌟 Key Modules & Features

### 1. 🔐 Student Authentication & Profiles
- **Student Registration:** Sign up with name, college email, university/college, major/branch, semester, and password.
- **Secure Authentication:** Passwords hashed with `bcryptjs` (salt rounds: 10) and authenticated via **JSON Web Tokens (JWT)**.
- **Student Profile Management:** Edit academic details, current semester, and daily study target hours.
- **Password Updates:** Secure password modification with current password verification.
- **Instant Demo Login:** Built-in "Try Demo Student Account" button for immediate viva demonstration.

### 2. 📊 Interactive Student Dashboard
- **4 Primary Metric Cards:** Total Enrolled Subjects, Total Study Tasks, Completed Assignments, and Active/Pending Tasks.
- **Today's Study Schedule:** Interactive to-do list for the current day with real-time checkbox toggles.
- **Weekly Study Activity Chart:** Real-time Chart.js bar chart displaying study hours logged across the last 7 days.
- **Upcoming Deadlines Widget:** Immediate visibility into approaching due dates and exam timelines.
- **Active Study Goals Widget:** Progress bars tracking daily and weekly milestones.
- **Quick Task Modal:** Add a new study task from any screen with a single click.

### 3. 📚 Subject & Course Management
- **Full CRUD Support:** Add, edit, delete, and view academic courses.
- **Course Attributes:** Subject name, course code (e.g. `CS301`), faculty instructor, weekly study target hours, credit points, and syllabus descriptions.
- **Color-Coded Badges:** 8 vibrant subject color tags applied consistently across the planner, calendar, and charts.
- **Subject Progress Tracking:** Automatic calculation of completed vs. pending tasks per course.
- **Direct Link to Tasks:** 1-click navigation from any subject card to its filtered study tasks in the planner.

### 4. 📝 Study Planner & Task Management
- **Comprehensive Task Creation:** Title, course selection, due date, due time, priority (High, Medium, Low), and estimated study hours.
- **Real-Time Checkbox Toggling:** Mark tasks completed/pending with instant UI updates and timestamp logging.
- **Search & Multi-Filtering:**
  - Search by keyword in task title or description (with debounce).
  - Filter by Subject/Course.
  - Filter by Priority (High, Medium, Low).
  - Filter by Status (Pending, Completed, Overdue).
- **Overdue Detection:** Visual red alert badges on overdue assignments.

### 5. 📅 Monthly Interactive Calendar
- **Full Monthly Grid:** Clean 7-column calendar view with weekday headers.
- **Month Navigation:** Previous/Next month controls and a quick "Today" shortcut.
- **Plotted Task Chips:** Visual study badges plotted on their exact due dates with subject color tags and completion status.
- **Day Detail Popover:** Click any day cell to view all scheduled tasks for that day, toggle statuses, or schedule a new task.

### 6. 📈 Academic Progress Tracker & Analytics
- **Visual Analytics with Chart.js:**
  - **Weekly Study Activity Bar Chart:** Hours studied day-by-day.
  - **Subject Distribution Doughnut Chart:** Breakdown of study tasks per subject.
  - **Priority Breakdown Chart:** Distribution of High, Medium, and Low priority items.
- **Subject-Wise Progress Breakdown:** Course-by-course progress bars with percentage indicators, task counts, and target study hours.
- **Overall Completion Percentage:** Radial progress display summarizing overall semester workload.

### 7. 🎯 Goals and Urgent Reminders
- **Study Goals (Daily, Weekly, Semester):** Define target study hours and track completed hours with percentage progress bars.
- **1-Click Hour Logging:** Quick `+1h` and `+2h` buttons to log study time without opening forms.
- **Urgent & Overdue Reminders Section:** Automatic warnings for tasks that are overdue or due within the next 48 hours.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend** | HTML5, CSS3 (Modern Flexbox & CSS Grid), JavaScript (Vanilla ES6+), Chart.js v4.4, Font Awesome 6.5, Google Fonts (Inter) |
| **Backend** | Node.js (v18+ / v20+ / v24+), Express.js 4.x REST API |
| **Database** | MongoDB & Mongoose ODM 8.x |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs` password encryption |
| **Utilities** | CORS, Morgan HTTP logger, Dotenv |

---

## 📂 Complete Folder Structure

```
student-study-planner/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection logic
│   ├── controllers/
│   │   ├── authController.js     # User registration, login, profile, password
│   │   ├── subjectController.js  # Subject CRUD operations
│   │   ├── taskController.js     # Task CRUD, filters, search, toggle
│   │   ├── goalController.js     # Goal CRUD & log-hours logic
│   │   └── analyticsController.js# Dashboard statistics & Chart.js data
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT token verification
│   ├── models/
│   │   ├── User.js               # Student user schema
│   │   ├── Subject.js            # Academic subject schema
│   │   ├── Task.js               # Study task schema
│   │   └── Goal.js               # Study goal schema
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth endpoints
│   │   ├── subjectRoutes.js      # /api/subjects endpoints
│   │   ├── taskRoutes.js         # /api/tasks endpoints
│   │   ├── goalRoutes.js         # /api/goals endpoints
│   │   └── analyticsRoutes.js   # /api/analytics endpoints
│   ├── utils/
│   │   └── seedData.js           # B.Tech demo dataset generator
│   ├── .env                      # Environment configuration
│   ├── .env.example              # Example environment template
│   ├── package.json              # Backend dependencies and scripts
│   └── server.js                 # Express server & static frontend host
│
├── frontend/
│   ├── css/
│   │   ├── styles.css            # Core design system (Indigo, Purple, White)
│   │   ├── auth.css              # Landing page and auth form styles
│   │   └── responsive.css        # Mobile, tablet, and desktop media queries
│   ├── js/
│   │   ├── api.js                # Central API client, JWT management & toasts
│   │   ├── auth.js               # Login, register, and demo account handling
│   │   ├── dashboard.js          # Dashboard metrics, today's schedule, charts
│   │   ├── subjects.js           # Subject cards, color swatches, CRUD
│   │   ├── planner.js            # Task filtering, priority, search, CRUD
│   │   ├── calendar.js           # Monthly interactive calendar & popovers
│   │   ├── progress.js           # Chart.js analytics & subject progress
│   │   ├── goals.js              # Goals, +1h quick logging, urgent reminders
│   │   └── profile.js            # Profile editing & demo data reset
│   │
│   ├── index.html                # 1. Landing / Home Page
│   ├── login.html                # 2. Student Login Page
│   ├── register.html             # 3. Student Registration Page
│   ├── dashboard.html            # 4. Student Dashboard
│   ├── subjects.html             # 5. My Subjects Management
│   ├── planner.html              # 6. Study Planner & Task Backlog
│   ├── calendar.html             # 7. Monthly Study Calendar
│   ├── progress.html             # 8. Progress Tracker & Analytics
│   ├── goals.html                # 9. Goals & Urgent Reminders
│   └── profile.html              # 10. Student Profile & Settings
│
└── README.md                     # Project documentation & viva guide
```

---

## 🚀 Setup & Execution Guide (VS Code)

### Step 1: Open the Project in VS Code
1. Launch **Visual Studio Code**.
2. Go to **File -> Open Folder...** and select:
   `student-study-planner`
3. Open the integrated terminal (`Ctrl + ~` or **Terminal -> New Terminal**).

### Step 2: Ensure MongoDB is Running
Make sure MongoDB is installed and running locally:
- On Windows: Run `net start MongoDB` in an Administrator terminal or check `services.msc` to ensure **MongoDB Server** is "Running".
- Default connection URL: `mongodb://127.0.0.1:27017/student_study_planner` (already configured in `backend/.env`).
- Alternatively, you can use **MongoDB Atlas** by replacing `MONGODB_URI` in `backend/.env` with your cloud connection string.

### Step 3: Install Backend Dependencies
In the VS Code terminal:
```bash
cd backend
npm install
```

### Step 4: Populate Demo Data (Optional but Recommended)
To immediately populate sample B.Tech subjects, tasks, and goals:
```bash
npm run seed
```

### Step 5: Start the Application
Run the backend server:
```bash
npm start
```

You should see:
```text
=======================================================
🚀 Student Study Planner Server running on port 5000
🌐 Website URL: http://localhost:5000
📚 API Endpoint: http://localhost:5000/api
=======================================================
✅ MongoDB Connected: 127.0.0.1/student_study_planner
```

### Step 6: Access the Application
Open your web browser and navigate to:
👉 **`http://localhost:5000`**

---

## 🔑 Demo Account Credentials

For instant demonstration without manual registration:
- **Email:** `alex.student@college.edu`
- **Password:** `password123`
- *Or simply click the **"Try Demo Student Account"** button on the Login page.*

---

## 📡 REST API Reference

### Authentication Endpoints (`/api/auth`)
- `POST /api/auth/register` - Create a new student account.
- `POST /api/auth/login` - Authenticate student & receive JWT token.
- `GET /api/auth/me` - Get profile of the logged-in student (Protected).
- `PUT /api/auth/profile` - Update student profile (Protected).
- `PUT /api/auth/change-password` - Change password (Protected).

### Subject Endpoints (`/api/subjects`)
- `GET /api/subjects` - Get all courses with task counts (Protected).
- `POST /api/subjects` - Add a new course (Protected).
- `GET /api/subjects/:id` - Get course by ID (Protected).
- `PUT /api/subjects/:id` - Update course (Protected).
- `DELETE /api/subjects/:id` - Delete course and cascade delete its tasks (Protected).

### Task Endpoints (`/api/tasks`)
- `GET /api/tasks` - List tasks with query filters (`?subject=ID&priority=High&status=Pending&search=keyword`) (Protected).
- `POST /api/tasks` - Create a new study task (Protected).
- `GET /api/tasks/:id` - Get single task (Protected).
- `PUT /api/tasks/:id` - Update task (Protected).
- `PATCH /api/tasks/:id/toggle` - Toggle between `Pending` and `Completed` (Protected).
- `DELETE /api/tasks/:id` - Delete task (Protected).

### Goal Endpoints (`/api/goals`)
- `GET /api/goals` - Get study goals (Protected).
- `POST /api/goals` - Create a goal (Protected).
- `PUT /api/goals/:id` - Update goal (Protected).
- `PATCH /api/goals/:id/log-hours` - Log study hours incrementally (Protected).
- `DELETE /api/goals/:id` - Delete goal (Protected).

### Analytics Endpoints (`/api/analytics`)
- `GET /api/analytics/dashboard` - Get metric card counts, today's schedule, weekly chart data, and upcoming deadlines (Protected).
- `GET /api/analytics/progress` - Get subject-wise progress meters, priority distribution, and goals summary (Protected).

---

## 🎓 College Viva / Project Presentation Q&A

**Q1: What is the main objective of this project?**
> **Answer:** To provide college students with a centralized productivity dashboard to organize their semester courses, schedule study tasks, track assignment deadlines, set study targets, and monitor their academic progress through visual Chart.js charts.

**Q2: Why did you choose Node.js, Express, and MongoDB?**
> **Answer:** Node.js and Express offer an asynchronous, event-driven RESTful architecture ideal for real-time task management. MongoDB is a schema-flexible document database that naturally models nested and relational structures like student subjects, tasks, and goals using Mongoose references.

**Q3: How is student authentication secured?**
> **Answer:** Passwords are never stored in plain text; they are salted and hashed using `bcryptjs`. Upon authentication, the server issues a signed JSON Web Token (JWT) with an expiration period, which the frontend stores and attaches as a `Bearer` token in the `Authorization` header for all protected API calls.

**Q4: How does the application calculate progress statistics?**
> **Answer:** The `/api/analytics/dashboard` and `/api/analytics/progress` endpoints perform aggregation queries across MongoDB collections to calculate completed vs. total tasks per subject and overall, compute completion percentages, and group completed study hours over the previous 7 days for the Chart.js visualizer.

**Q5: How does the system handle responsive design?**
> **Answer:** The frontend uses modern CSS Flexbox and CSS Grid layouts combined with responsive breakpoints (`@media (max-width: 1024px)` and `@media (max-width: 768px)`). On mobile devices, the desktop sidebar transforms into an off-canvas drawer toggled via a hamburger menu.
