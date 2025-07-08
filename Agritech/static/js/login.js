    // Simulated user database (in a real app, this would be server-side)
    const users = JSON.parse(localStorage.getItem('users')) || [];
    let currentUser = null;
    let generatedOTP = null;

    // Initial page load
    document.addEventListener('DOMContentLoaded', () => {
      showSection('login');
    });

    // Login Form Validation
    document.getElementById('login-form').addEventListener('submit', function (e) {
      e.preventDefault();

      const email = document.getElementById('login-email');
      const password = document.getElementById('login-password');

      const emailError = document.getElementById('login-email-error');
      const passwordError = document.getElementById('login-password-error');

      [email, password].forEach(input => input.classList.remove('input-error'));
      [emailError, passwordError].forEach(div => {
        div.classList.add('hidden');
        div.textContent = '';
      });

      let valid = true;
      
      if (!email.value.trim()) {
        valid = false;
        email.classList.add('input-error');
        emailError.textContent = 'Email is required.';
        emailError.classList.remove('hidden');
      }

      if (!password.value) {
        valid = false;
        password.classList.add('input-error');
        passwordError.textContent = 'Password is required.';
        passwordError.classList.remove('hidden');
      }

      if (valid) {
        // Find user
        const user = users.find(u => u.email === email.value.trim());
        
        if (!user) {
          email.classList.add('input-error');
          emailError.textContent = 'No account found with this email. Please register first.';
          emailError.classList.remove('hidden');
          return;
        }
        
        if (user.password !== password.value) {
          password.classList.add('input-error');
          passwordError.textContent = 'Incorrect password.';
          passwordError.classList.remove('hidden');
          return;
        }
        
        // Check if user is verified
        if (!user.verified) {
          currentUser = user;
          generateOTP();
          showSection('otp-verification');
          return;
        }
        
        // Login successful
        currentUser = user;
        loginSuccess();
      }
    });

    // Registration Form Validation
    document.getElementById('register-form').addEventListener('submit', function (e) {
      e.preventDefault();

      const fullName = document.getElementById('register-fullname');
      const email = document.getElementById('register-email');
      const password = document.getElementById('register-password');
      const confirmPassword = document.getElementById('register-confirm-password');
      const terms = document.getElementById('register-terms');

      const fullNameError = document.getElementById('register-fullname-error');
      const emailError = document.getElementById('register-email-error');
      const passwordError = document.getElementById('register-password-error');
      const confirmPasswordError = document.getElementById('register-confirm-password-error');
      const termsError = document.getElementById('register-terms-error');

      // Clear previous errors
      [fullName, email, password, confirmPassword].forEach(input => input.classList.remove('input-error'));
      [fullNameError, emailError, passwordError, confirmPasswordError, termsError].forEach(div => {
        div.classList.add('hidden');
        div.textContent = '';
      });

      let valid = true;

      // Validate full name
      if (!fullName.value.trim()) {
        valid = false;
        fullName.classList.add('input-error');
        fullNameError.textContent = 'Full name is required.';
        fullNameError.classList.remove('hidden');
      }

      // Validate email
      if (!email.value.trim()) {
        valid = false;
        email.classList.add('input-error');
        emailError.textContent = 'Email is required.';
        emailError.classList.remove('hidden');
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        valid = false;
        email.classList.add('input-error');
        emailError.textContent = 'Please enter a valid email address.';
        emailError.classList.remove('hidden');
      } else if (users.some(u => u.email === email.value.trim())) {
        valid = false;
        email.classList.add('input-error');
        emailError.textContent = 'This email is already registered.';
        emailError.classList.remove('hidden');
      }

      // Validate password
      if (!password.value) {
        valid = false;
        password.classList.add('input-error');
        passwordError.textContent = 'Password is required.';
        passwordError.classList.remove('hidden');
      } else if (password.value.length < 8) {
        valid = false;
        password.classList.add('input-error');
        passwordError.textContent = 'Password must be at least 8 characters long.';
        passwordError.classList.remove('hidden');
      }

      // Validate confirm password
      if (!confirmPassword.value) {
        valid = false;
        confirmPassword.classList.add('input-error');
        confirmPasswordError.textContent = 'Please confirm your password.';
        confirmPasswordError.classList.remove('hidden');
      } else if (confirmPassword.value !== password.value) {
        valid = false;
        confirmPassword.classList.add('input-error');
        confirmPasswordError.textContent = 'Passwords do not match.';
        confirmPasswordError.classList.remove('hidden');
      }

      // Validate terms
      if (!terms.checked) {
        valid = false;
        termsError.textContent = 'You must agree to the terms and conditions.';
        termsError.classList.remove('hidden');
      }

      if (valid) {
        // Create new user
        const newUser = {
          fullName: fullName.value.trim(),
          email: email.value.trim(),
          password: password.value,
          verified: false,
          createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        currentUser = newUser;
        
        // Generate OTP for verification
        generateOTP();
        showSection('otp-verification');
      }
    });

    // OTP Management
    function generateOTP() {
      // Generate a random 6-digit OTP
      generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(`OTP Generated: ${generatedOTP}`); // In a real app, this would be sent via email/SMS
      
      // Clear any existing OTP input
      for (let i = 1; i <= 6; i++) {
        document.getElementById(`otp-${i}`).value = '';
      }
      
      // Set up OTP input field behavior
      setupOTPInputs();
    }

    function setupOTPInputs() {
      const otpInputs = document.querySelectorAll('.otp-input');
      
      otpInputs.forEach((input, index) => {
        // Clear event listeners (to prevent duplicates)
        input.replaceWith(input.cloneNode(true));
        
        // Get fresh reference after cloning
        const newInput = document.getElementById(input.id);
        
        newInput.addEventListener('input', (e) => {
          // Ensure input is numeric
          e.target.value = e.target.value.replace(/[^0-9]/g, '');
          
          // Auto-advance to next input
          if (e.target.value && index < otpInputs.length - 1) {
            otpInputs[index + 1].focus();
          }
        });
        
        newInput.addEventListener('keydown', (e) => {
          // Handle backspace - move to previous input
          if (e.key === 'Backspace' && !e.target.value && index > 0) {
            otpInputs[index - 1].focus();
          }
        });
      });
      
      // Focus first input
      otpInputs[0].focus();
    }

    function resendOTP() {
      generateOTP();
      alert('A new OTP has been sent to your email.');
    }

    function verifyOTP() {
      // Collect OTP from inputs
      let enteredOTP = '';
      for (let i = 1; i <= 6; i++) {
        enteredOTP += document.getElementById(`otp-${i}`).value;
      }
      
      const otpError = document.getElementById('otp-error');
      
      if (enteredOTP.length !== 6) {
        otpError.textContent = 'Please enter all 6 digits.';
        otpError.classList.remove('hidden');
        return;
      }
      
      if (enteredOTP === generatedOTP) {
        // Mark user as verified
        const userIndex = users.findIndex(u => u.email === currentUser.email);
        if (userIndex !== -1) {
          users[userIndex].verified = true;
          localStorage.setItem('users', JSON.stringify(users));
          currentUser.verified = true;
        }
        
        // OTP verification successful - proceed to login
        loginSuccess();
      } else {
        otpError.textContent = 'Invalid OTP. Please try again.';
        otpError.classList.remove('hidden');
      }
    }

    // Login Success
    function loginSuccess() {
      document.getElementById('user-welcome').textContent = `Welcome, ${currentUser.fullName}!`;
      showSection('dashboard');
    }

    // Logout
    function logout() {
      currentUser = null;
      showSection('login');
    }

    // Section management
    function showSection(section) {
      // Hide all sections
      ['login', 'register', 'otp-verification', 'dashboard'].forEach(sec => {
        document.getElementById(`${sec}-section`).style.display = 'none';
      });

      // Show selected section
      document.getElementById(`${section}-section`).style.display = 'block';
    }

    // Password visibility toggle
    function togglePasswordVisibility(id) {
      const input = document.getElementById(id);
      const icon = event.currentTarget.querySelector('i');
      if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    }
    
    // Auto-tab OTP inputs setup on page load
    document.addEventListener('DOMContentLoaded', setupOTPInputs);