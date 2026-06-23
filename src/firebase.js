import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAp8dWPbB4RSc-AvD__52rGR1FMvIDZeDM",
  authDomain: "collablab-platform.firebaseapp.com",
  projectId: "collablab-platform",
  storageBucket: "collablab-platform.firebasestorage.app",
  messagingSenderId: "583271196185",
  appId: "1:583271196185:web:0e8d209bea3dab1f21ac88",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
