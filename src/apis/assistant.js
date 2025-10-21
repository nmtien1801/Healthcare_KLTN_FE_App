import axios from "axios";
import { Platform } from "react-native";

const URL_ANDROID = "http://192.168.1.8:5678";
const URL_WEB = "http://localhost:5678";
const BASE_URL =
    Platform.OS === "android" || Platform.OS === "ios" ? URL_ANDROID : URL_WEB;

export const api = axios.create({
    baseURL: "http://10.0.2.2:8000", //local
    // baseURL: "https://3b9b19c0e64d.ngrok-free.app", // colab
    timeout: 5000,
    headers: { "Content-Type": "application/json" },
});

export const book_appointment = axios.create({
    baseURL: `${BASE_URL}/webhook`, //local
    timeout: 5000,
    headers: { "Content-Type": "application/json" },
});

export const get_advice = axios.create({
    baseURL: `${BASE_URL}/webhook`, //local
    timeout: 5000,
    headers: { "Content-Type": "application/json" },
});

