import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, get, runTransaction } from 'firebase/database';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, getToken } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Debug check for missing configuration
if (!firebaseConfig.databaseURL) {
  console.error(
    "🔥 FIREBASE ERROR: VITE_FIREBASE_DATABASE_URL is not defined in your environment variables.\n" +
    "Please create a .env file in the project root based on .env.example and restart the server."
  );
}

const app = initializeApp(firebaseConfig);

// Initialize App Check
let appCheck: any = null;
if (typeof window !== 'undefined') {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';
  console.log('🛡️ Initializing App Check with App ID:', firebaseConfig.appId.substring(0, 15) + '...');

  try {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(siteKey),
      isTokenAutoRefreshEnabled: true
    });
    console.log('✅ App Check provider initialized.');
  } catch (err) {
    console.error('❌ Failed to initialize App Check:', err);
  }
}

/**
 * Gets the current App Check token
 */
export const getAppCheckToken = async () => {
  if (!appCheck) return null;
  try {
    const result = await getToken(appCheck, false);
    return result.token;
  } catch (error) {
    console.error("Error getting App Check token:", error);
    return null;
  }
};

export const db = getDatabase(app);
export const eventsRef = ref(db, 'events');
export const eventDeletionsRef = ref(db, 'eventDeletions');
export const visitCountRef = ref(db, 'visitCount');
export const exportUsageRef = ref(db, 'exportUsage');
export const socialFollowersRef = ref(db, 'socialFollowers');
export const orchestrasRef = ref(db, 'orchestras');
export const mapUsageRef = ref(db, 'mapUsage');

export { onValue, set, get, runTransaction, ref };
