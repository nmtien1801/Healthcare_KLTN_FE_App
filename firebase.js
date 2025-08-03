// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDcis3qmp7pQmd-pbnQ4ZhwcL9Q6SjDrSw",
  authDomain: "test-chat-firebase-8ef22.firebaseapp.com",
  projectId: "test-chat-firebase-8ef22",
  storageBucket: "test-chat-firebase-8ef22.firebasestorage.app",
  messagingSenderId: "1099403948301",
  appId: "1:1099403948301:web:fa16665eb9dfb40ec44044",
  measurementId: "G-6SVYBYHMZD",
  databaseURL:
    "https://test-chat-firebase-8ef22-default-rtdb.asia-southeast1.firebasedatabase.app",
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);

// Export các dịch vụ cần dùng
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();

// Đây là Realtime Database
export const dbCall = getDatabase(app);
