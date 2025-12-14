import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, get, runTransaction } from 'firebase/database';

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
export const db = getDatabase(app);
export const eventsRef = ref(db, 'events');
export const visitCountRef = ref(db, 'visitCount');
export const exportUsageRef = ref(db, 'exportUsage');
export const socialFollowersRef = ref(db, 'socialFollowers');
export const orchestrasRef = ref(db, 'orchestras');

export { onValue, set, get, runTransaction };
