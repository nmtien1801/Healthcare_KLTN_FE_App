import AsyncStorage from "@react-native-async-storage/async-storage";
import customizeAxios from "../components/customizeAxios";

const handleLoginApi = (user) => {
  return customizeAxios.post("/login", { user });
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

export {
  handleLoginApi,
  registerService,
  sendCodeService,
  resetPasswordService,
  changePasswordService,
  verifyEmailService,
};
