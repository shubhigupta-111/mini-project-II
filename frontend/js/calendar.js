/**
 * Student Study Planner - Interactive Monthly Calendar
 */

let currentDate = new Date();
let calendarTasks = [];
let selectedDayTasks = [];
let selectedDayDateStr = '';

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;

  setupCalendarControls();
  loadCalendarData();
});

async function loadCalendarData() {
  try {
    const res = await apiRequest('/tasks');
    calendarTasks = res.data || [];
    renderCalendar();
  } catch (err) {
    showToast('Failed to load calendar tasks: ' + err.message, 'error');
  }
}

function setupCalendarControls() {
  const prevBtn = document.getElementById('cal-prev-btn');
  const nextBtn = document.getElementById('cal-next-btn');
  const todayBtn = document.getElementById('cal-today-btn');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() - 1);
      renderCalendar();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentDate.setMonth(currentDate.getMonth() + 1);
      renderCalendar();
    });
  }

  if (todayBtn) {
    todayBtn.addEventListener('click', () => {
      currentDate = new Date();
      renderCalendar();
    });
  }
}

function renderCalendar() {
  const grid = document.getElementById('calendar-grid');
  const monthYearLabel = document.getElementById('calendar-month-year');
  if (!grid || !monthYearLabel) return;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  monthYearLabel.textContent = `${monthNames[month]} ${year}`;

  // First day of month & total days in month
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  grid.innerHTML = '';

  // 1. Previous Month Days (Padding)
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = prevMonthTotalDays - i;
    const cell = createDayCell(dayNum, true, false, null);
    grid.appendChild(cell);
  }

  // 2. Current Month Days
  for (let day = 1; day <= totalDays; day++) {
    const isToday = isCurrentMonth && today.getDate() === day;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Filter tasks for this date
    const dayTasks = calendarTasks.filter((t) => {
      if (!t.dueDate) return false;
      const tDate = new Date(t.dueDate);
      const tStr = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}-${String(tDate.getDate()).padStart(2, '0')}`;
      return tStr === dateStr;
    });

    const cell = createDayCell(day, false, isToday, dateStr, dayTasks);
    grid.appendChild(cell);
  }

  // 3. Next Month Days (Padding to fill complete grid rows)
  const totalCellsRendered = firstDayIndex + totalDays;
  const remainingCells = (7 - (totalCellsRendered % 7)) % 7;
  for (let nextDay = 1; nextDay <= remainingCells; nextDay++) {
    const cell = createDayCell(nextDay, true, false, null);
    grid.appendChild(cell);
  }
}

function createDayCell(dayNumber, isInactive, isToday, dateStr, tasks = []) {
  const cell = document.createElement('div');
  cell.className = `calendar-day-cell ${isInactive ? 'inactive-day' : ''} ${isToday ? 'today-cell' : ''}`;

  const dayHeader = document.createElement('div');
  dayHeader.className = 'calendar-day-header';

  const dayNumSpan = document.createElement('span');
  dayNumSpan.className = `day-number ${isToday ? 'today-pill' : ''}`;
  dayNumSpan.textContent = dayNumber;
  dayHeader.appendChild(dayNumSpan);

  if (!isInactive && dateStr) {
    const addMiniBtn = document.createElement('button');
    addMiniBtn.className = 'calendar-mini-add-btn';
    addMiniBtn.title = 'Add task for this day';
    addMiniBtn.innerHTML = '<i class="fa-solid fa-plus"></i>';
    addMiniBtn.onclick = (e) => {
      e.stopPropagation();
      openDayScheduleModal(dateStr, tasks);
    };
    dayHeader.appendChild(addMiniBtn);
  }

  cell.appendChild(dayHeader);

  // Render Task Chips
  if (tasks && tasks.length > 0) {
    const tasksWrapper = document.createElement('div');
    tasksWrapper.className = 'calendar-tasks-wrapper';

    // Show top 3 chips
    const visibleTasks = tasks.slice(0, 3);
    visibleTasks.forEach((t) => {
      const chip = document.createElement('div');
      const isDone = t.status === 'Completed';
      const subjColor = t.subject?.color || '#4F46E5';

      chip.className = `calendar-task-chip ${isDone ? 'chip-done' : ''}`;
      chip.style.borderLeftColor = subjColor;
      chip.title = `${t.title} (${t.priority} priority)`;
      chip.innerHTML = `
        <span class="chip-text">${escapeHtml(t.title)}</span>
      `;
      tasksWrapper.appendChild(chip);
    });

    if (tasks.length > 3) {
      const moreChip = document.createElement('div');
      moreChip.className = 'calendar-more-chip';
      moreChip.textContent = `+${tasks.length - 3} more`;
      tasksWrapper.appendChild(moreChip);
    }

    cell.appendChild(tasksWrapper);
  }

  if (!isInactive && dateStr) {
    cell.onclick = () => openDayScheduleModal(dateStr, tasks);
  }

  return cell;
}

// Open Day Detail Modal
function openDayScheduleModal(dateStr, tasks) {
  selectedDayDateStr = dateStr;
  selectedDayTasks = tasks || [];

  const modalTitle = document.getElementById('day-modal-title');
  const modalDateSub = document.getElementById('day-modal-date-sub');
  const tasksContainer = document.getElementById('day-modal-tasks-list');

  const formattedDate = formatDate(dateStr);
  if (modalTitle) modalTitle.textContent = `Schedule for ${formattedDate}`;
  if (modalDateSub) modalDateSub.textContent = `${selectedDayTasks.length} study tasks planned`;

  if (tasksContainer) {
    if (selectedDayTasks.length === 0) {
      tasksContainer.innerHTML = `
        <div class="empty-state" style="padding: 24px;">
          <i class="fa-regular fa-calendar-xmark empty-icon" style="font-size: 2.2rem;"></i>
          <h4 class="empty-title">No tasks on this date</h4>
          <p class="empty-text">Click the button below to schedule study sessions or assignments for ${formattedDate}.</p>
        </div>
      `;
    } else {
      tasksContainer.innerHTML = selectedDayTasks
        .map((t) => {
          const isDone = t.status === 'Completed';
          const subjColor = t.subject?.color || '#4F46E5';
          const subjName = t.subject?.name || 'General';

          return `
            <div class="task-item-card ${isDone ? 'completed-task' : ''}">
              <label class="custom-checkbox-wrap">
                <input type="checkbox" ${isDone ? 'checked' : ''} onchange="toggleCalendarTask('${t._id}')" />
                <span class="custom-checkmark"></span>
              </label>
              <div class="task-details">
                <div class="task-title-row">
                  <span class="task-title ${isDone ? 'line-through' : ''}">${escapeHtml(t.title)}</span>
                  <span class="subject-pill" style="border-left: 3px solid ${subjColor}; background: ${subjColor}15; color: ${subjColor};">
                    ${escapeHtml(subjName)}
                  </span>
                </div>
                <div class="task-meta-row">
                  <span><i class="fa-regular fa-clock"></i> ${formatTime(t.dueTime)}</span>
                  <span><i class="fa-solid fa-hourglass-half"></i> ${t.estimatedHours || 1} hrs</span>
                  <span class="badge ${t.priority === 'High' ? 'badge-priority-high' : 'badge-priority-medium'}">${t.priority}</span>
                </div>
              </div>
            </div>
          `;
        })
        .join('');
    }
  }

  openModal('dayScheduleModal');
}

async function toggleCalendarTask(taskId) {
  try {
    await apiRequest(`/tasks/${taskId}/toggle`, { method: 'PATCH' });
    showToast('Task updated', 'success');
    closeModal('dayScheduleModal');
    loadCalendarData();
  } catch (err) {
    showToast(err.message || 'Failed to update task', 'error');
  }
}

// Redirect to Planner with the selected date
function goToPlannerWithDate() {
  if (selectedDayDateStr) {
    window.location.href = `planner.html?date=${selectedDayDateStr}`;
  } else {
    window.location.href = 'planner.html';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
