import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAp8dWPbB4RSc-AvD__52rGR1FMvIDZeDM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "collablab-platform.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "collablab-platform",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "collablab-platform.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "583271196185",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:583271196185:web:0e8d209bea3dab1f21ac88",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
