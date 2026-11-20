/**
 * Student Study Planner - Central API Client & UI Utilities
 */

const API_BASE_URL = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
  ? `${window.location.origin}/api`
  : '/api';

// Toast Notification System
function showToast(message, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconClass =
    type === 'success'
      ? 'fa-solid fa-circle-check'
      : type === 'error'
      ? 'fa-solid fa-triangle-exclamation'
      : 'fa-solid fa-circle-info';

  toast.innerHTML = `
    <i class="${iconClass} toast-icon"></i>
    <div class="toast-message">${message}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(50px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Token & Session Storage
function getToken() {
  return localStorage.getItem('study_planner_token');
}

function setToken(token) {
  localStorage.setItem('study_planner_token', token);
}

function removeToken() {
  localStorage.removeItem('study_planner_token');
  localStorage.removeItem('study_planner_user');
}

function getCurrentUser() {
  const user = localStorage.getItem('study_planner_user');
  try {
    return user ? JSON.parse(user) : null;
  } catch (e) {
    return null;
  }
}

function setCurrentUser(user) {
  localStorage.setItem('study_planner_user', JSON.stringify(user));
}

// Central API Request Wrapper
async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        removeToken();
        if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('register.html') && !window.location.pathname.endsWith('/')) {
          window.location.href = 'login.html';
        }
      }
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// Route Protection Guard
function requireAuth() {
  const token = getToken();
  if (!token) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// Redirect if already authenticated (e.g. from login / register)
function redirectIfAuth() {
  const token = getToken();
  if (token) {
    window.location.href = 'dashboard.html';
  }
}

// Render dynamic student info into Sidebar & Topbar
function renderSidebarUser() {
  const user = getCurrentUser();
  if (!user) return;

  // Update sidebar name and college
  const nameEl = document.getElementById('sidebar-user-name');
  const collegeEl = document.getElementById('sidebar-user-college');
  const avatarEl = document.getElementById('sidebar-user-avatar');

  if (nameEl) nameEl.textContent = user.name || 'Student';
  if (collegeEl) collegeEl.textContent = user.major || user.college || 'B.Tech CSE';
  if (avatarEl) {
    const initials = (user.name || 'ST')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
    avatarEl.textContent = initials;
  }

  // Update topbar greeting if present
  const topbarGreeting = document.getElementById('topbar-greeting-name');
  if (topbarGreeting) {
    topbarGreeting.textContent = user.name ? user.name.split(' ')[0] : 'Student';
  }
}

// Mobile Sidebar Toggle and Backdrop
function setupMobileSidebar() {
  const toggleBtn = document.getElementById('mobile-menu-btn');
  const closeBtn = document.getElementById('close-sidebar-btn');
  const sidebar = document.getElementById('sidebar');

  let backdrop = document.querySelector('.sidebar-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    document.body.appendChild(backdrop);
  }

  function openSidebar() {
    sidebar.classList.add('mobile-open');
    backdrop.classList.add('active');
  }

  function closeSidebar() {
    sidebar.classList.remove('mobile-open');
    backdrop.classList.remove('active');
  }

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', openSidebar);
  }
  if (closeBtn && sidebar) {
    closeBtn.addEventListener('click', closeSidebar);
  }
  if (backdrop) {
    backdrop.addEventListener('click', closeSidebar);
  }
}

// Setup Global Logout
function setupLogout() {
  const logoutBtns = document.querySelectorAll('.logout-btn');
  logoutBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Are you sure you want to log out?')) {
        removeToken();
        showToast('Logged out successfully', 'info');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 500);
      }
    });
  });
}

// Format Date Utility (e.g., Nov 20, 2026)
function formatDate(dateInput) {
  if (!dateInput) return 'N/A';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return dateInput;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

// Format 24-hr time to 12-hr AM/PM
function formatTime(timeStr) {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
}

// Modal Control Helpers
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Setup common modal listeners (click backdrop or close button)
function setupModals() {
  document.querySelectorAll('.modal-overlay').forEach((modal) => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal.id);
      }
    });
  });

  document.querySelectorAll('.modal-close-btn, .btn-close-modal').forEach((btn) => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-overlay');
      if (modal) closeModal(modal.id);
    });
  });
}

// Highlight Current Navigation Link
function highlightActiveNav() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.sidebar-nav .nav-link').forEach((link) => {
    const href = link.getAttribute('href');
    if (href === currentPath) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// Initialize on DOM load for protected pages
document.addEventListener('DOMContentLoaded', () => {
  setupMobileSidebar();
  setupLogout();
  setupModals();
  highlightActiveNav();
  renderSidebarUser();
});
