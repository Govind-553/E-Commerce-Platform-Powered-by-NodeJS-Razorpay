import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const configContent = `const firebaseConfig = {
  apiKey: "${process.env.FIREBASE_API_KEY || 'AIzaSyAj0htDaIfFhHukdP0cBT-dRUtPI8tu_fM'}",
  authDomain: "${process.env.FIREBASE_AUTH_DOMAIN || 'cartify-ecommerce-platform.firebaseapp.com'}",
  projectId: "${process.env.FIREBASE_PROJECT_ID || 'cartify-ecommerce-platform'}",
  storageBucket: "${process.env.FIREBASE_STORAGE_BUCKET || 'cartify-ecommerce-platform.firebasestorage.app'}",
  messagingSenderId: "${process.env.FIREBASE_MESSAGING_SENDER_ID || '431820945362'}",
  appId: "${process.env.FIREBASE_APP_ID || '1:431820945362:web:de5ec2eccedf28d9f0ba0b'}"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
`;

const outputPath = path.join(__dirname, 'frontend', 'js', 'firebaseConfig.js');

// Ensure directory exists
const dir = path.dirname(outputPath);
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(outputPath, configContent);

console.log(`Firebase config generated at ${outputPath}`);
