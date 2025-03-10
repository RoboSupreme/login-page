document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const loginBtn = document.getElementById('loginBtn');
  const signupBtn = document.getElementById('signupBtn');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const loginMessage = document.getElementById('loginMessage');
  const signupMessage = document.getElementById('signupMessage');

  // Switch between login and signup forms
  loginBtn.addEventListener('click', () => {
    loginBtn.classList.add('active');
    signupBtn.classList.remove('active');
    loginForm.classList.add('active-form');
    signupForm.classList.remove('active-form');
  });

  signupBtn.addEventListener('click', () => {
    signupBtn.classList.add('active');
    loginBtn.classList.remove('active');
    signupForm.classList.add('active-form');
    loginForm.classList.remove('active-form');
  });

  // Signup form submission
  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Clear previous messages
    signupMessage.textContent = '';
    signupMessage.classList.remove('success');
    
    // Validate input
    if (!name || !email || !password || !confirmPassword) {
      signupMessage.textContent = 'All fields are required';
      return;
    }
    
    if (password !== confirmPassword) {
      signupMessage.textContent = 'Passwords do not match';
      return;
    }
    
    // Check if email already exists
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.some(user => user.email === email)) {
      signupMessage.textContent = 'Email already registered';
      return;
    }
    
    // Add user to storage
    const newUser = {
      name,
      email,
      // In a real application, you would hash this password
      // This is just for demonstration purposes
      password
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Show success message
    signupMessage.textContent = 'Account created successfully! You can now log in.';
    signupMessage.classList.add('success');
    
    // Reset form
    signupForm.reset();
    
    // Switch to login form after successful signup
    setTimeout(() => {
      loginBtn.click();
    }, 2000);
  });

  // Login form submission
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Clear previous messages
    loginMessage.textContent = '';
    loginMessage.classList.remove('success');
    
    // Validate input
    if (!email || !password) {
      loginMessage.textContent = 'Please enter both email and password';
      return;
    }
    
    // Check if user exists and password matches
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(user => user.email === email && user.password === password);
    
    if (!user) {
      loginMessage.textContent = 'Invalid email or password';
      return;
    }
    
    // Store logged in user info with login time
    const loginTime = new Date().toLocaleString();
    
    // Set both the currentUser object (for backward compatibility) and the new keys
    localStorage.setItem('currentUser', JSON.stringify({
      name: user.name,
      email: user.email,
      loginTime: loginTime
    }));
    
    // Set the specific keys needed for Vercel deployment
    localStorage.setItem('musicUserLoggedIn', 'true');
    localStorage.setItem('musicUsername', user.name);
    
    // Show success message
    loginMessage.textContent = 'Login successful! Redirecting...';
    loginMessage.classList.add('success');
    
    // Redirect to dashboard page after successful login
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1500);
  });

  // Check if user is already logged in using both methods for compatibility
  if (localStorage.getItem('musicUserLoggedIn') === 'true' || localStorage.getItem('currentUser')) {
    // Redirect to dashboard if already logged in
    window.location.href = 'dashboard.html';
  }
});