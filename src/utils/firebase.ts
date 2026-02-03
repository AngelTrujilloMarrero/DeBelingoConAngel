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
 * @param token Optional Turnstile token to override the global one
 */
export const getSecurityHeaders = async (token?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  // 1. Añadir clave interna si está disponible (para bypass de Turnstile en peticiones de fondo)
  const internalKey = import.meta.env.VITE_APP_INTERNAL_SECRET;
  if (internalKey) {
    headers['X-App-Internal-Key'] = internalKey;
  }

  // 2. Usar el token pasado por parámetro si existe
  if (token) {
    headers['X-Turnstile-Token'] = token;
  }
  // 3. Si no, intentar obtener el token del objeto global
  else if (typeof window !== 'undefined' && (window as any)._turnstileToken) {
    headers['X-Turnstile-Token'] = (window as any)._turnstileToken;
  }

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
