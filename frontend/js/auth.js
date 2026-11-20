/**
 * Student Study Planner - Authentication Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  redirectIfAuth();

  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const demoLoginBtn = document.getElementById('demo-login-btn');
  const togglePasswordBtns = document.querySelectorAll('.toggle-password-btn');

  // Toggle Password Visibility
  togglePasswordBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = btn.previousElementSibling;
      if (input && input.tagName === 'INPUT') {
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        const icon = btn.querySelector('i');
        if (icon) {
          icon.classList.toggle('fa-eye');
          icon.classList.toggle('fa-eye-slash');
        }
      }
    });
  });

  // Handle Login Form Submit
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const submitBtn = loginForm.querySelector('button[type="submit"]');

      if (!email || !password) {
        showToast('Please enter both email and password', 'error');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Logging in...';

        const data = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });

        setToken(data.token);
        setCurrentUser(data.user);
        showToast('Welcome back, ' + (data.user.name || 'Student') + '!', 'success');

        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 600);
      } catch (err) {
        showToast(err.message || 'Login failed', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Sign In to Dashboard <i class="fa-solid fa-arrow-right"></i>';
      }
    });
  }

  // Handle Registration Form Submit
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const college = document.getElementById('college') ? document.getElementById('college').value.trim() : '';
      const major = document.getElementById('major') ? document.getElementById('major').value.trim() : '';
      const semester = document.getElementById('semester') ? document.getElementById('semester').value : 'Semester 5';
      const submitBtn = registerForm.querySelector('button[type="submit"]');

      if (!name || !email || !password) {
        showToast('Please fill in all required fields', 'error');
        return;
      }

      if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
      }

      if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creating Account...';

        const data = await apiRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            name,
            email,
            password,
            college: college || 'Apex Institute of Technology',
            major: major || 'Computer Science & Engineering',
            semester
          })
        });

        setToken(data.token);
        setCurrentUser(data.user);
        showToast('Registration successful! Setting up your workspace...', 'success');

        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 800);
      } catch (err) {
        showToast(err.message || 'Registration failed', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Create Student Account <i class="fa-solid fa-arrow-right"></i>';
      }
    });
  }

  // Handle One-Click Demo Student Login (Essential for Evaluation & Viva!)
  if (demoLoginBtn) {
    demoLoginBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        demoLoginBtn.disabled = true;
        demoLoginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Preparing Demo Data...';

        // Attempt login with demo user
        try {
          const loginData = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({
              email: 'alex.student@college.edu',
              password: 'password123'
            })
          });

          setToken(loginData.token);
          setCurrentUser(loginData.user);
          showToast('Logged in as Demo Student: ' + loginData.user.name, 'success');
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 600);
          return;
        } catch (initialLoginErr) {
          // If demo user does not exist yet, trigger seeding
          console.log('Seeding demo database...');
          await apiRequest('/seed', { method: 'POST' });

          const retryData = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({
              email: 'alex.student@college.edu',
              password: 'password123'
            })
          });

          setToken(retryData.token);
          setCurrentUser(retryData.user);
          showToast('Demo account ready! Redirecting to dashboard...', 'success');
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 600);
        }
      } catch (err) {
        showToast('Demo login error: ' + err.message, 'error');
      } finally {
        demoLoginBtn.disabled = false;
        demoLoginBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Try Demo Student Account (Instant Access)';
      }
    });
  }
});
