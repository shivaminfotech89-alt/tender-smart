import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { initializeFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, addDoc, onSnapshot } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import config from '../../firebase-applet-config.json';

const app = initializeApp(config);
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true
}, config.firestoreDatabaseId);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, signOut, onAuthStateChanged };
export { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, addDoc, onSnapshot };
export { ref, uploadBytes, getDownloadURL };
