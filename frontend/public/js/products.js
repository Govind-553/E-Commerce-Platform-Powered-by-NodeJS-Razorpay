    // Auth Check
    document.addEventListener('DOMContentLoaded', () => {
        const token = localStorage.getItem('authToken');
        const role = localStorage.getItem('userRole');
        const authSection = document.getElementById('auth-section');
        
        if (token) {
             let dropdownLinks = `<a href="/profile">My Profile</a>`;
             if (role === 'admin') {
                 dropdownLinks += `<a href="/admin">Admin Dashboard</a>`;
             }
             dropdownLinks += `<a href="#" onclick="logout()">Logout</a>`;

             authSection.innerHTML = `
                <div class="user-menu" onclick="toggleDropdown()">
                    <div class="user-icon">U</div>
                    <div class="dropdown" id="userDropdown">
                        ${dropdownLinks}
                    </div>
                </div>
            `;
        }
    });

    function toggleDropdown() {
        const d = document.getElementById('userDropdown');
        if(d) d.classList.toggle('show');
    }

    function logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        // clear client-side cart and cookie when logging out
        listCart = {};
        document.cookie = "listCart=" + JSON.stringify(listCart) + "; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        // clear authToken cookie too
        document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        window.location.reload();
    }

    // Modal helpers for login-required message
    function showLoginModal(){
        const m = document.getElementById('loginModal');
        if(m){ m.style.display = 'flex'; }
    }
    function hideLoginModal(){
        const m = document.getElementById('loginModal');
        if(m){ m.style.display = 'none'; }
    }
    document.addEventListener('click', (e)=>{
        if(e.target && e.target.id === 'loginModalClose') hideLoginModal();
    });

let iconCart = document.querySelector('.iconCart');
let cart = document.querySelector('.cart');
let container = document.querySelector('.container');
let close = document.querySelector('.close');

cart.style.right = '-100%';

iconCart.addEventListener('click', () => {
    const isHidden = cart.style.right === '-100%';
    if (isHidden) {
        cart.style.right = '0%';
        if (window.innerWidth > 768) {
            container.style.transform = 'translateX(-400px)';
        } else {
            container.style.transform = 'translateX(0px)';
        }
    } else {
        cart.style.right = '-100%';
        container.style.transform = 'translateX(0px)';
    }
});

close.addEventListener('click', () => {
    cart.style.right = '-100%';
    container.style.transform = 'translateX(0px)';
});

let products = null;

fetch(`${BACKEND_API_URL}/api/products`)
    .then(response => response.json())
    .then(data => {
        products = data;
        addDataToHTML();
});

function addDataToHTML() {
    let listProductHTML = document.querySelector('.listProduct');
    listProductHTML.innerHTML = '';

    if (products != null) {
        products.forEach(product => {
            let newProduct = document.createElement('div');
            newProduct.classList.add('item');
            newProduct.innerHTML = 
            `<img src="${product.image}" alt="">
            <h2>${product.name}</h2>
            <div class="price">Amount:- Rs.${product.price}</div>
            <button onclick="addCart('${product._id}')">Add To Cart</button>`;

            listProductHTML.appendChild(newProduct);
        });
    }
}

let listCart = {};
async function checkCart() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        listCart = {};
        document.cookie = "listCart=" + JSON.stringify({}) + "; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        return;
    }

    await loadServerCart();
}
checkCart();

async function loadServerCart(){
    const token = localStorage.getItem('authToken');
    if (!token) { listCart = {}; return; }
    try {
        const res = await fetch(`${BACKEND_API_URL}/api/cart`, { headers: { 'Authorization': 'Bearer ' + token } });
        if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('userRole');
            }
            listCart = {};
            addCartToHTML();
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
        addCartToHTML();
    } catch (e) {
        console.error('loadServerCart error', e);
    }
}

async function syncCartToServer(){
    const token = localStorage.getItem('authToken');
    if (!token) return;
    const items = Object.keys(listCart).map(k => ({ productId: listCart[k]._id, quantity: listCart[k].quantity }));
    try {
        await fetch(`${BACKEND_API_URL}/api/cart`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ items })
        });
        // update cookie for backward compatibility
        document.cookie = "listCart=" + JSON.stringify(listCart) + "; expires=Thu, 31 Dec 2025 23:59:59 UTC; path=/;";
    } catch (e) {
        console.error('syncCartToServer error', e);
    }
}

async function postCartItemServer(productId, quantity){
    const token = localStorage.getItem('authToken');
    if (!token) return;
    try {
        const res = await fetch(`${BACKEND_API_URL}/api/cart/item`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ productId, quantity })
        });
        if (res.ok) {
            const j = await res.json();
            // update local snapshot from server response
            // rebuild listCart from j.items
            listCart = {};
            if (Array.isArray(j.items)) {
                j.items.forEach(it => {
                    const pid = it.product?._id || it.product || (it.productId || it._id);
                    listCart[pid] = { _id: pid, image: it.image, name: it.name, price: it.price, quantity: it.quantity };
                });
            }
            addCartToHTML();
        }
    } catch (e) {
        console.error('postCartItemServer error', e);
    }
}

