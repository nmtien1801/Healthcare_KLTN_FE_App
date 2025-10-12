import axios from "axios";

export const api = axios.create({
    baseURL: "http://10.0.2.2:8000", //local
    // baseURL: "https://3b9b19c0e64d.ngrok-free.app", // colab
    timeout: 5000,
    headers: { "Content-Type": "application/json" },
});

export const book_appointment = axios.create({
    baseURL: "http://localhost:5678/webhook", //local
    timeout: 5000,
    headers: { "Content-Type": "application/json" },
});

export const get_advice = axios.create({
    baseURL: "http://localhost:5678/webhook", //local
    timeout: 5000,
    headers: { "Content-Type": "application/json" },
});

