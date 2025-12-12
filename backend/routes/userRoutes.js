const express = require('express');
const router = express.Router();
const { updateUserProfile, getUserProfile, getUsers } = require('../controllers/userController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

router.get('/profile', verifyToken, getUserProfile);
router.put('/profile', verifyToken, updateUserProfile);
router.get('/', verifyToken, isAdmin, getUsers);

module.exports = router;
