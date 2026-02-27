// lib/firebase.ts
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyDSFwIxUzaG8kVIHynioD0wql7QJxOHmZo",
  authDomain: "silsilatul-quran.firebaseapp.com",
  projectId: "silsilatul-quran",
  storageBucket: "silsilatul-quran.firebasestorage.app",
  messagingSenderId: "277913591744",
  appId: "1:277913591744:web:3a3d211a34eb40ea813225"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
