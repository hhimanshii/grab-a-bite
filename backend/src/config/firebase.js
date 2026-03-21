const admin = require('firebase-admin');

// Note: To make this work, the developer needs to download their
// Firebase service account JSON and either set the FIREBASE_SERVICE_ACCOUNT
// environment variable or place it in a location accessible here.
// For now, we'll initialize it using application default credentials or a mocked path
// so the app doesn't crash on startup if not fully configured.

const fs = require('fs');
const path = require('path');

try {
  let serviceAccount;
  
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT env var exists but failed to parse. Falling back to file/mock.');
    }
  }

  // If env var failed or is missing, look for the file
  if (!serviceAccount) {
    const serviceAccountPath = path.join(__dirname, '../../service-account.json');
    if (fs.existsSync(serviceAccountPath)) {
      serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      console.log('✅ Loading Firebase credentials from service-account.json');
    }
  }

  if (serviceAccount && serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase Admin SDK initialized successfully');
  } else {
    console.warn('⚠️ No Firebase service account credentials found. Firebase Admin might not work correctly.');
    admin.initializeApp();
  }
} catch (error) {
  console.error('❌ Firebase Admin Initialization Error:', error.message);
}

module.exports = admin;
