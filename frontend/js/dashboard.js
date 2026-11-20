/**
 * Student Study Planner - Dashboard Logic
 */

let weeklyChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;

  loadDashboardData();
  setupQuickTaskModal();
});

async function loadDashboardData() {
  try {
    const data = await apiRequest('/analytics/dashboard');
    const { stats, todaySchedule, weeklyChart, upcomingDeadlines, activeGoals } = data;

    // 1. Populate Metric Cards
    document.getElementById('stat-total-subjects').textContent = stats.totalSubjects || 0;
    document.getElementById('stat-total-tasks').textContent = stats.totalTasks || 0;
    document.getElementById('stat-completed-tasks').textContent = stats.completedTasks || 0;
    document.getElementById('stat-pending-tasks').textContent = stats.pendingTasks || 0;

    const completionRateEl = document.getElementById('stat-completion-rate');
    if (completionRateEl) {
      completionRateEl.textContent = `${stats.completionRate || 0}% Completed`;
    }

    const overdueEl = document.getElementById('stat-overdue-tasks');
    if (overdueEl) {
      if (stats.overdueTasks > 0) {
        overdueEl.innerHTML = `<span class="badge badge-priority-high"><i class="fa-solid fa-triangle-exclamation"></i> ${stats.overdueTasks} Overdue</span>`;
      } else {
        overdueEl.textContent = 'All on track!';
      }
    }

    // 2. Render Today's Study Schedule
    renderTodaySchedule(todaySchedule);

    // 3. Render Weekly Activity Chart
    renderWeeklyChart(weeklyChart);

    // 4. Render Upcoming Deadlines
    renderUpcomingDeadlines(upcomingDeadlines);

    // 5. Render Active Goals
    renderActiveGoals(activeGoals);
  } catch (err) {
    showToast('Failed to load dashboard data: ' + err.message, 'error');
  }
}

// Render Today's Tasks
function renderTodaySchedule(tasks) {
  const container = document.getElementById('today-schedule-list');
  if (!container) return;

  if (!tasks || tasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 28px 16px;">
        <i class="fa-solid fa-mug-hot empty-icon" style="font-size: 2.2rem; color: #CBD5E1;"></i>
        <h4 class="empty-title" style="font-size: 1rem;">No study tasks scheduled for today</h4>
        <p class="empty-text" style="font-size: 0.82rem; margin-bottom: 14px;">Take a well-deserved break or add a new task to your planner.</p>
        <button class="btn btn-primary btn-sm" onclick="openQuickTaskModal()">
          <i class="fa-solid fa-plus"></i> Add Today's Task
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = tasks
    .map((task) => {
      const isDone = task.status === 'Completed';
      const subjColor = task.subject?.color || '#4F46E5';
      const subjName = task.subject?.name || 'General';

      const priorityBadge =
        task.priority === 'High'
          ? '<span class="badge badge-priority-high">High</span>'
          : task.priority === 'Medium'
          ? '<span class="badge badge-priority-medium">Medium</span>'
          : '<span class="badge badge-priority-low">Low</span>';

      return `
        <div class="task-item-card ${isDone ? 'completed-task' : ''}" id="task-item-${task._id}">
          <label class="custom-checkbox-wrap">
            <input type="checkbox" ${isDone ? 'checked' : ''} onchange="toggleTaskStatus('${task._id}')" />
            <span class="custom-checkmark"></span>
          </label>
          <div class="task-details">
            <div class="task-title-row">
              <span class="task-title ${isDone ? 'line-through' : ''}">${escapeHtml(task.title)}</span>
              <span class="subject-pill" style="border-left: 3px solid ${subjColor}; background: ${subjColor}15; color: ${subjColor};">
                ${escapeHtml(subjName)}
              </span>
            </div>
            <div class="task-meta-row">
              <span><i class="fa-regular fa-clock"></i> ${formatTime(task.dueTime)}</span>
              <span><i class="fa-solid fa-hourglass-half"></i> ${task.estimatedHours || 1} hrs</span>
              ${priorityBadge}
            </div>
          </div>
        </div>
      `;
    })
    .join('');
}

// Toggle Task Complete in Real-Time
async function toggleTaskStatus(taskId) {
  try {
    const res = await apiRequest(`/tasks/${taskId}/toggle`, { method: 'PATCH' });
    showToast(res.message || 'Task status updated', 'success');
    loadDashboardData(); // Refresh metrics and chart
  } catch (err) {
    showToast(err.message || 'Failed to update task', 'error');
  }
}

// Render Weekly Activity Bar Chart
function renderWeeklyChart(weeklyData) {
  const canvas = document.getElementById('weeklyActivityChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (weeklyChartInstance) {
    weeklyChartInstance.destroy();
  }

  const gradient = ctx.createLinearGradient(0, 0, 0, 260);
  gradient.addColorStop(0, 'rgba(79, 70, 229, 0.85)');
  gradient.addColorStop(1, 'rgba(139, 92, 246, 0.25)');

  weeklyChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: weeklyData.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'Study Hours Logged',
          data: weeklyData.hours || [0, 0, 0, 0, 0, 0, 0],
          backgroundColor: gradient,
          borderColor: '#4F46E5',
          borderWidth: 1.5,
          borderRadius: 8,
          borderSkipped: false,
          barPercentage: 0.55
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: '#0F172A',
          padding: 12,
          cornerRadius: 8,
          titleFont: { size: 13, weight: 'bold' },
          callbacks: {
            label: function (context) {
              return ` ${context.raw} Hours studied`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#64748B', font: { weight: '500' } }
        },
        y: {
          beginAtZero: true,
          grid: { color: '#F1F5F9' },
          ticks: {
            color: '#64748B',
            stepSize: 1,
            callback: function (val) {
              return val + 'h';
            }
          }
        }
      }
    }
  });
}

