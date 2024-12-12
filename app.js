require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const http = require('http').Server(app);
// Set the view engine and views directory
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const viewsPath = path.join(__dirname, '../views');

// Import and use payment routes
const paymentRoute = require('./routes/paymentRoute');
app.use('/', paymentRoute);

// Serve checkout-page
app.get('/Checkout', (req, res) => {
    res.sendFile(path.join(__dirname, '/Checkout', 'checkout.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
