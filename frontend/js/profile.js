/**
 * Student Study Planner - Profile & Settings Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;

  loadProfile();
  setupProfileForms();
  setupDemoSeedButton();
});

async function loadProfile() {
  try {
    const res = await apiRequest('/auth/me');
    const user = res.user;

    // Save updated user to local storage
    setCurrentUser(user);
    renderSidebarUser();

    // Populate profile form fields
    document.getElementById('profile-name').value = user.name || '';
    document.getElementById('profile-email').value = user.email || '';
    document.getElementById('profile-college').value = user.college || '';
    document.getElementById('profile-major').value = user.major || '';
    document.getElementById('profile-semester').value = user.semester || 'Semester 5';
    document.getElementById('profile-daily-hours').value = user.targetDailyHours || 4;

    // Display summary on header card
    const headerName = document.getElementById('display-user-name');
    const headerEmail = document.getElementById('display-user-email');
    const headerMajor = document.getElementById('display-user-major');

    if (headerName) headerName.textContent = user.name || 'Student';
    if (headerEmail) headerEmail.textContent = user.email || '';
    if (headerMajor) headerMajor.textContent = `${user.major || 'B.Tech CSE'} • ${user.semester || 'Semester 5'}`;
  } catch (err) {
    showToast('Failed to load profile: ' + err.message, 'error');
  }
}

function setupProfileForms() {
  const profileForm = document.getElementById('profile-edit-form');
  const passwordForm = document.getElementById('change-password-form');

  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('profile-name').value.trim();
      const college = document.getElementById('profile-college').value.trim();
      const major = document.getElementById('profile-major').value.trim();
      const semester = document.getElementById('profile-semester').value;
      const targetDailyHours = document.getElementById('profile-daily-hours').value;

      try {
        const res = await apiRequest('/auth/profile', {
          method: 'PUT',
          body: JSON.stringify({
            name,
            college,
            major,
            semester,
            targetDailyHours: Number(targetDailyHours)
          })
        });

        setCurrentUser(res.user);
        renderSidebarUser();
        showToast('Profile updated successfully!', 'success');
        loadProfile();
      } catch (err) {
        showToast(err.message || 'Failed to update profile', 'error');
      }
    });
  }

  if (passwordForm) {
    passwordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentPassword = document.getElementById('current-password').value;
      const newPassword = document.getElementById('new-password').value;
      const confirmNewPassword = document.getElementById('confirm-new-password').value;

      if (!currentPassword || !newPassword) {
        showToast('Please provide both current and new passwords', 'error');
        return;
      }

      if (newPassword !== confirmNewPassword) {
        showToast('New passwords do not match', 'error');
        return;
      }

      if (newPassword.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
      }

      try {
        await apiRequest('/auth/change-password', {
          method: 'PUT',
          body: JSON.stringify({ currentPassword, newPassword })
        });

        showToast('Password changed successfully!', 'success');
        passwordForm.reset();
      } catch (err) {
        showToast(err.message || 'Failed to change password', 'error');
      }
    });
  }
}

function setupDemoSeedButton() {
  const seedBtn = document.getElementById('reseed-demo-btn');
  if (seedBtn) {
    seedBtn.addEventListener('click', async () => {
      if (confirm('This will reset and load fresh sample B.Tech courses, study tasks, and goals for demonstration.\nContinue?')) {
        try {
          seedBtn.disabled = true;
          seedBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Resetting Demo Data...';

          const res = await apiRequest('/seed', { method: 'POST' });
          showToast(res.message || 'Demo data reloaded!', 'success');

          // Log in with seeded user
          const loginData = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({
              email: 'alex.student@college.edu',
              password: 'password123'
            })
          });

          setToken(loginData.token);
          setCurrentUser(loginData.user);

          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 800);
        } catch (err) {
          showToast(err.message || 'Failed to reload demo data', 'error');
        } finally {
          seedBtn.disabled = false;
          seedBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Reset & Reload Demo Data';
        }
      }
    });
  }
}
