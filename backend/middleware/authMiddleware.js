const admin = require('firebase-admin');
const User = require('../models/User');

// Initialize Firebase Admin
// You must provide the serviceAccountKey.json or set environment variables
try {
  const serviceAccount = process.env.FIREBASE_CREDENTIALS 
    ? JSON.parse(process.env.FIREBASE_CREDENTIALS)
    : require('../serviceAccountKey.json');

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin Initialized');
} catch (error) {
  console.warn('Firebase Admin Initialization Failed: Provide serviceAccountKey.json or FIREBASE_CREDENTIALS env var to use Auth features.');
}

const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    
    // Check if user exists in our DB, if not sync (optional, or do it in a separate route)
    // For now, let's just fetch the role from our DB if the user exists
    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    if (user) {
      req.dbUser = user;
    }

    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(403).json({ message: 'Unauthorized', error: error.message });
  }
};

const isAdmin = async (req, res, next) => {
  if (req.dbUser && req.dbUser.role === 'admin') {
    next();
  } else {
    // Fallback: Check custom claims if we set them in firebase
    if (req.user.admin) {
        next();
    } else {
        res.status(403).json({ message: 'Access denied: Admin only' });
    }
  }
};

module.exports = { verifyToken, isAdmin };
