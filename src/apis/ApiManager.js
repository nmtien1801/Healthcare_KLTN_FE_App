import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Use LAN IP on device (Android/iOS), localhost on web
const URL_ANDROID = "http://192.168.1.81:8080/api";
const URL_WEB = "http://localhost:8080/api";
const BASE_URL =
    Platform.OS === "android" || Platform.OS === "ios" ? URL_ANDROID : URL_WEB;

const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
    responseType: "json",
});

// Interceptor cho request
const getToken = async () => {
    return await AsyncStorage.getItem("access_Token");
};

api.interceptors.request.use(async (config) => {
    const token = await getToken(); // Lấy access token từ AsyncStorage

    if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
});

export const ApiManager = {
    get: async (url, { params } = {}) => {
        const res = await api.get(url, { params });
        return res.data;
    },
    post: async (url, data) => {
        const res = await api.post(url, data);
        return res.data;
    },
    put: async (url, data) => {
        const res = await api.put(url, data);
        return res.data;
    },
    delete: async (url, data) => {
        const res = await api.delete(url, { data });
        return res.data;
    },
    patch: async (url, data) => {
        const res = await api.patch(url, data);
        return res.data;
    },
};

export default ApiManager;