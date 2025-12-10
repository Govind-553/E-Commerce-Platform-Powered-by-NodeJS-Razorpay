const express = require('express');
const router = express.Router();
const { syncUser } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/sync', verifyToken, syncUser);

module.exports = router;
