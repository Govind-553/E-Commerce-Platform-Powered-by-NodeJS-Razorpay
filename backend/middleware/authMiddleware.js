const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');

/* Firebase Admin Initialization */
if (!admin.apps.length) {
  try {
    let serviceAccount;

    // 1️⃣ Render Secret File (Production)
    const renderSecretPath = '/etc/secrets/firebaseServiceAccount.json';

    if (fs.existsSync(renderSecretPath)) {
      serviceAccount = JSON.parse(
        fs.readFileSync(renderSecretPath, 'utf8')
      );
      console.log('✅ Firebase credentials loaded from Render Secret File');
    }

    else if (process.env.FIREBASE_CREDENTIALS) {
      serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
      console.log('⚠️ Firebase credentials loaded from ENV (local)');
    }

    else {
      throw new Error('Firebase credentials not found');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    console.log('🔥 Firebase Admin Initialized');

  } catch (error) {
    console.error('❌ Firebase Admin Initialization Failed');
    console.error(error.message);
  }
}

/* Verify Firebase Token */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.split(' ')[1]
    : null;

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;

    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    if (user) req.dbUser = user;

    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    return res.status(403).json({ message: 'Unauthorized' });
  }
};

/* Admin Guard */
const isAdmin = (req, res, next) => {
  if (req.dbUser?.role === 'admin') return next();
  if (req.user?.admin === true) return next();

  return res.status(403).json({ message: 'Access denied: Admin only' });
};

module.exports = { verifyToken, isAdmin };
