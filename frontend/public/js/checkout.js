const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        mainNav.classList.toggle('open');
    });
}

const cartLink = document.getElementById('nav-cart-link');
const cartModal = document.getElementById('cart-modal');
const cartModalClose = document.querySelector('.cart-modal-close');
const cartModalList = document.querySelector('.cart-modal-list');
const cartModalEmpty = document.querySelector('.cart-modal-empty');
const cartKeepShoppingBtn = document.getElementById('cart-keep-shopping');
const cartCloseBottomBtn = document.getElementById('cart-close-bottom');

let listCart = {};

async function checkCart() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        // redirect to login if not authenticated
        window.location.href = '/login';
        return;
    }

    // fetch cart from server
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
        console.error('checkCart error', e);
        listCart = {};
    }
    addCartToHTML();
}

(async () => { await checkCart(); })();

function addCartToHTML() {
    const listCartHTML = document.querySelector('.returnCart .list');
    const totalQuantityHTML = document.querySelector('.totalQuantity');
    const totalPriceHTML = document.querySelector('.totalPrice');

    listCartHTML.innerHTML = '';
    let totalQuantity = 0;
    let totalPrice = 0;

    for (const id in listCart) {
        const product = listCart[id];
        if (product) {
            const newCart = document.createElement('div');
            newCart.classList.add('item');
            newCart.innerHTML =
                `<img src="${product.image}">
                 <div class="info">
                    <div class="name">${product.name}</div>
                    <div class="price">Rs.${product.price}/1 product</div>
                 </div>
                 <div class="quantity">${product.quantity}</div>
                 <div class="returnPrice">Amount: Rs.${product.price * product.quantity}</div>
                 <div class="deleteIcon" onclick="removeProduct(this, '${id}')">&times;</div>`;
            listCartHTML.appendChild(newCart);
            totalQuantity += product.quantity;
            totalPrice += (product.price * product.quantity);
        }
    }

    totalQuantityHTML.innerText = totalQuantity;
    totalPriceHTML.innerText = 'Rs.' + totalPrice;
    renderCartModal();
}

async function removeProduct(element, idProduct) {
    if (element && element.parentElement) {
        element.parentElement.remove();
    }
    delete listCart[idProduct];
    // sync removal to server
    const token = localStorage.getItem('authToken');
    if (token) {
        try {
            await fetch(`${BACKEND_API_URL}/api/cart/item/${encodeURIComponent(idProduct)}`, {
                method: 'DELETE',
                headers: { 'Authorization': 'Bearer ' + token }
            });
        } catch (e) {
            console.error('removeProduct sync error', e);
        }
    }
    addCartToHTML();
}

document.getElementById("checkout-button").addEventListener("click", function() {
    let totalQuantity = 0;
    let totalPrice = 0;

    for (const id in listCart) {
        const product = listCart[id];
        if (product) {
            totalQuantity += product.quantity;
            totalPrice += product.price * product.quantity;
        }
    }

    localStorage.setItem("cartSummary", JSON.stringify({ totalQuantity, totalPrice }));
    window.location.href = "/order.html";
});

function renderCartModal() {
    if (!cartModalList || !cartModalEmpty) return;
    cartModalList.innerHTML = '';
    let hasItems = false;

    for (const id in listCart) {
        const product = listCart[id];
        if (product) {
            hasItems = true;
            const item = document.createElement('div');
            item.className = 'cart-modal-item';
            item.innerHTML = `
                <img src="${product.image}">
                <div class="cart-modal-info">
                    <div class="cart-modal-name">${product.name}</div>
                    <div class="cart-modal-meta">Rs.${product.price} × ${product.quantity} = Rs.${product.price * product.quantity}</div>
                </div>
                <div class="cart-modal-qty">x${product.quantity}</div>
                <div class="cart-modal-remove" onclick="removeProduct(null, '${id}')">&times;</div>
            `;
            cartModalList.appendChild(item);
        }
    }

    cartModalEmpty.style.display = hasItems ? 'none' : 'block';
}

function openCartModal() {
    cartModal.classList.add('open');
    renderCartModal();
}

function closeCartModal() {
    cartModal.classList.remove('open');
}

if (cartLink) {
    cartLink.addEventListener('click', function(e) {
        e.preventDefault();
        openCartModal();
    });
}

if (cartModalClose) {
    cartModalClose.addEventListener('click', closeCartModal);
}

if (cartModal) {
    cartModal.addEventListener('click', function(e) {
        if (e.target === cartModal) {
            closeCartModal();
        }
    });
}

if (cartKeepShoppingBtn) {
    cartKeepShoppingBtn.addEventListener('click', function () {
        window.location.href = "/";
    });
}

if (cartCloseBottomBtn) {
    cartCloseBottomBtn.addEventListener('click', closeCartModal);
}