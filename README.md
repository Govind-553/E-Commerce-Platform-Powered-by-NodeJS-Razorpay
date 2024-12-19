# Razorpay Node.js Integration with Product Page 💻💳
This project demonstrates the integration of Razorpay payment gateway in a Node.js<br>
application. The application includes a responsive product page 🛍️ listing various<br>
products. Users can select a product and proceed to make a payment 💰. The payment<br> 
process involves creating an order via Razorpay and completing the transaction seamlessly.

### ✨ Features
* **🛒 Product Listing:** Display multiple products with their images, descriptions, and prices.
* **📱 Responsive Design:** Fully responsive for a smooth experience on all devices.
* **🔐 Payment Integration:** Securely handles payments with Razorpay's API.
* **📊 Order Management:** Creates and verifies orders dynamically.
* **🎨 Interactive UI:** Clean layout with hover effects and transitions for a better user experience.

### 🔄 Razorpay Integration Workflow

1. Order Creation 📝
* When a user selects a product and clicks "Pay Now," the server creates an order via Razorpay's API.
* The Razorpay order ID is sent to the client.

2. Payment Processing 🔒
* Razorpay Checkout is triggered with the order details.
* Users complete the payment securely.

3. Payment Verification 🛡️
* Razorpay sends a payment signature back to the server for verification.
* The server confirms the payment and completes the order.

### 🛠️ Key Technologies
* **Node.js:** Backend server logic.
* **Express.js:** Web framework for Node.js.
* **Razorpay SDK:** Payment gateway integration.
* **EJS:** Template engine for rendering pages.
* **CSS:** Responsive and interactive styling.
