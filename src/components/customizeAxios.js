import axios from "axios";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
//SEARCH: axios npm github

const URL_ANDROID = "http://192.168.1.101:8080/api";
const URL_WEB = "http://localhost:8080/api";

const baseUrl =
  Platform.OS === "android" || Platform.OS === "ios"
    ? URL_ANDROID // URL cho Android và iOS
    : URL_WEB; // URL cho web hoặc môi trường khác

// Set config defaults when creating the instance
const instance = axios.create({
  baseURL: baseUrl,
  withCredentials: true, // để FE có thể nhận cookie từ BE
});

// Interceptor cho request
const getToken = async () => {
  return await AsyncStorage.getItem("access_Token");
};

instance.interceptors.request.use(
  async (config) => {
    const token = await getToken(); // Lấy access token từ AsyncStorage
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`; // Thêm Bearer token vào header
    }
    console.log("Body:", config.data);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => (response && response.data ? response.data : response),
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status || 500;
    switch (status) {
      case 401: {
        const navigation = useNavigation();
        const currentRoute =
          navigation.getState().routes[navigation.getState().index].name;

        if (["Login", "Register", "ResetPassword"].includes(currentRoute)) {
          console.warn("401 on auth page, skip refresh");
          return Promise.reject(error);
        }
      }

      // bad request
      case 400: {
        return error.response.data; // Bad request
      }

      // forbidden (permission related issues)
      case 403: {
        return Promise.reject(error);
      }

      // not found get /post / delete /put
      case 404: {
        return Promise.reject(error);
      }

      // conflict
      case 409: {
        return Promise.reject(error);
      }

      // unprocessable
      case 422: {
        return Promise.reject(error);
      }

      // generic api error (server related) unexpected
      default: {
        return Promise.reject(error);
      }
    }
  }
);

export default instance;
