import { Platform } from "react-native";
import customizeAxios from "../components/customizeAxios";

const handleLoginApi = (phoneNumber, password) => {
  return customizeAxios.post(`/login`, { phoneNumber, password });
};

const doGetAccountService = () => {
  return customizeAxios.get("/account");
};

const registerService = (formData) => {
  return customizeAxios.post("/register", formData);
};

const sendCodeService = (email) => {
  return customizeAxios.post("/send-code", {
    email,
  });
};

const resetPasswordService = (email, code, password) => {
  return customizeAxios.post("/reset-password", {
    email,
    code,
    password,
  });
};

const changePasswordService = (phone, currentPassword, newPassword) => {
  return customizeAxios.post("/changePassword", {
    phone,
    currentPassword,
    newPassword,
  });
};



const verifyEmailService = (email) => {
  return customizeAxios.post("/verifyEmail", { email });
};

const logoutUserService = () => {
  return customizeAxios.post("/logout");
};

const verifyQRLoginService = (qrToken, userId) => {
  console.log("QR Token:", qrToken);
  console.log("User ID:", userId);
  return customizeAxios.post("/verify-qr-login", {
    qrToken,
    userId
  });
};

export {
  handleLoginApi,
  doGetAccountService,
  registerService,
  sendCodeService,
  resetPasswordService,
  changePasswordService,
  verifyEmailService,
  logoutUserService,
  verifyQRLoginService
};
