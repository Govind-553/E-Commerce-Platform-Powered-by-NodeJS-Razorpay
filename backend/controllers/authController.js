const User = require('../models/User');

// @desc    Sync user from Firebase to MongoDB
// @route   POST /api/auth/sync
// @access  Private
const syncUser = async (req, res) => {
  try {
    const { uid, email, name, picture } = req.user; // from verifyToken middleware

    let user = await User.findOne({ firebaseUid: uid });

    if (user) {
      // Update existing user info if needed
      user.name = name || user.name;
      user.email = email || user.email;
      // user.picture = picture; // If we add picture to model
      await user.save();
      res.json(user);
    } else {
      // Create new user
      user = new User({
        firebaseUid: uid,
        name: name || 'User',
        email: email,
        role: 'user', // Default role
      });
      await user.save();
      res.status(201).json(user);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { syncUser };
