import axios from "axios";
import { Platform } from "react-native";
import { EXPO_PUBLIC_URL_N8N, EXPO_PUBLIC_URL_ChatBot } from '@env';

export const api = axios.create({
    baseURL: EXPO_PUBLIC_URL_ChatBot,
    timeout: 5000,
    headers: { "Content-Type": "application/json" },
});

export const book_appointment = axios.create({
    baseURL: `${EXPO_PUBLIC_URL_N8N}/webhook`, //local
    timeout: 5000,
    headers: { "Content-Type": "application/json" },
});

export const get_advice = axios.create({
    baseURL: `${EXPO_PUBLIC_URL_N8N}/webhook`, //local
    timeout: 5000,
    headers: { "Content-Type": "application/json" },
});

