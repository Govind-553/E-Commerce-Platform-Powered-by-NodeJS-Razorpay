    // All original JS behavior preserved
    let token = localStorage.getItem('authToken');

    document.getElementById('logoutBtn').addEventListener('click', () => {
      firebase.auth().signOut().then(() => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        window.location.href = '/login';
      });
    });

    // Tab switching logic
    function switchTab(tabId) {
        // Hide all sections
        ['dashboard', 'products', 'orders'].forEach(id => {
             const el = document.getElementById(id);
             if(el) el.style.display = 'none';
        });
        
        // Remove active class from nav
        document.querySelectorAll('.nav a').forEach(a => a.classList.remove('active'));

        // Show selected section
        const target = document.getElementById(tabId) || document.getElementById('dashboard'); // fallback
        if(target) target.style.display = 'block';

        // Set active nav
        const link = document.querySelector(`.nav a[href="#${tabId}"]`);
        if(link) link.classList.add('active');
        else document.querySelector('.nav a[href="#dashboard"]').classList.add('active');

        // Close sidebar on mobile
        if(window.innerWidth <= 1024) {
             document.querySelector('.sidebar').classList.remove('open');
             document.querySelector('.sidebar-overlay').classList.remove('show');
        }
    }

    // Handle hash change for direct links
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.slice(1) || 'dashboard';
        switchTab(hash);
    });

    // Check auth and initial load
    firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {
        token = await user.getIdToken();
        const products = await fetchProducts();
        fetchStatsAndOrders(token, products);
        
        // Initial tab check
        const hash = window.location.hash.slice(1) || 'dashboard';
        switchTab(hash);
      } else {
        window.location.href = '/login';
      }
    });

    async function fetchProducts() {
      try {
        const res = await fetch(`${BACKEND_API_URL}/api/products`);
        const products = await res.json();
        renderProducts(products);
        return products;
      } catch (err) {
        console.error(err);
        Toast.show('Failed to fetch products', 'error');
        return [];
      }
    }

    async function fetchStatsAndOrders(token, products) {
      try {
        const res = await fetch(`${BACKEND_API_URL}/api/orders/all`, { headers: { Authorization: `Bearer ${token}` }});

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            Toast.show("Unauthorized access", 'error');
            return;
          }
          throw new Error('Failed to fetch orders');
        }

        const orders = await res.json();

        // New: Fetch User Count
        let userCount = 0;
        try {
            const userRes = await fetch(`${BACKEND_API_URL}/api/users`, { headers: { 'Authorization': `Bearer ${token}` }});
            if(userRes.ok) {
                const users = await userRes.json();
                // Filter out admins (role === 'admin')
                const usersOnly = users.filter(u => u.role !== 'admin');
                userCount = usersOnly.length;
            }
        } catch(e) { console.error('Failed to fetch users count', e); }


        const totalOrders = orders.length;
        const totalSales = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
        
        const formatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
        document.querySelector('.sales-value').innerText = formatter.format(totalSales);
        document.querySelector('.orders-value').innerText = totalOrders;
        document.querySelector('.users-value').innerText = userCount;

        renderOrdersTable(orders);
        renderSalesChart(orders);
        // renderAdminActivity(orders, products); // Removed as Profile section was removed

      } catch (error) {
        console.error(error);
        Toast.show('Error loading dashboard stats', 'error');
      }
    }

    function renderAdminActivity(orders, products) {
        const feed = document.getElementById('adminActivityList');
        // Combine orders and products into a single timeline
        const orderEvents = orders.map(o => ({
            type: 'order',
            date: new Date(o.createdAt),
            data: o
        }));
        const productEvents = (products || []).map(p => ({
            type: 'product',
            date: new Date(p.createdAt),
            data: p
        }));

        const allEvents = [...orderEvents, ...productEvents].sort((a, b) => b.date - a.date).slice(0, 10);

        if(allEvents.length === 0) {
            feed.innerHTML = '<p class="muted">No recent activity.</p>';
            return;
        }

        feed.innerHTML = allEvents.map(e => {
            const dateStr = e.date.toLocaleDateString() + ' ' + e.date.toLocaleTimeString();
            let icon, content;

            if(e.type === 'order') {
                const o = e.data;
                const user = o.userId ? (o.userId.name || 'User') : 'Guest';
                icon = '<div style="background:#eef2ff; color:#4f46e5; width:32px; height:32px; border-radius:50%; display:grid; place-items:center;">🛍️</div>';
                content = `<div>
                    <div style="font-weight:600; font-size:0.95rem;">New Order #${o._id.slice(-6).toUpperCase()}</div>
                    <div class="muted" style="font-size:0.85rem;">by ${user} • Rs.${(o.totalAmount||0).toLocaleString()}</div>
                </div>`;
            } else {
                const p = e.data;
                icon = '<div style="background:#ecfdf5; color:#10b981; width:32px; height:32px; border-radius:50%; display:grid; place-items:center;">✨</div>';
                content = `<div>
                    <div style="font-weight:600; font-size:0.95rem;">Product Added: ${p.name}</div>
                    <div class="muted" style="font-size:0.85rem;">${p.category} • Rs.${p.price}</div>
                </div>`;
            }

            return `
                <div style="display:flex; gap:12px; align-items:flex-start; margin-bottom:12px; padding-bottom:12px; border-bottom:1px solid #f3f4f6;">
                    ${icon}
                    <div style="flex:1;">
                        ${content}
                        <div style="color:#9ca3af; font-size:0.75rem; margin-top:2px;">${dateStr}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function renderOrdersTable(orders) {
      const tbody = document.getElementById('paymentTableBody');
      tbody.innerHTML = '';

      if (orders.length === 0) {
        tbody.innerHTML = '<tr class="order-row"><td colspan="5" style="text-align:center; padding:20px;">No orders found</td></tr>';
        return;
      }

      orders.slice(0, 20).forEach(order => {
        const tr = document.createElement('tr');
        tr.classList.add('order-row');
        const date = new Date(order.createdAt).toLocaleDateString() + ' ' + new Date(order.createdAt).toLocaleTimeString();

        const statusOptions = ['Pending', 'Shipped', 'Delivered', 'Cancelled']
          .map(s => `<option value="${s.toLowerCase()}" ${order.status === s.toLowerCase() ? 'selected' : ''}>${s}</option>`)
          .join('');

        const userName = order.userId ? (order.userId.name || order.userId.email || 'Guest') : 'Guest';

        tr.innerHTML = `
          <td class="order-id" data-label="Order ID">${order._id ? order._id.slice(-6).toUpperCase() : '—'}</td>
          <td data-label="User">${userName}</td>
          <td data-label="Amount">Rs.${(order.totalAmount || 0).toLocaleString()}</td>
          <td data-label="Status">
            <select onchange="updateOrderStatus('${order._id}', this.value)" class="status-select">
              ${statusOptions}
            </select>
          </td>
          <td class="order-date" data-label="Date">${date}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    window.updateOrderStatus = async (id, status) => {
      try {
        const res = await fetch(`${BACKEND_API_URL}/api/orders/${id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ status })
        });
        if (res.ok) {
          Toast.show('Order status updated', 'success');
          // fetchStatsAndOrders(token); // Ideally refresh, but lets save bandwidth or rely on next reload
        } else {
          Toast.show('Failed to update status', 'error');
        }
      } catch (e) {
        console.error(e);
        Toast.show('Error updating status', 'error');
      }
    };

    function renderProducts(products) {
      const tbody = document.getElementById('productTableBody');
      tbody.innerHTML = '';
      if (!products.length) {
        tbody.innerHTML = '<tr class="inventory-row"><td colspan="6" style="text-align:center; padding:20px;">No products found</td></tr>';
        return;
      }
      products.forEach(p => {
        const tr = document.createElement('tr');
        tr.classList.add('inventory-row');
        tr.innerHTML = `
          <td data-label="Image"><img src="${p.image}" class="product-img" alt="${p.name}"></td>
          <td class="product-name" data-label="Name">${p.name}</td>
          <td data-label="Price">Rs.${p.price}</td>
          <td data-label="Stock">${p.stock}</td>
          <td data-label="Category"><span class="product-category">${p.category}</span></td>
          <td data-label="Actions">
            <div style="display:flex; gap:8px; align-items:center; justify-content:flex-start;">
              <button class="btn btn-edit" onclick="editProduct('${p._id}')" title="Edit"><i class="fas fa-edit"></i></button>
              <button class="btn btn-danger" onclick="deleteProduct('${p._id}')" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });
    }

    let salesChartInstance = null;
    function renderSalesChart(orders) {
      const ctx = document.getElementById('salesChart').getContext('2d');

      const statusCounts = orders.reduce((acc, order) => {
        const s = order.status || 'unknown';
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {});

      const labels = Object.keys(statusCounts).map(s => s.charAt(0).toUpperCase() + s.slice(1));
      const data = Object.values(statusCounts);

      const gradient = ctx.createLinearGradient(0, 0, 0, 320);
      gradient.addColorStop(0, 'rgba(79,70,229,0.95)');
      gradient.addColorStop(0.5, 'rgba(79,70,229,0.75)');
      gradient.addColorStop(1, 'rgba(6,182,212,0.55)');

      if (salesChartInstance) salesChartInstance.destroy();

      salesChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Orders',
            data,
            backgroundColor: gradient,
            borderRadius: 8,
            maxBarThickness: 48,
            hoverBackgroundColor: 'rgba(124,58,237,0.95)',
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'nearest', axis: 'x', intersect: false },
          plugins: {
            tooltip: {
              enabled: true,
              backgroundColor: '#0f172a',
              titleFont: { weight: 700 },
              bodyFont: { weight: 600 },
              padding: 10,
              callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.formattedValue}` }
            },
            legend: { display: false }
          },
          animation: { duration: 800, easing: 'easeOutCubic' },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#374151', font: { weight: 700 } } },
            y: { beginAtZero: true, ticks: { precision: 0, color: '#374151', font: { weight: 700 } }, grid: { color: 'rgba(15,23,42,0.04)' } }
          },
          onClick: (evt, items) => {
            if (items && items.length) {
              const idx = items[0].index;
              const label = labels[idx];
              Toast.show(`Filtered by status: ${label}`, 'info');
            }
          }
        }
      });
    }

    document.getElementById('productForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('productId').value;
      const product = {
        name: document.getElementById('name').value,
        price: document.getElementById('price').value,
        description: document.getElementById('description').value,
        image: document.getElementById('image').value,
        category: document.getElementById('category').value,
        stock: document.getElementById('stock').value,
      };

      const method = id ? 'PUT' : 'POST';
      const url = id ? `${BACKEND_API_URL}/api/products/${id}` : `${BACKEND_API_URL}/api/products`;

      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(product)
        });

        if (res.ok) {
          resetForm();
          Toast.show(id ? 'Product updated successfully' : 'Product added successfully', 'success');
          fetchProducts();
        } else {
          const err = await res.json();
          Toast.show('Error: ' + (err.message || 'Failed'), 'error');
        }
      } catch (err) {
        console.error(err);
        Toast.show('Request failed', 'error');
      }
    });

    window.editProduct = async (id) => {
      try {
        const res = await fetch(`${BACKEND_API_URL}/api/products`);
        const products = await res.json();
        const p = products.find(prod => prod._id === id);
        if (!p) return;
        document.getElementById('productId').value = p._id;
        document.getElementById('name').value = p.name;
        document.getElementById('price').value = p.price;
        document.getElementById('description').value = p.description || '';
        document.getElementById('image').value = p.image;
        document.getElementById('category').value = p.category;
        document.getElementById('stock').value = p.stock;
        document.getElementById('saveBtn').innerText = 'Update Product';
        document.getElementById('cancelBtn').style.display = 'inline-block';
        document.querySelector('.card')?.scrollIntoView({ behavior: 'smooth' });
      } catch (e) { console.error(e); }
    };

    window.deleteProduct = async (id) => {
      if (!confirm('Are you sure you want to delete this product?')) return;
      try {
        const res = await fetch(`${BACKEND_API_URL}/api/products/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }});
        if (res.ok) {
          Toast.show('Product deleted', 'success');
          fetchProducts();
        } else {
          Toast.show('Error deleting product', 'error');
        }
      } catch (e) { console.error(e); Toast.show('Error deleting product', 'error'); }
    };

    function resetForm() {
      document.getElementById('productForm').reset();
      document.getElementById('productId').value = '';
      document.getElementById('saveBtn').innerText = 'Add Product';
      document.getElementById('cancelBtn').style.display = 'none';
    }
    document.getElementById('cancelBtn').addEventListener('click', resetForm);

    function toggleSidebar() {
      const sb = document.querySelector('.sidebar');
      const overlay = document.querySelector('.sidebar-overlay');
      sb.classList.toggle('open');
      overlay.classList.toggle('show');
    }

    window.addEventListener('resize', () => {
      if (window.innerWidth > 1024) {
        document.querySelector('.sidebar')?.classList.remove('open');
        document.querySelector('.sidebar-overlay')?.classList.remove('show');
      }
    });

    document.addEventListener('click', (e) => {
      const sidebar = document.querySelector('.sidebar');
      const isMobile = window.innerWidth <= 1024;
      const overlay = document.querySelector('.sidebar-overlay');
      if (isMobile && sidebar && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && !e.target.closest('.menu-btn')) {
          sidebar.classList.remove('open');
          overlay.classList.remove('show');
        }
      }
    });