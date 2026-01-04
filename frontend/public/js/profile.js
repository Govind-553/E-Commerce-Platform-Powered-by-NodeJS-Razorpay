        // Config initialized in firebaseConfig.js
        let authToken = null;

        // Check Auth
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                const token = await user.getIdToken();
                authToken = token;

                // Fetch full profile from backend
                fetchUserProfile(token);
                
                // Fetch orders for activity and list
            } else {
                window.location.href = '/login';
            }
        });

        async function fetchUserProfile(token) {
            try {
                const res = await fetch(`${BACKEND_API_URL}/api/users/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    document.getElementById('userName').innerText = data.name || "User";
                    document.getElementById('userEmail').innerText = data.email || '';
                    document.getElementById('userPhone').innerText = data.phone || '';
                    document.getElementById('userAddress').innerText = data.address || '';
                    document.getElementById('avatarDisplay').innerText = (data.name || "U").charAt(0).toUpperCase();

                    // Pre-fill edit form
                    document.getElementById('editName').value = data.name || '';
                    document.getElementById('editPhone').value = data.phone || '';
                    document.getElementById('editAddress').value = data.address || '';

                    // Check Role and Fetch appropriate activity
                    if (data.role === 'admin') {
                        fetchAdminActivity(token);
    
                    } else {
                        fetchOrders(token);
                    }
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            }
        }

        async function fetchAdminActivity(token) {
            try {
                const [ordersRes, productsRes] = await Promise.all([
                    fetch(`${BACKEND_API_URL}/api/orders/all`, { headers: { 'Authorization': `Bearer ${token}` } }),
                    fetch(`${BACKEND_API_URL}/api/products`)
                ]);

                let activityItems = [];

                if (ordersRes.ok) {
                    const orders = await ordersRes.json();
                    
                    // Render "All Orders" in the "Recent Orders" section for Admin
                    renderOrders(orders);

                    const orderEvents = orders.map(o => ({
                        type: 'order',
                        date: new Date(o.createdAt),
                        data: o
                    }));
                    activityItems = [...activityItems, ...orderEvents];
                } else {
                     document.getElementById('orderList').innerHTML = '<p>No orders found.</p>';
                }

                if (productsRes.ok) {
                    const products = await productsRes.json();
                    const productEvents = products.map(p => ({
                        type: 'product',
                        date: new Date(p.createdAt || Date.now()), // Assuming product has createdAt
                        data: p
                    }));
                    activityItems = [...activityItems, ...productEvents];
                }

                renderActivityList(activityItems, true); 
                
                // Also hide the chart for admin as it's order-based
                 const chartWrap = document.querySelector('.chart-wrap');
                 if(chartWrap) chartWrap.style.display = 'none';

            } catch (e) {
                console.error("Error fetching admin activity", e);
                document.getElementById('orderList').innerHTML = '<p style="color:red">Error loading orders.</p>';
            }
        }

        async function fetchOrders(token) {
            try {
                const res = await fetch(`${BACKEND_API_URL}/api/orders/myorders`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (res.ok) {
                    const orders = await res.json();
                    renderOrders(orders);
                    
                    const chartWrap = document.querySelector('.chart-wrap');
                    if (!orders || orders.length === 0) {
                        if(chartWrap) chartWrap.style.display = 'none';
                    } else {
                        if(chartWrap) chartWrap.style.display = 'block';
                        renderActivityChart(orders);
                    }
                    
                    // Map orders to activity format
                    const events = orders.map(o => ({
                        type: 'order',
                        date: new Date(o.createdAt),
                        data: o
                    }));
                    renderActivityList(events, false); 
                } else {
                    document.getElementById('orderList').innerHTML = '<p>No orders found.</p>';
                }
            } catch (error) {
                console.error("Fetch Error:", error);
                document.getElementById('orderList').innerHTML = `<p style="color:red;">Error loading orders: ${error.message}</p>`;
            }
        }

        function renderActivityList(items, isAdmin) {
            const activityContainer = document.querySelector('.chart-wrap').parentNode;
            let feed = document.getElementById('activityFeed');
            if(!feed) {
                feed = document.createElement('div');
                feed.id = 'activityFeed';
                feed.style.marginTop = '1.5rem';
                feed.style.borderTop = '1px dashed #eef2f7';
                feed.style.paddingTop = '1rem';
                activityContainer.appendChild(feed);
            }

            if(!items || items.length === 0) {
                feed.innerHTML = '<p style="color:var(--muted); font-size:0.9rem;">No recent activity.</p>';
                return;
            }

            // sort by date desc
            const sorted = items.sort((a, b) => b.date - a.date).slice(0, 10);
            
            feed.innerHTML = sorted.map(item => {
                const dateStr = item.date.toLocaleDateString() + ' ' + item.date.toLocaleTimeString();
                let icon = '';
                let text = '';
                let subtext = '';

                if (item.type === 'order') {
                    const o = item.data;
                    icon = '<div style="background:#eef2ff; color:#4f46e5; width:36px; height:36px; border-radius:50%; display:grid; place-items:center; font-size:1.1rem;">🛍️</div>';
                    text = `Placed order <strong>#${o._id.slice(-6).toUpperCase()}</strong>`;
                    subtext = `Rs.${o.totalAmount}`;

                    if(isAdmin) {
                         text = `New Order <strong>#${o._id.slice(-6).toUpperCase()}</strong> received`;
                         // try to show user name if populated
                         if(o.userId && o.userId.name) text += ` from ${o.userId.name}`;
                    } else {
                        if(o.status === 'delivered') { 
                            icon = '<div style="background:#ecfdf5; color:#10b981; width:36px; height:36px; border-radius:50%; display:grid; place-items:center; font-size:1.1rem;">📦</div>';
                            text = `Order <strong>#${o._id.slice(-6).toUpperCase()}</strong> delivered`;
                        }
                        else if(o.status === 'cancelled') {
                            icon = '<div style="background:#fef2f2; color:#ef4444; width:36px; height:36px; border-radius:50%; display:grid; place-items:center; font-size:1.1rem;">❌</div>';
                            text = `Order <strong>#${o._id.slice(-6).toUpperCase()}</strong> cancelled`;
                        }
                    }
                } else if (item.type === 'product') {
                     const p = item.data;
                     icon = '<div style="background:#fdf4ff; color:#d946ef; width:36px; height:36px; border-radius:50%; display:grid; place-items:center; font-size:1.1rem;">✨</div>';
                     text = `Product <strong>${p.name}</strong> added to inventory`;
                     subtext = `Price: Rs.${p.price}`;
                }
                
                return `
                    <div style="display:flex; gap:14px; align-items:flex-start; margin-bottom:14px; padding-bottom:14px; border-bottom:1px solid #f9fafb;">
                        ${icon}
                        <div style="flex:1;">
                            <div style="color:var(--text); font-size:0.95rem;">${text}</div>
                            <div style="color:var(--muted); font-size:0.8rem; margin-top:2px;">${dateStr} • ${subtext}</div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        async function renderOrders(orders) {
            const list = document.getElementById('orderList');
            list.innerHTML = '';

            if (!orders || orders.length === 0) {
                list.innerHTML = '<p style="color: var(--muted);">You have no orders yet.</p>';
                return;
            }

            // No need to fetch all products — backend populates `products.productId`.

            orders.forEach(order => {
                const date = new Date(order.createdAt || Date.now()).toLocaleDateString();
                const totalAmount = order.totalAmount || order.amount || 0;

                let productsHtml = '';
                if (order.products && order.products.length > 0) {
                    productsHtml = '<div class="order-products">';
                    order.products.forEach(p => {
                        // Use snapshot first (ensures historical accuracy), fall back to populated product
                        const populated = (p.productId && (typeof p.productId === 'object')) ? p.productId : null;
                        // Prefer populated product fields (fresh DB values) over stored snapshots
                        const productImage = (populated && populated.image) || p.image || '/img/logo.png';
                        const productPrice = (populated && (typeof populated.price !== 'undefined' && populated.price !== null)) ? populated.price : ((typeof p.price !== 'undefined' && p.price !== null) ? p.price : 0);
                        const productName = (populated && populated.name) || p.name || 'Product';
                        
                        productsHtml += `
                            <div class="product-row">
                                <img src="${productImage}" alt="${productName || 'product'}" onerror="this.src='/img/logo.png'" />
                                <div style="font-size: 0.95rem; min-width:0; flex:1;">
                                    <div style="font-weight:700; white-space:normal; word-break:break-word;">${productName}</div>
                                    <div style="color: var(--muted); font-size: 0.85rem;">Qty: ${p.quantity} × Rs.${productPrice}</div>
                                </div>
                            </div>
                        `;
                    });
                    productsHtml += '</div>';
                }

                const item = document.createElement('div');
                item.classList.add('order-item');
                item.innerHTML = `
                    <div class="order-left">
                        <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start; flex-wrap:wrap">
                            <div class="order-meta">
                                <div style="font-weight:700;">Order #${(order._id||'').slice(-6).toUpperCase()}</div>
                                <div class="meta-line">Placed on ${date}</div>
                                <div class="meta-line">Total: <strong>Rs. ${Number(totalAmount).toLocaleString()}</strong></div>
                            </div>
                            <div style="display:flex; gap:8px; align-items:center;">
                                <span class="order-status status-${order.status || 'pending'}">
                                    ${order.status || 'Pending'}
                                </span>
                            </div>
                        </div>

                        ${productsHtml}

                        ${order.status === 'pending' ? `<div class="order-actions"><button onclick="cancelOrder('${order._id}')" class="btn-outline">Cancel Order</button></div>` : ''}
                    </div>
                `;
                list.appendChild(item);
            });
        }

        async function cancelOrder(orderId) {
            if(!confirm('Are you sure you want to cancel this order?')) return;

            try {
                const res = await fetch(`${BACKEND_API_URL}/api/orders/${orderId}/cancel`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                if(res.ok) {
                    Toast.show('Order cancelled successfully', 'success');
                    fetchOrders(authToken);
                } else {
                    const d = await res.json().catch(()=>({}));
                    Toast.show(d.message || 'Failed to cancel', 'error');
                }
            } catch(e) {
                console.error(e);
                Toast.show('Error cancelling order', 'error');
            }
        }

        function toggleEditProfile() {
            const form = document.getElementById('editProfileForm');
            const btn = document.getElementById('editToggleBtn');
            if (form.style.display === 'block') {
                form.style.display = 'none';
                form.setAttribute('aria-hidden','true');
                btn.setAttribute('aria-expanded','false');
            } else {
                form.style.display = 'block';
                form.setAttribute('aria-hidden','false');
                btn.setAttribute('aria-expanded','true');
            }
        }

        async function saveProfile() {
            const name = document.getElementById('editName').value;
            const phone = document.getElementById('editPhone').value;
            const address = document.getElementById('editAddress').value;

            try {
                const res = await fetch(`${BACKEND_API_URL}/api/users/profile`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({ name, phone, address })
                });

                if (res.ok) {
                    const data = await res.json();
                    document.getElementById('userName').innerText = data.name || document.getElementById('userName').innerText;
                    document.getElementById('userPhone').innerText = data.phone || '';
                    document.getElementById('userAddress').innerText = data.address || '';
                    document.getElementById('avatarDisplay').innerText = (data.name||'U').charAt(0).toUpperCase();
                    Toast.show('Profile updated successfully', 'success');
                    toggleEditProfile();
                } else {
                    Toast.show('Failed to update profile', 'error');
                }
            } catch (error) {
                console.error(error);
                Toast.show('Error updating profile', 'error');
            }
        }

        function renderActivityChart(orders) {
            const ctx = document.getElementById('activityChart').getContext('2d');
            const statusCounts = (orders || []).reduce((acc, order) => {
                const s = order.status || 'unknown';
                acc[s] = (acc[s] || 0) + 1;
                return acc;
            }, {});

            const labels = Object.keys(statusCounts).map(s => s.toUpperCase());
            const data = Object.values(statusCounts);

            // destroy previous if exists
            if (window.activityChart && typeof window.activityChart.destroy === 'function') {
                window.activityChart.destroy();
            }

            window.activityChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels,
                    datasets: [{
                        data,
                        backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#6b7280'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: (window.innerWidth < 480) ? 'bottom' : 'right' } }
                }
            });
        }

        function logout() {
            firebase.auth().signOut().then(() => {
                localStorage.removeItem('authToken');
                localStorage.removeItem('userRole');
                document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                window.location.href = '/login';
            });
        }