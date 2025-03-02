// config/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyD8jN02SrbGMO7MYbNsqWjHvhL5pDGXMZw",
    authDomain: "blindchatapp-19eb0.firebaseapp.com",
    projectId: "blindchatapp-19eb0",
    storageBucket: "blindchatapp-19eb0.firebasestorage.app",
    messagingSenderId: "976685612392",
    appId: "1:976685612392:web:d05c2ccb9001cfbe0b2add"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);



export { auth, db };
