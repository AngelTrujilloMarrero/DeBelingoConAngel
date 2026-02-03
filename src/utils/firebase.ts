import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, get, runTransaction } from 'firebase/database';

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

/**
 * Gets unified security headers for API calls
 */
export const getSecurityHeaders = async () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  // 1. Intentar obtener el token de Turnstile del objeto global (seteado por TurnstileProvider)
  if (typeof window !== 'undefined' && (window as any)._turnstileToken) {
    headers['X-Turnstile-Token'] = (window as any)._turnstileToken;
  }

  // 2. Usar Secreto Compartido como respaldo definitivo
  headers['X-DeBelingo-Secret'] = 'debelingo-super-secret-2026';

  return headers;
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
