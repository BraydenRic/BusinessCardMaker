import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace with your Firebase config from Firebase Console
// Go to: https://console.firebase.google.com/
// Create a new project > Add Web App > Copy config
// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDkZe-SGqivvZjuqdSxMcSQVCw9MT34N4U",
  authDomain: "business-card-maker-92cf0.firebaseapp.com",
  projectId: "business-card-maker-92cf0",
  storageBucket: "business-card-maker-92cf0.firebasestorage.app",
  messagingSenderId: "273247645800",
  appId: "1:273247645800:web:473e2bc67e7eff52784bdd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export default app;
