/**
 * Student Study Planner - Progress Tracker & Academic Analytics
 */

let weeklyHoursChartInstance = null;
let subjectDistributionChartInstance = null;
let priorityChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;

  loadProgressAnalytics();
});

async function loadProgressAnalytics() {
  try {
    const [dashboardData, progressData] = await Promise.all([
      apiRequest('/analytics/dashboard'),
      apiRequest('/analytics/progress')
    ]);

    const { stats, weeklyChart } = dashboardData;
    const { subjectProgress, priorityDistribution, goalsSummary } = progressData;

    // 1. Summary Cards
    document.getElementById('overall-completion-pct').textContent = `${stats.completionRate || 0}%`;
    document.getElementById('overall-progress-bar').style.width = `${stats.completionRate || 0}%`;

    document.getElementById('stat-completed-total').textContent = stats.completedTasks || 0;
    document.getElementById('stat-pending-total').textContent = stats.pendingTasks || 0;
    document.getElementById('stat-total-subjects').textContent = stats.totalSubjects || 0;

    const totalEstimatedStudyHours = (weeklyChart.hours || []).reduce((a, b) => a + b, 0);
    document.getElementById('stat-weekly-hours').textContent = `${totalEstimatedStudyHours.toFixed(1)} hrs`;

    // 2. Render Subject-wise Detailed Breakdown
    renderSubjectBreakdown(subjectProgress);

    // 3. Render Chart.js Visualizations
    renderWeeklyHoursChart(weeklyChart);
    renderSubjectDoughnutChart(subjectProgress);
    renderPriorityDoughnutChart(priorityDistribution);
  } catch (err) {
    showToast('Failed to load progress analytics: ' + err.message, 'error');
  }
}

// Render Subject Progress Bars & Metrics
function renderSubjectBreakdown(subjects) {
  const container = document.getElementById('subject-progress-container');
  if (!container) return;

  if (!subjects || subjects.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p class="empty-text">No subjects found to track progress. Add subjects to see performance metrics.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = subjects
    .map((s) => {
      const color = s.color || '#4F46E5';
      const pct = s.progressPercentage || 0;

      return `
        <div class="subject-progress-card">
          <div class="subject-progress-card-header">
            <div class="subject-info-col">
              <span class="subject-name" style="color: var(--text-main);">
                <span class="color-dot" style="background: ${color};"></span>
                ${escapeHtml(s.name)}
              </span>
              <span class="subject-meta-tag">${escapeHtml(s.code || 'COURSE')} • ${s.credits || 3} Credits</span>
            </div>
            <div class="subject-pct-col" style="color: ${color}; font-weight: 800; font-size: 1.15rem;">
              ${pct}%
            </div>
          </div>

          <div class="progress-container" style="height: 10px; margin: 12px 0 8px;">
            <div class="progress-bar" style="width: ${pct}%; background: ${color};"></div>
          </div>

          <div class="subject-stats-row">
            <span><i class="fa-solid fa-circle-check" style="color: var(--success);"></i> ${s.completedTasks} Completed</span>
            <span><i class="fa-regular fa-clock" style="color: var(--warning);"></i> ${s.pendingTasks} Pending</span>
            <span><i class="fa-solid fa-bullseye" style="color: var(--primary);"></i> ${s.targetHoursPerWeek || 6} hrs/wk target</span>
          </div>
        </div>
      `;
    })
    .join('');
}

// Weekly Study Activity Bar Chart
function renderWeeklyHoursChart(weeklyData) {
  const canvas = document.getElementById('progressWeeklyChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (weeklyHoursChartInstance) weeklyHoursChartInstance.destroy();

  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, '#4F46E5');
  gradient.addColorStop(1, '#8B5CF6');

  weeklyHoursChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: weeklyData.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'Study Hours',
          data: weeklyData.hours || [0, 0, 0, 0, 0, 0, 0],
          backgroundColor: gradient,
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
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0F172A',
          padding: 10,
          callbacks: {
            label: (ctx) => ` ${ctx.raw} hours studied`
          }
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            callback: (val) => val + 'h'
          }
        }
      }
    }
  });
}

// Subject Task Distribution Doughnut Chart
function renderSubjectDoughnutChart(subjects) {
  const canvas = document.getElementById('subjectDistributionChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (subjectDistributionChartInstance) subjectDistributionChartInstance.destroy();

  if (!subjects || subjects.length === 0) return;

  const labels = subjects.map((s) => s.code || s.name);
  const data = subjects.map((s) => s.totalTasks || 0);
  const colors = subjects.map((s) => s.color || '#4F46E5');

  subjectDistributionChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#FFFFFF',
          hoverOffset: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            padding: 14,
            font: { size: 12 }
          }
        }
      }
    }
  });
}

// Task Priority Doughnut Chart
function renderPriorityDoughnutChart(priorities) {
  const canvas = document.getElementById('priorityChart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (priorityChartInstance) priorityChartInstance.destroy();

  const data = [
    priorities.high || 0,
    priorities.medium || 0,
    priorities.low || 0
  ];

  priorityChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['High Priority', 'Medium Priority', 'Low Priority'],
      datasets: [
        {
          data,
          backgroundColor: ['#EF4444', '#F59E0B', '#3B82F6'],
          borderWidth: 2,
          borderColor: '#FFFFFF',
          hoverOffset: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            padding: 14,
            font: { size: 12 }
          }
        }
      }
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}
