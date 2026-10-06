import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, runTransaction } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCg1OiMDsmfoAGpSVYRnvWdl4tSPnLVoUo",
  authDomain: "debelingoconangel.firebaseapp.com",
  databaseURL: "https://debelingoconangel-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "debelingoconangel",
  storageBucket: "debelingoconangel.appspot.com",
  messagingSenderId: "690632293636",
  appId: "1:690632293636:web:5ccf13559fccf3d53a2451",
  measurementId: "G-T8BV0MLJQJ"
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
