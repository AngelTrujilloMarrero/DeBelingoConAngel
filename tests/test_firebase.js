import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, runTransaction } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const visitData = {
  timestamp: Date.now(),
  page: '/',
  country: 'Unknown',
  countryCode: 'UN',
  city: 'Unknown',
  referrer: 'direct',
  browser: 'Unknown',
  os: 'Android', // Or pixel 7a / redmi 11s specific?
  device: 'mobile',
  connection: 'wifi',
  languages: ['es-ES', 'en'], // Try an array!
  screenWidth: 1080,
  screenHeight: 2400,
  touchPoints: 10,
  touchSupport: true,
  // Add some typical things from getDeviceInfo
  pixelRatio: 2.75,
  colorDepth: 24,
  orientation: 'portrait-primary',
  language: 'es-ES',
  timezone: 'Atlantic/Canary',
  memory: 8,
  cores: 8,
};

// Limpiar campos undefined y NaN
const cleanData = Object.fromEntries(
  Object.entries(visitData).filter(([, v]) => v !== undefined && v !== null && !Number.isNaN(v))
);

async function testFirebase() {
  try {
    const visitsRef = ref(db, 'test/visits');
    console.log("Pushing to visitsRef...", cleanData);
    await push(visitsRef, cleanData);
    console.log("Pushed successfully.");
  } catch(e) {
    console.error("Error pushing:", e.message);
  }
  process.exit(0);
}
testFirebase();
