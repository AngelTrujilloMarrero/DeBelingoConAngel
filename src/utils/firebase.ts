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

// Initialize App Check (DISABLED to avoid reCAPTCHA 400 errors)
let appCheck: any = null;
/*
if (typeof window !== 'undefined') {
  try {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(import.meta.env.VITE_RECAPTCHA_SITE_KEY || ''),
      isTokenAutoRefreshEnabled: true
    });
  } catch (err) {
    // Silently continue
  }
}
*/

/**
 * Gets unified security headers for API calls
 */
export const getSecurityHeaders = async () => {
  const headers: Record<string, string> = {};

  // 1. Intentar App Check
  if (appCheck) {
    try {
      const result = await getToken(appCheck, false);
      headers['X-Firebase-AppCheck'] = result.token;
    } catch (e) {
      // Ignorar fallo de reCAPTCHA
    }
  }

  // 2. Usar Secreto Compartido como respaldo
  headers['X-DeBelingo-Secret'] = 'debelingo-super-secret-2026';

  return headers;
};

/**
 * Gets the current App Check token
 */
export const getAppCheckToken = async () => {
  if (!appCheck) return null;
  try {
    const result = await getToken(appCheck, false);
    return result.token;
  } catch (error) {
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
