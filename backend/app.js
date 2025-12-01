require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const http = require('http').Server(app);
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));

// Serve Static files from frontend 
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

app.get('/checkout.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'checkout.html'));
});

app.get('/order.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'order.html'));
});

app.get('/success.html', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'success.html'));
});

// Import and use payment routes
const paymentRoute = require('./routes/paymentRoute');
app.use('/', paymentRoute);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});