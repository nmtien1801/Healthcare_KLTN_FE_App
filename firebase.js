// src/firebase.js
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  initializeAuth, 
  getReactNativePersistence  
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

// Khởi tạo Firebase App (chỉ 1 lần)
const app = initializeApp(firebaseConfig);

// 🚀 Fix: tránh lỗi "auth/already-initialized"
let auth;
try {
  auth = getAuth(app); // thử lấy auth nếu đã có
} catch (e) {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

export { app };

// Firebase services
export { auth };
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();
export const dbCall = getDatabase(app);
