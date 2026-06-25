import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAp8dWPbB4RSc-AvD__52rGR1FMvIDZeDM",
  authDomain: "collablab-platform.firebaseapp.com",
  projectId: "collablab-platform",
  storageBucket: "collablab-platform.firebasestorage.app",
  messagingSenderId: "583271196185",
  appId: "1:583271196185:web:0e8d209bea3dab1f21ac88",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function clear() {
  try {
    console.log("Fetching sessions...");
    const sessions = await getDocs(collection(db, "sessions"));
    let count = 0;
    for (const doc of sessions.docs) {
      await deleteDoc(doc.ref);
      count++;
    }
    console.log(`Deleted ${count} sessions.`);

    console.log("Fetching sessionParticipants...");
    const participants = await getDocs(collection(db, "sessionParticipants"));
    count = 0;
    for (const doc of participants.docs) {
      await deleteDoc(doc.ref);
      count++;
    }
    console.log(`Deleted ${count} participants.`);
    console.log("Done");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
clear();