async function deleteCartItemServer(productId){
    const token = localStorage.getItem('authToken');
    if (!token) return;
    try {
        const res = await fetch(`${BACKEND_API_URL}/api/cart/item/${encodeURIComponent(productId)}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + token }
        });
        if (res.ok) {
            const j = await res.json();
            listCart = {};
            if (Array.isArray(j.items)) {
                j.items.forEach(it => {
                    const pid = it.product?._id || it.product || (it.productId || it._id);
                    listCart[pid] = { _id: pid, image: it.image, name: it.name, price: it.price, quantity: it.quantity };
                });
            }
            addCartToHTML();
        }
    } catch (e) {
        console.error('deleteCartItemServer error', e);
    }
}

async function addCart(idProduct) {
    const token = localStorage.getItem('authToken');
    if (!token) {
        showLoginModal();
        return;
    }
    // ensure we have latest server cart
    await loadServerCart();

    if (!listCart[idProduct]) {
        const product = products.find(p => p._id == idProduct || p.id == idProduct);
        if (!product) return;
        listCart[idProduct] = { _id: idProduct, image: product.image, name: product.name, price: product.price, quantity: 1 };
    } else {
        listCart[idProduct].quantity++;
    }

    // use per-item endpoint to update server
    await postCartItemServer(idProduct, listCart[idProduct].quantity);
    addCartToHTML();
    Toast.show('Product added to cart!', 'success');
}

function addCartToHTML() {
    let listCartHTML = document.querySelector('.listCart');
    listCartHTML.innerHTML = '';

    let totalHTML = document.querySelector('.totalQuantity');
    const token = localStorage.getItem('authToken');
    if (!token) {
        // If not authenticated, do not show cart items.
        listCartHTML.innerHTML = '<div style="padding:18px; color:#f3f4f6;">Please sign in to view your cart.</div>';
        if (totalHTML) totalHTML.innerText = 0;
        return;
    }
    let totalQuantity = 0;
    for (let id in listCart) {
        if (listCart[id]) {
            let product = listCart[id];
            let newCart = document.createElement('div');
            newCart.classList.add('item');
            // use the loop key `id` for quantity changes so we correctly reference the stored cart item
            newCart.innerHTML = 
                `<img src="${product.image}">
                <div class="content">
                    <div class="name">${product.name}</div>
                    <div class="price">Amount:- Rs.${product.price} / ${product.quantity} product(s)</div>
                </div>
                <div class="quantity">
                    <button onclick="changeQuantity('${id}', '-')">-</button>
                    <span class="value">${product.quantity}</span>
                    <button onclick="changeQuantity('${id}', '+')">+</button>
                </div>`;
            listCartHTML.appendChild(newCart);
            totalQuantity += product.quantity;
        }
    }
    totalHTML.innerText = totalQuantity;
}

function changeQuantity($idProduct, $type){
    switch ($type) {
        case '+':
            if (listCart[$idProduct]) listCart[$idProduct].quantity++;
            break;
        case '-':
            if (listCart[$idProduct]) {
                listCart[$idProduct].quantity--;
                if(listCart[$idProduct].quantity <= 0){
                    // remove locally; backend call below will delete server item
                    delete listCart[$idProduct];
                }
            }
            break;
        default:
            break;
    }
    // use item-level endpoints to minimize payload
    if ($type === '+') {
        postCartItemServer($idProduct, listCart[$idProduct]?.quantity);
    } else if ($type === '-') {
        if (listCart[$idProduct]) {
            // quantity updated to >0, update server
            postCartItemServer($idProduct, listCart[$idProduct].quantity);
        } else {
            // removed locally, delete on server
            deleteCartItemServer($idProduct);
        }
    }
    addCartToHTML();
}

document.addEventListener('DOMContentLoaded', () => {
    let searchInput = document.getElementById('search-input');
    let searchButton = document.getElementById('search-button');
    let filterButtons = document.querySelectorAll('.button-value');

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            let category = button.textContent.toLowerCase();
            filterProducts(category);
        });
    });

    function filterProducts(category) {
        if (!Array.isArray(products)) return;

        let filteredProducts;
        if (category === 'all') {
            filteredProducts = products;
        } else {
            filteredProducts = products.filter(product => product.category.toLowerCase() === category);
        }
        updateProductDisplay(filteredProducts);
    }

    searchButton.addEventListener('click', () => {
        if (!Array.isArray(products)) return;

        let searchValue = searchInput.value.toLowerCase();
        if (searchValue) {
            let searchResults = products.filter(product =>
                product.name.toLowerCase().startsWith(searchValue)
            );
            updateProductDisplay(searchResults);
        } else {
            updateProductDisplay(products); 
        }
    });

    function updateProductDisplay(productList) {
        let listProductHTML = document.querySelector('.listProduct');
        listProductHTML.innerHTML = ''; 

        productList.forEach(product => {
            let newProduct = document.createElement('div');
            newProduct.classList.add('item');
            newProduct.innerHTML = `
                <img src="${product.image}" alt="">
                <h2>${product.name}</h2>
                <div class="price">Amount:- Rs.${product.price}</div>
                <button onclick="addCart('${product._id || product.id}')">Add To Cart</button>
            `;
            listProductHTML.appendChild(newProduct);
        });
    }

    if (Array.isArray(products) && products.length) {
        updateProductDisplay(products);
    }
});

window.addEventListener('load', () => {
    // ensure server cart is loaded for authenticated users
    loadServerCart();
});