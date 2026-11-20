/**
 * Student Study Planner - Subject Management Logic
 */

let allSubjects = [];
let editingSubjectId = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;

  loadSubjects();
  setupSubjectForms();
});

// Load subjects from API
async function loadSubjects() {
  const container = document.getElementById('subjects-grid');
  if (!container) return;

  try {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
        <i class="fa-solid fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary);"></i>
        <p style="margin-top: 10px; color: var(--text-muted);">Loading subjects...</p>
      </div>
    `;

    const res = await apiRequest('/subjects');
    allSubjects = res.data || [];

    // Update total counter in page header
    const totalCountEl = document.getElementById('total-subjects-count');
    if (totalCountEl) totalCountEl.textContent = allSubjects.length;

    renderSubjects(allSubjects);
  } catch (err) {
    showToast('Failed to load subjects: ' + err.message, 'error');
    container.innerHTML = `<p style="color: var(--danger); text-align: center;">Error loading subjects.</p>`;
  }
}

// Render Subject Cards
function renderSubjects(subjects) {
  const container = document.getElementById('subjects-grid');
  if (!container) return;

  if (subjects.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <i class="fa-solid fa-book-open empty-icon"></i>
        <h3 class="empty-title">No Subjects Added Yet</h3>
        <p class="empty-text">Add your academic courses (e.g. Data Structures, DBMS, Computer Networks) to start planning study sessions.</p>
        <button class="btn btn-primary" onclick="openAddSubjectModal()">
          <i class="fa-solid fa-plus"></i> Add Your First Subject
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = subjects
    .map((subj) => {
      const color = subj.color || '#4F46E5';
      const pct = subj.progressPercentage || 0;
      const totalTasks = subj.totalTasks || 0;
      const completedTasks = subj.completedTasks || 0;
      const pendingTasks = subj.pendingTasks || 0;

      return `
        <div class="card subject-card" style="border-top: 4px solid ${color};">
          <div class="subject-card-header">
            <div class="subject-code-tag" style="background: ${color}15; color: ${color};">
              ${escapeHtml(subj.code || 'COURSE')}
            </div>
            <div class="subject-menu-actions">
              <button class="btn-icon" title="Edit Subject" onclick="openEditSubjectModal('${subj._id}')">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button class="btn-icon delete-icon" title="Delete Subject" onclick="confirmDeleteSubject('${subj._id}', '${escapeHtml(subj.name)}')">
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>

          <h3 class="subject-title">${escapeHtml(subj.name)}</h3>
          <p class="subject-instructor">
            <i class="fa-solid fa-chalkboard-user"></i> ${escapeHtml(subj.instructor || 'Faculty / Instructor')}
          </p>

          ${subj.description ? `<p class="subject-description">${escapeHtml(subj.description)}</p>` : ''}

          <div class="subject-meta-grid">
            <div class="subject-meta-item">
              <span class="meta-label">Target / Week</span>
              <span class="meta-value">${subj.targetHoursPerWeek || 6} hrs</span>
            </div>
            <div class="subject-meta-item">
              <span class="meta-label">Credits</span>
              <span class="meta-value">${subj.credits || 3}</span>
            </div>
            <div class="subject-meta-item">
              <span class="meta-label">Active Tasks</span>
              <span class="meta-value">${pendingTasks}</span>
            </div>
          </div>

          <div class="subject-progress-section">
            <div class="subject-progress-info">
              <span>Study Progress</span>
              <span class="pct-text" style="color: ${color}; font-weight: 700;">${pct}%</span>
            </div>
            <div class="progress-container">
              <div class="progress-bar" style="width: ${pct}%; background: ${color};"></div>
            </div>
            <div class="task-stats-footer">
              <span>${completedTasks} of ${totalTasks} tasks completed</span>
            </div>
          </div>

          <div class="subject-card-footer">
            <a href="planner.html?subject=${subj._id}" class="btn btn-outline-primary btn-sm" style="width: 100%;">
              <i class="fa-solid fa-calendar-check"></i> View Study Tasks
            </a>
          </div>
        </div>
      `;
    })
    .join('');
}

// Setup Add & Edit Forms
function setupSubjectForms() {
  const form = document.getElementById('subject-form');
  if (!form) return;

  // Color picker preset clicks
  const colorSwatches = document.querySelectorAll('.color-swatch-picker button');
  colorSwatches.forEach((swatch) => {
    swatch.addEventListener('click', (e) => {
      e.preventDefault();
      colorSwatches.forEach((s) => s.classList.remove('selected'));
      swatch.classList.add('selected');
      const selectedColor = swatch.getAttribute('data-color');
      document.getElementById('subject-color').value = selectedColor;
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('subject-name').value.trim();
    const code = document.getElementById('subject-code').value.trim();
    const instructor = document.getElementById('subject-instructor').value.trim();
    const color = document.getElementById('subject-color').value || '#4F46E5';
    const targetHoursPerWeek = document.getElementById('subject-hours').value || 6;
    const credits = document.getElementById('subject-credits').value || 3;
    const description = document.getElementById('subject-description').value.trim();

    if (!name) {
      showToast('Subject name is required', 'error');
      return;
    }

    try {
      const payload = {
        name,
        code,
        instructor,
        color,
        targetHoursPerWeek: Number(targetHoursPerWeek),
        credits: Number(credits),
        description
      };

      if (editingSubjectId) {
        // Update existing subject
        await apiRequest(`/subjects/${editingSubjectId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showToast('Subject updated successfully!', 'success');
      } else {
        // Create new subject
        await apiRequest('/subjects', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showToast('Subject added successfully!', 'success');
      }

      closeModal('subjectModal');
      form.reset();
      editingSubjectId = null;
      loadSubjects();
    } catch (err) {
      showToast(err.message || 'Operation failed', 'error');
    }
  });
}

function openAddSubjectModal() {
  editingSubjectId = null;
  const form = document.getElementById('subject-form');
  if (form) form.reset();
  document.getElementById('subject-modal-title').textContent = 'Add New Subject';
  document.getElementById('subject-color').value = '#4F46E5';
  openModal('subjectModal');
}

function openEditSubjectModal(id) {
  const subject = allSubjects.find((s) => s._id === id);
  if (!subject) return;

  editingSubjectId = id;
  document.getElementById('subject-modal-title').textContent = 'Edit Subject';
  document.getElementById('subject-name').value = subject.name || '';
  document.getElementById('subject-code').value = subject.code || '';
  document.getElementById('subject-instructor').value = subject.instructor || '';
  document.getElementById('subject-color').value = subject.color || '#4F46E5';
  document.getElementById('subject-hours').value = subject.targetHoursPerWeek || 6;
  document.getElementById('subject-credits').value = subject.credits || 3;
  document.getElementById('subject-description').value = subject.description || '';

  // Select matching color swatch if found
  document.querySelectorAll('.color-swatch-picker button').forEach((swatch) => {
    if (swatch.getAttribute('data-color') === subject.color) {
      swatch.classList.add('selected');
    } else {
      swatch.classList.remove('selected');
    }
  });

  openModal('subjectModal');
}

async function confirmDeleteSubject(id, name) {
  if (confirm(`Are you sure you want to delete "${name}"?\nAll associated study tasks will also be removed.`)) {
    try {
      await apiRequest(`/subjects/${id}`, { method: 'DELETE' });
      showToast('Subject deleted', 'info');
      loadSubjects();
    } catch (err) {
      showToast(err.message || 'Failed to delete subject', 'error');
    }
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
