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

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const eventsRef = ref(db, 'events');
export const eventDeletionsRef = ref(db, 'eventDeletions');
export const visitCountRef = ref(db, 'visitCount');
export const exportUsageRef = ref(db, 'exportUsage');
export const socialFollowersRef = ref(db, 'socialFollowers');
export const orchestrasRef = ref(db, 'orchestras');

export { onValue, set, get, runTransaction };