// Render Upcoming Deadlines List
function renderUpcomingDeadlines(tasks) {
  const container = document.getElementById('upcoming-deadlines-list');
  if (!container) return;

  if (!tasks || tasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 20px;">
        <p class="empty-text" style="font-size: 0.85rem; margin: 0;">No upcoming deadlines this week!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = tasks
    .map((task) => {
      const subjColor = task.subject?.color || '#4F46E5';
      const subjCode = task.subject?.code || 'SUB';
      return `
        <div class="deadline-item">
          <div class="deadline-badge" style="background: ${subjColor}20; color: ${subjColor};">
            ${escapeHtml(subjCode)}
          </div>
          <div class="deadline-details">
            <span class="deadline-title">${escapeHtml(task.title)}</span>
            <span class="deadline-date"><i class="fa-regular fa-calendar"></i> Due: ${formatDate(task.dueDate)} at ${formatTime(task.dueTime)}</span>
          </div>
          <span class="badge ${task.priority === 'High' ? 'badge-priority-high' : 'badge-priority-medium'}">
            ${task.priority}
          </span>
        </div>
      `;
    })
    .join('');
}

// Render Active Goals Cards
function renderActiveGoals(goals) {
  const container = document.getElementById('dashboard-goals-list');
  if (!container) return;

  if (!goals || goals.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 20px;">
        <p class="empty-text" style="font-size: 0.85rem; margin-bottom: 10px;">No goals defined yet.</p>
        <a href="goals.html" class="btn btn-secondary btn-sm"><i class="fa-solid fa-bullseye"></i> Set a Study Goal</a>
      </div>
    `;
    return;
  }

  container.innerHTML = goals
    .map((goal) => {
      const pct = goal.progressPercentage || Math.min(100, Math.round(((goal.completedHours || 0) / (goal.targetHours || 1)) * 100));
      return `
        <div class="goal-widget-card">
          <div class="goal-widget-header">
            <span class="goal-widget-title">${escapeHtml(goal.title)}</span>
            <span class="goal-widget-hours">${goal.completedHours || 0}/${goal.targetHours || 0} hrs</span>
          </div>
          <div class="progress-container" style="height: 6px; margin: 8px 0;">
            <div class="progress-bar" style="width: ${pct}%;"></div>
          </div>
          <div class="goal-widget-footer">
            <span class="badge ${pct === 100 ? 'badge-status-completed' : 'badge-priority-low'}">${goal.category}</span>
            <span style="font-size: 0.75rem; color: #64748B;">${pct}% complete</span>
          </div>
        </div>
      `;
    })
    .join('');
}

// Setup Quick Task Modal
async function setupQuickTaskModal() {
  const form = document.getElementById('quick-task-form');
  const subjectSelect = document.getElementById('quick-task-subject');

  // Load subjects for the dropdown
  try {
    const subjectsData = await apiRequest('/subjects');
    if (subjectSelect && subjectsData.data) {
      subjectSelect.innerHTML =
        '<option value="">-- Select Subject --</option>' +
        subjectsData.data
          .map((s) => `<option value="${s._id}">${escapeHtml(s.name)} (${s.code || ''})</option>`)
          .join('');
    }
  } catch (err) {
    console.error('Failed to load subjects for quick task:', err);
  }

  // Set default due date to today
  const dueDateInput = document.getElementById('quick-task-date');
  if (dueDateInput) {
    const todayStr = new Date().toISOString().split('T')[0];
    dueDateInput.value = todayStr;
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('quick-task-title').value.trim();
      const subject = document.getElementById('quick-task-subject').value;
      const dueDate = document.getElementById('quick-task-date').value;
      const dueTime = document.getElementById('quick-task-time').value || '23:59';
      const priority = document.getElementById('quick-task-priority').value || 'Medium';
      const estimatedHours = document.getElementById('quick-task-hours').value || 2;

      if (!title || !subject || !dueDate) {
        showToast('Please fill in title, subject and date', 'error');
        return;
      }

      try {
        await apiRequest('/tasks', {
          method: 'POST',
          body: JSON.stringify({
            title,
            subject,
            dueDate,
            dueTime,
            priority,
            estimatedHours: Number(estimatedHours)
          })
        });

        showToast('Task added successfully!', 'success');
        closeModal('quickTaskModal');
        form.reset();
        loadDashboardData();
      } catch (err) {
        showToast(err.message || 'Failed to add task', 'error');
      }
    });
  }
}

function openQuickTaskModal() {
  openModal('quickTaskModal');
}

// Helper to escape HTML to prevent XSS
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
