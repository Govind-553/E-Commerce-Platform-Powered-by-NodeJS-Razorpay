        const statesInIndia = [
            "Mumbai", "Amritsar", "Chandigarh", "Patna", "Dehradun", "Delhi", "Goa",
            "Ahmedabad", "Bangalore", "Kanpur", "Pune", "Lucknow", "Jaipur", "Chennai",
            "Hyderabad", "Kolkata", "Assam", "Jammu & Kashmir"
        ];

        function updateCityOptions() {
            const country = document.getElementById("country").value;
            const cityDropdown = document.getElementById("city");
            cityDropdown.innerHTML = '<option value="">Choose...</option>';

            if (country === "India") {
                statesInIndia.forEach((state) => {
                    const option = document.createElement("option");
                    option.value = state;
                    option.textContent = state;
                    cityDropdown.appendChild(option);
                });
            }
        }

        function toggleButton() {
            const codButton = document.getElementById("place-order");
            const razorpayButton = document.getElementById("pay-now");
            const standard = document.getElementById("standard");
            const express = document.getElementById("express");

            if (standard.checked) {
                codButton.style.display = "block";
                razorpayButton.style.display = "none";
            } else if (express.checked) {
                codButton.style.display = "none";
                razorpayButton.style.display = "block";
            }
        }

        window.addEventListener("load", async function() {
            // Load cart from server
            await loadCartFromServer();
        });

        function initiateRazorpayPayment(amount) {
            // Prepare products from listCart
            const products = [];
            for (const id in listCart) {
                if (listCart[id]) {
                    products.push({
                        productId: id,
                        name: listCart[id].name, // Optional: save snapshot of name/price if needed by backend or just ID
                        quantity: listCart[id].quantity,
                        price: listCart[id].price,
                        image: listCart[id].image
                    });
                }
            }

            fetch(`${BACKEND_API_URL}/get-razorpay-key`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
            })
                .then(response => response.json())
                .then(data => {
                    const token = localStorage.getItem('authToken');
                    fetch(`${BACKEND_API_URL}/create-order`, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ amount, currency: 'INR', products })
                    })
                        .then(response => response.json())
                        .then(order => {
                            var options = {
                                "key": data.key_id,
                                "amount": order.amount,
                                "currency": order.currency,
                                "order_id": order.id,
                                "name": "CARTIFY",
                                "description": "Order Payment",
                                "image": "/img/logo.png",
                                "handler": async function (response) {
                                    localStorage.removeItem("cartSummary");
                                    document.cookie = "listCart=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                                    // clear server-side cart too
                                    const token = localStorage.getItem('authToken');
                                    if (token) {
                                        try {
                                            await fetch(`${BACKEND_API_URL}/api/cart`, {
                                                method: 'DELETE',
                                                headers: { 'Authorization': 'Bearer ' + token }
                                            });
                                        } catch (e) {
                                            console.error('Clear cart error', e);
                                        }
                                    }
                                    showSuccessModal();
                                    Toast.show('Order placed successfully!', 'success');
                                },
                                "theme": {
                                    "color": "#2300a3"
                                }
                            };
                            var rzp1 = new Razorpay(options);
                            rzp1.open();
                        })
                        .catch(error => {
                            console.error('Error initiating payment:', error);
                            Toast.show('Error initiating payment', 'error');
                        });
                })
                .catch(error => {
                    console.error('Error fetching Razorpay key:', error);
                    Toast.show('Error fetching payment details', 'error');
                });
        }

        document.getElementById("pay-now").addEventListener("click", function () {
            const totalPriceText = document.querySelector('.totalPrice').innerText.replace("Amount: Rs.", "").trim();
            const totalPrice = parseFloat(totalPriceText) || 0;
            const name = document.getElementById("name").value;
            const email = document.getElementById("email").value;
            const phone = document.getElementById("phone").value;

            if (name && email && phone) {
                if (totalPrice > 0) {
                    initiateRazorpayPayment(totalPrice);
                } else {
                    Toast.show("Cart is empty or total price is invalid.", 'warning');
                }
            } else {
                Toast.show("Please fill in all the fields.", 'warning');
            }
        });

        document.getElementById("place-order").addEventListener("click", function () {
            const name = document.getElementById("name").value;
            const email = document.getElementById("email").value;
            const phone = document.getElementById("phone").value;

            if (name && email && phone) {
                // Determine Amount
                const totalPriceText = document.querySelector('.totalPrice').innerText.replace("Amount: Rs.", "").trim();
                const amount = parseFloat(totalPriceText) || 0;

                // Prepare Products
                const products = [];
                for (const id in listCart) {
                    if (listCart[id]) {
                        products.push({
                            productId: id,
                            name: listCart[id].name,
                            quantity: listCart[id].quantity,
                            price: listCart[id].price,
                            image: listCart[id].image
                        });
                    }
                }

                // COD Logic - Try to create order in backend
                const token = localStorage.getItem('authToken');
                if (token && amount > 0) {
                    fetch(`${BACKEND_API_URL}/create-order`, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ 
                            amount, 
                            currency: 'INR', 
                            products, 
                            status: 'pending',
                            paymentMethod: 'COD' 
                        })
                    }).then(res => res.json())
                      .then(data => {
                          console.log("COD Order Created:", data);
                          finalizeOrder();
                      })
                      .catch(err => {
                          console.error("COD Order Error:", err);
                          finalizeOrder();
                      });
                } else {
                     finalizeOrder();
                }

                function finalizeOrder() {
                    localStorage.removeItem("cartSummary");
                    // clear server-side cart too
                    const token = localStorage.getItem('authToken');
                    if (token) {
                        fetch(`${BACKEND_API_URL}/api/cart`, {
                            method: 'DELETE',
                            headers: { 'Authorization': 'Bearer ' + token }
                        }).catch(e => console.error('Clear cart error', e));
                    }
                    document.cookie = "listCart=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                    showSuccessModal();
                    Toast.show('Order placed successfully!', 'success');
                }

            } else {
                Toast.show("Please fill in all the fields.", 'warning');
            }
        });

        const successModal = document.getElementById("successModal");
        const successHomeBtn = document.getElementById("success-home");
        const successCloseBtn = document.getElementById("success-close");

        function showSuccessModal() {
            successModal.classList.add("show");
        }

        successHomeBtn.addEventListener("click", function () {
            window.location.href = "/";
        });
        successCloseBtn.addEventListener("click", function () {
            successModal.classList.remove("show");
        });

        // CART MODAL JS

        let listCart = {};

        async function loadCartFromServer() {
            const token = localStorage.getItem('authToken');
            if (!token) { window.location.href = '/login'; return; }
            try {
                const res = await fetch(`${BACKEND_API_URL}/api/cart`, {
                    headers: { 'Authorization': 'Bearer ' + token }
                });
                if (!res.ok) {
                    if (res.status === 401 || res.status === 403) {
                        localStorage.removeItem('authToken');
                        window.location.href = '/login';
                    }
                    listCart = {};
                    return;
                }
                const data = await res.json();
                listCart = {};
                if (Array.isArray(data.items)) {
                    data.items.forEach(it => {
                        const pid = it.productId || (it.product && it.product._id) || it.product;
                        listCart[pid] = { _id: pid, image: it.image, name: it.name, price: it.price, quantity: it.quantity };
                    });
                }
            } catch (e) {
                console.error('loadCartFromServer error', e);
                listCart = {};
            }
            updateSummaryFromCart();
        }

        function updateSummaryFromCart() {
            let totalQuantity = 0;
            let totalPrice = 0;
            for (const id in listCart) {
                const p = listCart[id];
                if (!p) continue;
                totalQuantity += p.quantity;
                totalPrice += p.price * p.quantity;
            }
            const totalQuantityEl = document.querySelector('.totalQuantity');
            const totalPriceEl = document.querySelector('.totalPrice');
            if (totalQuantityEl) totalQuantityEl.innerText = totalQuantity;
            if (totalPriceEl) totalPriceEl.innerText = 'Amount: Rs.' + totalPrice;
            localStorage.setItem("cartSummary", JSON.stringify({ totalQuantity, totalPrice }));
        }

        const cartModal = document.getElementById('cartModal');
        const cartModalList = document.querySelector('.cart-modal-list');
        const cartModalEmpty = document.querySelector('.cart-modal-empty');
        const cartModalClose = document.querySelector('.cart-modal-close');
        const navCartLink = document.getElementById('nav-cart');
        const cartKeepShoppingBtn = document.getElementById('cart-keep-shopping');
        const cartCloseBottomBtn = document.getElementById('cart-close-bottom');

        function renderCartModal() {
            cartModalList.innerHTML = '';
            let hasItems = false;

            for (const id in listCart) {
                const product = listCart[id];
                if (!product) continue;
                hasItems = true;

                const item = document.createElement('div');
                item.className = 'cart-item';
                item.innerHTML = `
                    <img src="${product.image}">
                    <div class="cart-info">
                        <div class="cart-name">${product.name}</div>
                        <div class="cart-meta">Rs.${product.price} × ${product.quantity} = Rs.${product.price * product.quantity}</div>
                    </div>
                    <div class="cart-remove" data-id="${id}">&times;</div>
                `;
                cartModalList.appendChild(item);
            }

            cartModalEmpty.style.display = hasItems ? 'none' : 'block';
        }

        function openCartModal(e) {
            if (e) e.preventDefault();
            renderCartModal();
            cartModal.classList.add('open');
        }

        function closeCartModal() {
            cartModal.classList.remove('open');
        }

        if (navCartLink) {
            navCartLink.addEventListener('click', openCartModal);
        }

        if (cartModalClose) {
            cartModalClose.addEventListener('click', closeCartModal);
        }

        cartModal.addEventListener('click', (e) => {
            if (e.target === cartModal) {
                closeCartModal();
            }
        });

        cartModalList.addEventListener('click', async (e) => {
            if (e.target.classList.contains('cart-remove')) {
                const id = e.target.getAttribute('data-id');
                if (id && listCart[id]) {
                    delete listCart[id];
                    // sync deletion to server
                    const token = localStorage.getItem('authToken');
                    if (token) {
                        try {
                            await fetch(`${BACKEND_API_URL}/api/cart/item/${encodeURIComponent(id)}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': 'Bearer ' + token }
                            });
                        } catch (err) {
                            console.error('cart item delete error', err);
                        }
                    }
                    renderCartModal();
                    updateSummaryFromCart();
                }
            }
        });

        if (cartKeepShoppingBtn) {
            cartKeepShoppingBtn.addEventListener('click', function () {
                window.location.href = "/";
            });
        }

        if (cartCloseBottomBtn) {
            cartCloseBottomBtn.addEventListener('click', closeCartModal);
        }

        // Load cart from server on page load
        (async () => { await loadCartFromServer(); })();