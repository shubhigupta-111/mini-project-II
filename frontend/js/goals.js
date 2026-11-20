/**
 * Student Study Planner - Goals and Reminders Logic
 */

let allGoals = [];
let editingGoalId = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;

  loadGoalsAndReminders();
  setupGoalForm();
});

async function loadGoalsAndReminders() {
  try {
    const [goalsRes, tasksRes] = await Promise.all([
      apiRequest('/goals'),
      apiRequest('/tasks')
    ]);

    allGoals = goalsRes.data || [];
    renderGoals(allGoals);

    const tasks = tasksRes.data || [];
    renderReminders(tasks);
  } catch (err) {
    showToast('Failed to load goals & reminders: ' + err.message, 'error');
  }
}

// Render Goals Cards
function renderGoals(goals) {
  const container = document.getElementById('goals-grid');
  if (!container) return;

  if (goals.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <i class="fa-solid fa-bullseye empty-icon"></i>
        <h3 class="empty-title">No Study Goals Set</h3>
        <p class="empty-text">Set daily study targets or weekly milestones to stay disciplined and track your academic progress.</p>
        <button class="btn btn-primary" onclick="openAddGoalModal()">
          <i class="fa-solid fa-plus"></i> Set Your First Goal
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = goals
    .map((goal) => {
      const pct = goal.progressPercentage || Math.min(100, Math.round(((goal.completedHours || 0) / (goal.targetHours || 1)) * 100));
      const isCompleted = goal.status === 'Completed' || pct >= 100;

      const categoryBadge =
        goal.category === 'Daily'
          ? '<span class="badge badge-priority-medium">Daily Target</span>'
          : goal.category === 'Weekly'
          ? '<span class="badge badge-priority-low">Weekly Target</span>'
          : '<span class="badge" style="background:#F5F3FF; color:#7C3AED;">Semester Target</span>';

      return `
        <div class="card goal-card ${isCompleted ? 'goal-completed' : ''}">
          <div class="goal-card-header">
            ${categoryBadge}
            <div class="goal-actions">
              <button class="btn-icon" title="Edit Goal" onclick="openEditGoalModal('${goal._id}')">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button class="btn-icon delete-icon" title="Delete Goal" onclick="confirmDeleteGoal('${goal._id}', '${escapeHtml(goal.title)}')">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>

          <h3 class="goal-title">${escapeHtml(goal.title)}</h3>
          ${goal.description ? `<p class="goal-desc">${escapeHtml(goal.description)}</p>` : ''}

          <div class="goal-progress-wrap">
            <div class="goal-hours-row">
              <span class="hours-logged"><strong>${goal.completedHours || 0}</strong> / ${goal.targetHours} hours logged</span>
              <span class="pct-badge" style="color: ${isCompleted ? 'var(--success)' : 'var(--primary)'}; font-weight: 700;">
                ${pct}%
              </span>
            </div>
            <div class="progress-container" style="height: 10px;">
              <div class="progress-bar" style="width: ${pct}%; background: ${isCompleted ? 'var(--success)' : 'linear-gradient(90deg, #4F46E5, #8B5CF6)'};"></div>
            </div>
          </div>

          <div class="goal-footer">
            ${
              goal.deadline
                ? `<span class="goal-deadline"><i class="fa-regular fa-clock"></i> Target: ${formatDate(goal.deadline)}</span>`
                : '<span></span>'
            }
            ${
              !isCompleted
                ? `
                  <div class="log-quick-buttons">
                    <button class="btn btn-secondary btn-sm" onclick="logStudyHours('${goal._id}', 1)" title="Add 1 hour">
                      +1h
                    </button>
                    <button class="btn btn-outline-primary btn-sm" onclick="logStudyHours('${goal._id}', 2)" title="Add 2 hours">
                      +2h
                    </button>
                  </div>
                `
                : `<span class="badge badge-status-completed"><i class="fa-solid fa-circle-check"></i> Goal Achieved</span>`
            }
          </div>
        </div>
      `;
    })
    .join('');
}

// Log Hours Incrementally
async function logStudyHours(goalId, hours) {
  try {
    const res = await apiRequest(`/goals/${goalId}/log-hours`, {
      method: 'PATCH',
      body: JSON.stringify({ hours })
    });
    showToast(res.message || 'Study hours logged!', 'success');
    loadGoalsAndReminders();
  } catch (err) {
    showToast(err.message || 'Failed to log hours', 'error');
  }
}

// Render Urgent Reminders Section
function renderReminders(tasks) {
  const container = document.getElementById('reminders-list');
  if (!container) return;

  const now = new Date();
  const next48Hours = new Date(Date.now() + 48 * 60 * 60 * 1000);

  // Filter tasks that are overdue or due within 48 hours and pending
  const pendingTasks = tasks.filter((t) => t.status === 'Pending');
  const overdueTasks = pendingTasks.filter((t) => new Date(t.dueDate) < now);
  const urgentTasks = pendingTasks.filter((t) => {
    const d = new Date(t.dueDate);
    return d >= now && d <= next48Hours;
  });

  const reminders = [...overdueTasks, ...urgentTasks];

  if (reminders.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 24px;">
        <i class="fa-solid fa-bell-slash empty-icon" style="font-size: 2rem; color: #10B981;"></i>
        <h4 class="empty-title">No Urgent Reminders</h4>
        <p class="empty-text">You are on top of your study schedule! No pending assignments are overdue or approaching within 48 hours.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = reminders
    .map((task) => {
      const isOverdue = new Date(task.dueDate) < now;
      const subjColor = task.subject?.color || '#4F46E5';
      const subjName = task.subject?.name || 'Subject';

      return `
        <div class="reminder-card ${isOverdue ? 'reminder-overdue' : 'reminder-urgent'}">
          <div class="reminder-icon-box">
            <i class="fa-solid ${isOverdue ? 'fa-triangle-exclamation' : 'fa-clock'}"></i>
          </div>
          <div class="reminder-details">
            <div class="reminder-title-row">
              <span class="reminder-task-title">${escapeHtml(task.title)}</span>
              <span class="badge ${isOverdue ? 'badge-status-overdue' : 'badge-priority-high'}">
                ${isOverdue ? 'OVERDUE' : 'DUE SOON'}
              </span>
            </div>
            <div class="reminder-meta-row">
              <span class="subject-tag-pill" style="color: ${subjColor}; font-weight: 600;">
                <i class="fa-solid fa-book"></i> ${escapeHtml(subjName)}
              </span>
              <span><i class="fa-regular fa-calendar"></i> ${formatDate(task.dueDate)} at ${formatTime(task.dueTime)}</span>
              <span><i class="fa-solid fa-fire" style="color: var(--danger);"></i> Priority: ${task.priority}</span>
            </div>
          </div>
          <div class="reminder-action">
            <a href="planner.html" class="btn btn-secondary btn-sm">View in Planner</a>
          </div>
        </div>
      `;
    })
    .join('');
}

// Setup Goal Form & Modals
function setupGoalForm() {
  const form = document.getElementById('goal-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('goal-title').value.trim();
    const category = document.getElementById('goal-category').value;
    const targetHours = document.getElementById('goal-target-hours').value;
    const completedHours = document.getElementById('goal-completed-hours').value || 0;
    const deadline = document.getElementById('goal-deadline').value;
    const description = document.getElementById('goal-desc').value.trim();

    if (!title || !targetHours) {
      showToast('Please provide goal title and target hours', 'error');
      return;
    }

    try {
      const payload = {
        title,
        category,
        targetHours: Number(targetHours),
        completedHours: Number(completedHours),
        deadline: deadline || null,
        description
      };

      if (editingGoalId) {
        await apiRequest(`/goals/${editingGoalId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showToast('Study goal updated!', 'success');
      } else {
        await apiRequest('/goals', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showToast('Study goal created!', 'success');
      }

      closeModal('goalModal');
      form.reset();
      editingGoalId = null;
      loadGoalsAndReminders();
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    }
  });
}

function openAddGoalModal() {
  editingGoalId = null;
  const form = document.getElementById('goal-form');
  if (form) form.reset();
  document.getElementById('goal-modal-title').textContent = 'Set New Study Goal';
  openModal('goalModal');
}

function openEditGoalModal(id) {
  const goal = allGoals.find((g) => g._id === id);
  if (!goal) return;

  editingGoalId = id;
  document.getElementById('goal-modal-title').textContent = 'Edit Study Goal';
  document.getElementById('goal-title').value = goal.title || '';
  document.getElementById('goal-category').value = goal.category || 'Weekly';
  document.getElementById('goal-target-hours').value = goal.targetHours || 5;
  document.getElementById('goal-completed-hours').value = goal.completedHours || 0;
  if (goal.deadline) {
    const d = new Date(goal.deadline);
    document.getElementById('goal-deadline').value = d.toISOString().split('T')[0];
  }
  document.getElementById('goal-desc').value = goal.description || '';

  openModal('goalModal');
}

async function confirmDeleteGoal(id, title) {
  if (confirm(`Delete goal "${title}"?`)) {
    try {
      await apiRequest(`/goals/${id}`, { method: 'DELETE' });
      showToast('Goal removed', 'info');
      loadGoalsAndReminders();
    } catch (err) {
      showToast(err.message || 'Failed to delete goal', 'error');
    }
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
