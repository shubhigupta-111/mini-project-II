/**
 * Student Study Planner - Study Planner / Task Management Logic
 */

let allTasks = [];
let allSubjects = [];
let editingTaskId = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;

  loadInitialData();
  setupFilterListeners();
  setupTaskForm();
});

async function loadInitialData() {
  try {
    // 1. Fetch subjects first to populate filter & modal selects
    const subjectsRes = await apiRequest('/subjects');
    allSubjects = subjectsRes.data || [];
    populateSubjectSelects(allSubjects);

    // 2. Check if URL has subject query param
    const urlParams = new URLSearchParams(window.location.search);
    const filterSubjectId = urlParams.get('subject');
    if (filterSubjectId) {
      const subjectFilter = document.getElementById('filter-subject');
      if (subjectFilter) subjectFilter.value = filterSubjectId;
    }

    // 3. Fetch tasks
    await loadTasks();
  } catch (err) {
    showToast('Failed to initialize planner: ' + err.message, 'error');
  }
}

function populateSubjectSelects(subjects) {
  const filterSelect = document.getElementById('filter-subject');
  const modalSelect = document.getElementById('task-subject');

  if (filterSelect) {
    const currentVal = filterSelect.value;
    filterSelect.innerHTML =
      '<option value="all">All Subjects</option>' +
      subjects.map((s) => `<option value="${s._id}">${escapeHtml(s.name)} (${s.code || ''})</option>`).join('');
    if (currentVal) filterSelect.value = currentVal;
  }

  if (modalSelect) {
    modalSelect.innerHTML =
      '<option value="">-- Choose Subject --</option>' +
      subjects.map((s) => `<option value="${s._id}">${escapeHtml(s.name)} (${s.code || ''})</option>`).join('');
  }
}

async function loadTasks() {
  const container = document.getElementById('tasks-container');
  if (!container) return;

  const subject = document.getElementById('filter-subject')?.value || 'all';
  const priority = document.getElementById('filter-priority')?.value || 'all';
  const status = document.getElementById('filter-status')?.value || 'all';
  const search = document.getElementById('task-search')?.value.trim() || '';

  try {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary);"></i>
        <p style="margin-top: 10px; color: var(--text-muted);">Fetching study tasks...</p>
      </div>
    `;

    let url = `/tasks?subject=${subject}&priority=${priority}&status=${status}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    const res = await apiRequest(url);
    allTasks = res.data || [];

    // Update count in header
    const counterEl = document.getElementById('planner-task-count');
    if (counterEl) counterEl.textContent = allTasks.length;

    renderTasks(allTasks);
  } catch (err) {
    showToast('Failed to load tasks: ' + err.message, 'error');
    container.innerHTML = `<p style="color: var(--danger); text-align: center; padding: 30px;">Error loading study tasks.</p>`;
  }
}

