        document.addEventListener('DOMContentLoaded', () => {
            const menuToggle = document.getElementById('menuToggle');
            const navLinks = document.getElementById('navLinks');
            const token = localStorage.getItem('authToken');
            const role = localStorage.getItem('userRole');
            const authSection = document.getElementById('auth-section');
            
            if (token) {
                 let dropdownLinks = `<a href="/profile">My Profile</a>`;
                 if (role === 'admin') {
                     dropdownLinks += `<a href="/admin">Dashboard</a>`;
                 }
                 dropdownLinks += `<a href="#" onclick="logout()">Logout</a>`;

                 authSection.innerHTML = `
                    <div class="user-menu" onclick="toggleDropdown()">
                        <div class="user-icon">
                            <img src="https://ui-avatars.com/api/?name=User&background=random" alt="User">
                        </div>
                        <div class="dropdown" id="userDropdown">
                            ${dropdownLinks}
                        </div>
                    </div>
                `;
            }
        });

        function toggleDropdown() {
            document.getElementById('userDropdown').classList.toggle('show');
        }

        function logout() {
            localStorage.removeItem('authToken');
            localStorage.removeItem('userRole');
            // clear auth cookie
            document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            window.location.reload();
        }

    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('show');
    });

    // Close menu on link click (mobile UX)
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('show');
        });
    });