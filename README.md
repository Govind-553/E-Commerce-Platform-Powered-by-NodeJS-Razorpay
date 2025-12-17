# 🛒 Cartify — E-Commerce Platform Powered by Node.js & Razorpay

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-Backend-green?logo=node.js" />
  <img src="https://img.shields.io/badge/Express.js-Framework-black?logo=express" />
  <img src="https://img.shields.io/badge/MongoDB-Database-darkgreen?logo=mongodb" />
  <img src="https://img.shields.io/badge/Razorpay-Payments-blue?logo=razorpay" />
  <img src="https://img.shields.io/badge/Vercel-Frontend-black?logo=vercel" />
  <img src="https://img.shields.io/badge/Render-Backend-purple?logo=render" />
</p>

<p align="center">
  <strong>Full-Stack E-Commerce Platform with User & Admin Panel</strong>
</p>

---

**Cartify** is a full-stack e-commerce platform built with **Node.js (Express)**, **MongoDB**, and **Razorpay Payment Gateway**, featuring a modern responsive UI.  
The platform supports both **User-side shopping workflows** and **Admin-side product & order management**.

🧑‍💻 **Users** can browse products, manage carts, and checkout securely  
🛠️ **Admins** can manage products, orders, and monitor platform activity  

🔗 **Live Demo:** (Cartify-Ecommerce)[https://cartifyecommerce.vercel.app/]

---

## Features

### User Side

- **Responsive Product Catalog** — Browse multiple products with images, descriptions, and pricing. :contentReference[oaicite:1]{index=1}
- **Add to Cart & Cart Management** — Add items to a cart, adjust quantity, and remove items.  
- **Checkout with Razorpay** — Create orders and complete secure payments using Razorpay. :contentReference[oaicite:2]{index=2}
- **Order Confirmation** — After payment verification, users receive a confirmation with order details.

### Admin Side

- **Product Management** — Admins can add new products with images, edit product details, or remove products from store.
- **Order Management** — View all orders, filter by status, and manage order fulfillment.
- **User Management** — List and manage registered users (if implemented).
- **Dashboard Overview** — Quick overview of sales, orders, and recent activity.

### Payment & Validation

- **Secure Razorpay Integration** — Orders are created server-side using Razorpay SDK, and payment is verified with a secure signature check. :contentReference[oaicite:3]{index=3}
- **Order Verification API** — Ensures that payment is validated before confirming orders.

---

## Tech Stack

**Frontend**
- HTML / CSS / JavaScript  
- Responsive UI design  

**Backend**
- **Node.js** with **Express.js**
- Razorpay SDK for payment workflows :contentReference[oaicite:4]{index=4}

**Database**
- **MongoDB**

**Deployment**
- Vercel for production deployment
- Render for backend API 

---

## Getting Started

Follow these steps to run the project locally.

### Prerequisites

- Node.js (v14+ recommended)
- npm or yarn
- Razorpay account for API Keys :contentReference[oaicite:5]{index=5}

### Clone the repository

```bash
git clone https://github.com/Govind-553/E-Commerce-Platform-Powered-by-NodeJS-Razorpay.git
cd E-Commerce-Platform-Powered-by-NodeJS-Razorpay