function renderTasks(tasks) {
  const container = document.getElementById('tasks-container');
  if (!container) return;

  if (tasks.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fa-solid fa-list-check empty-icon"></i>
        <h3 class="empty-title">No Study Tasks Found</h3>
        <p class="empty-text">No tasks match your current filters. Add a new study assignment or clear filters to see your schedule.</p>
        <button class="btn btn-primary" onclick="openAddTaskModal()">
          <i class="fa-solid fa-plus"></i> Add New Study Task
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = tasks
    .map((task) => {
      const isDone = task.status === 'Completed';
      const isOverdue = task.isOverdue && !isDone;
      const subjColor = task.subject?.color || '#4F46E5';
      const subjName = task.subject?.name || 'General Subject';
      const subjCode = task.subject?.code || 'SUB';

      const priorityBadge =
        task.priority === 'High'
          ? '<span class="badge badge-priority-high"><i class="fa-solid fa-fire"></i> High</span>'
          : task.priority === 'Medium'
          ? '<span class="badge badge-priority-medium"><i class="fa-solid fa-bolt"></i> Medium</span>'
          : '<span class="badge badge-priority-low"><i class="fa-regular fa-clock"></i> Low</span>';

      const statusBadge = isDone
        ? '<span class="badge badge-status-completed"><i class="fa-solid fa-check"></i> Completed</span>'
        : isOverdue
        ? '<span class="badge badge-status-overdue"><i class="fa-solid fa-triangle-exclamation"></i> Overdue</span>'
        : '<span class="badge badge-status-pending"><i class="fa-regular fa-hourglass"></i> Pending</span>';

      return `
        <div class="planner-task-card ${isDone ? 'completed-task' : ''} ${isOverdue ? 'overdue-task' : ''}">
          <div class="planner-task-left">
            <label class="custom-checkbox-wrap">
              <input type="checkbox" ${isDone ? 'checked' : ''} onchange="toggleTaskComplete('${task._id}')" />
              <span class="custom-checkmark"></span>
            </label>
            <div class="planner-task-info">
              <div class="planner-task-header">
                <span class="subject-tag" style="background: ${subjColor}15; color: ${subjColor}; border: 1px solid ${subjColor}30;">
                  <span class="subject-tag-dot" style="background: ${subjColor};"></span>
                  ${escapeHtml(subjName)} (${escapeHtml(subjCode)})
                </span>
                ${priorityBadge}
                ${statusBadge}
              </div>
              <h4 class="planner-task-title ${isDone ? 'line-through' : ''}">${escapeHtml(task.title)}</h4>
              ${task.description ? `<p class="planner-task-desc">${escapeHtml(task.description)}</p>` : ''}
              <div class="planner-task-meta">
                <span><i class="fa-regular fa-calendar"></i> ${formatDate(task.dueDate)}</span>
                <span><i class="fa-regular fa-clock"></i> ${formatTime(task.dueTime)}</span>
                <span><i class="fa-solid fa-hourglass-half"></i> ${task.estimatedHours || 1} hrs</span>
                ${task.completedAt ? `<span class="completed-timestamp"><i class="fa-solid fa-check-double"></i> Finished ${formatDate(task.completedAt)}</span>` : ''}
              </div>
            </div>
          </div>
          <div class="planner-task-actions">
            <button class="btn-icon" title="Edit Task" onclick="openEditTaskModal('${task._id}')">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button class="btn-icon delete-icon" title="Delete Task" onclick="confirmDeleteTask('${task._id}', '${escapeHtml(task.title)}')">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      `;
    })
    .join('');
}

async function toggleTaskComplete(taskId) {
  try {
    const res = await apiRequest(`/tasks/${taskId}/toggle`, { method: 'PATCH' });
    showToast(res.message || 'Task status updated', 'success');
    loadTasks();
  } catch (err) {
    showToast(err.message || 'Failed to update task', 'error');
  }
}

function setupFilterListeners() {
  const subjectFilter = document.getElementById('filter-subject');
  const priorityFilter = document.getElementById('filter-priority');
  const statusFilter = document.getElementById('filter-status');
  const searchInput = document.getElementById('task-search');
  const resetFiltersBtn = document.getElementById('reset-filters-btn');

  if (subjectFilter) subjectFilter.addEventListener('change', loadTasks);
  if (priorityFilter) priorityFilter.addEventListener('change', loadTasks);
  if (statusFilter) statusFilter.addEventListener('change', loadTasks);

  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(loadTasks, 300);
    });
  }

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      if (subjectFilter) subjectFilter.value = 'all';
      if (priorityFilter) priorityFilter.value = 'all';
      if (statusFilter) statusFilter.value = 'all';
      if (searchInput) searchInput.value = '';
      loadTasks();
    });
  }
}

function setupTaskForm() {
  const form = document.getElementById('task-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('task-title').value.trim();
    const subject = document.getElementById('task-subject').value;
    const dueDate = document.getElementById('task-due-date').value;
    const dueTime = document.getElementById('task-due-time').value || '23:59';
    const priority = document.getElementById('task-priority').value || 'Medium';
    const estimatedHours = document.getElementById('task-hours').value || 2;
    const description = document.getElementById('task-desc').value.trim();

    if (!title || !subject || !dueDate) {
      showToast('Please fill in title, subject and due date', 'error');
      return;
    }

    try {
      const payload = {
        title,
        subject,
        dueDate,
        dueTime,
        priority,
        estimatedHours: Number(estimatedHours),
        description
      };

      if (editingTaskId) {
        await apiRequest(`/tasks/${editingTaskId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showToast('Study task updated successfully!', 'success');
      } else {
        await apiRequest('/tasks', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showToast('Study task added successfully!', 'success');
      }

      closeModal('taskModal');
      form.reset();
      editingTaskId = null;
      loadTasks();
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    }
  });
}

function openAddTaskModal() {
  editingTaskId = null;
  const form = document.getElementById('task-form');
  if (form) form.reset();

  document.getElementById('task-modal-title').textContent = 'Add Study Task';

  // Default date to today
  const dateInput = document.getElementById('task-due-date');
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  // Preselect filter subject if single subject is chosen
  const filterSubject = document.getElementById('filter-subject')?.value;
  if (filterSubject && filterSubject !== 'all') {
    const select = document.getElementById('task-subject');
    if (select) select.value = filterSubject;
  }

  openModal('taskModal');
}

function openEditTaskModal(id) {
  const task = allTasks.find((t) => t._id === id);
  if (!task) return;

  editingTaskId = id;
  document.getElementById('task-modal-title').textContent = 'Edit Study Task';
  document.getElementById('task-title').value = task.title || '';
  document.getElementById('task-subject').value = task.subject?._id || task.subject || '';

  if (task.dueDate) {
    const d = new Date(task.dueDate);
    document.getElementById('task-due-date').value = d.toISOString().split('T')[0];
  }
  document.getElementById('task-due-time').value = task.dueTime || '23:59';
  document.getElementById('task-priority').value = task.priority || 'Medium';
  document.getElementById('task-hours').value = task.estimatedHours || 2;
  document.getElementById('task-desc').value = task.description || '';

  openModal('taskModal');
}

async function confirmDeleteTask(id, title) {
  if (confirm(`Delete task "${title}"?`)) {
    try {
      await apiRequest(`/tasks/${id}`, { method: 'DELETE' });
      showToast('Task deleted', 'info');
      loadTasks();
    } catch (err) {
      showToast(err.message || 'Failed to delete task', 'error');
    }
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
