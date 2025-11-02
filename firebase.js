// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID,
  FIREBASE_DATABASE_URL,
} from "@env";

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId: FIREBASE_APP_ID,
  measurementId: FIREBASE_MEASUREMENT_ID,
  databaseURL: FIREBASE_DATABASE_URL,
};

// Khởi tạo Firebase App (chỉ 1 lần)
const app = initializeApp(firebaseConfig);

// 🚀 Fix: tránh lỗi "auth/already-initialized"
let auth;
try {
  auth = getAuth(app); // thử lấy auth nếu đã có
} catch (e) {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
}

export { app };

// Firebase services
export { auth };
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();
export const dbCall = getDatabase(app);
