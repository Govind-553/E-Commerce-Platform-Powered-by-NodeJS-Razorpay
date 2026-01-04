    // Config initialized in firebaseConfig.js
    const auth = firebase.auth();

    function togglePassword(fieldId) {
      const field = document.getElementById(fieldId);
      const button = field.nextElementSibling;
      const icon = button.querySelector('i');
      
      if (field.type === 'password') {
        field.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
      } else {
        field.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
      }
    }

    function switchTab(tab) {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      if(tab === 'login') {
        document.querySelector('.tab:nth-child(1)').classList.add('active');
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('register-form').classList.add('hidden');
      } else {
        document.querySelector('.tab:nth-child(2)').classList.add('active');
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('register-form').classList.remove('hidden');
      }
    }

    async function handleLogin(e) {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;

      try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        Toast.show('Login successful! Redirecting...', 'success');
        await postAuth(userCredential.user);
      } catch (error) {
        Toast.show('Login failed: ' + (error.message || error), 'error');
      }
    }

    async function handleRegister(e) {
      e.preventDefault();
      const name = document.getElementById('reg-name').value;
      const email = document.getElementById('reg-email').value;
      const password = document.getElementById('reg-password').value;

      try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        await user.updateProfile({ displayName: name });
        Toast.show('Registration successful!', 'success');
        await postAuth(user);
      } catch (error) {
        Toast.show('Registration failed: ' + (error.message || error), 'error');
      }
    }

    async function signInWithGoogle() {
      const provider = new firebase.auth.GoogleAuthProvider();
      try {
        const result = await auth.signInWithPopup(provider);
        Toast.show('Google Sign-In successful!', 'success');
        await postAuth(result.user);
      } catch (error) {
        console.error(error);
        Toast.show('Google Sign-In Failed: ' + (error.message || error), 'error');
      }
    }

    async function postAuth(user) {
      try {
        const token = await user.getIdToken();
        // store token in localStorage and also set a cookie so server-side page guards can read it
        localStorage.setItem('authToken', token);
        // set session cookie (will be sent to server) -- path=/ so it's available site-wide
        document.cookie = 'authToken=' + encodeURIComponent(token) + '; path=/;';

        // Sync user with backend
        const syncRes = await fetch(`${BACKEND_API_URL}/api/auth/sync`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if(syncRes.ok) {
          const data = await syncRes.json();
          // Store user role
          localStorage.setItem('userRole', data.role);
          setTimeout(() => {
            if (data.role === 'admin') {
              window.location.href = '/admin';
            } else {
              window.location.href = '/';
            }
          }, 850); // short delay for toast visibility
        } else {
          console.error("Sync failed");
          window.location.href = '/';
        }
      } catch (err) {
        console.error(err);
        Toast.show("Authentication processing failed.", 'error');
      }
    }