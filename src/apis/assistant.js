import axios from "axios";

export const api = axios.create({
    baseURL: "http://127.0.0.1:8000", //local
    // baseURL: "https://3b9b19c0e64d.ngrok-free.app", // colab
    timeout: 5000,
    headers: { "Content-Type": "application/json" },
});

export const apply_medicine = axios.create({
    baseURL: "http://localhost:5678/webhook", //local
    timeout: 5000,
    headers: { "Content-Type": "application/json" },
});

