import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc, query, where, getDocs, updateDoc, arrayUnion, doc, documentId, arrayRemove } from "firebase/firestore";
import * as Google from "expo-auth-session/providers/google";
import * as AuthSession from "expo-auth-session";


const firebaseConfig = {
  apiKey: "AIzaSyA9DWtnR-2MDE5EbShejUmAx4Xo5luoapI",
  authDomain: "vayomitra-b5eba.firebaseapp.com",
  projectId: "vayomitra-b5eba",
  storageBucket: "vayomitra-b5eba.firebasestorage.app",
  messagingSenderId: "411803081685",
  appId: "1:411803081685:web:7a46b92b104e86e540fb5c",
  measurementId: "G-Q3MNY1TFNX"
};

// 🔥 Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };
const db = getFirestore(app);

export { db, collection, addDoc, query, where, getDocs, updateDoc, arrayUnion, doc, documentId, arrayRemove };
