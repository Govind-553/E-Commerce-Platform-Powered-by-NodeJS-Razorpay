import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* Output path(frontend/public/js/firebaseConfig.js) */
const outputPath = path.join(__dirname, 'public', 'js', 'firebaseConfig.js');

/* Firebase config content */
const configContent = `
// AUTO-GENERATED FILE — DO NOT EDIT
// Generated during Vercel build

const firebaseConfig = {
  apiKey: "${process.env.FIREBASE_API_KEY}",
  authDomain: "${process.env.FIREBASE_AUTH_DOMAIN}",
  projectId: "${process.env.FIREBASE_PROJECT_ID}",
  storageBucket: "${process.env.FIREBASE_STORAGE_BUCKET}",
  messagingSenderId: "${process.env.FIREBASE_MESSAGING_SENDER_ID}",
  appId: "${process.env.FIREBASE_APP_ID}"
};

if (typeof firebase !== "undefined" && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
`;

try {
  fs.writeFileSync(outputPath, configContent, { encoding: 'utf-8' });

  console.log("✅ Firebase config generated successfully!");
  console.log(`📄 Location: ${outputPath}`);
  console.log("🚀 Ready for Vercel deployment");

} catch (err) {
  console.error("❌ Failed to write firebaseConfig.js");
  console.error(err);
  process.exit(1);
}
