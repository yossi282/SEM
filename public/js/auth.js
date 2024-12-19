document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
  
    loginForm.addEventListener('submit', function(event) {
      event.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
  
      console.log('Attempting to login with:', email, password); // Log login attempt
  
      fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })
      .then(response => response.json())
      .then(data => {
        console.log('Login response:', data); // Log response data
        if (data.token) {
          alert('Login successful');
          // Simpan token ke localStorage atau sessionStorage dan alihkan pengguna
        } else {
          alert('Login failed: ' + data.message);
        }
      })
      .catch(error => console.error('Error:', error));
    });
  
    signupForm.addEventListener('submit', function(event) {
      event.preventDefault();
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
  
      console.log('Attempting to signup with:', email, password); // Log signup attempt
  
      fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })
      .then(response => response.json())
      .then(data => {
        console.log('Signup response:', data); // Log response data
        alert(data.message);
      })
      .catch(error => console.error('Error:', error));
    });
  });
  