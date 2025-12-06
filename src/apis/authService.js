import customizeAxios from "../components/customizeAxios";
import { auth } from "../../firebase";
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from "firebase/auth";

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

const changePasswordService = (email, currentPassword, newPassword) => {
  return customizeAxios.post("/changePassword", {
    email,
    currentPassword,
    newPassword,
  });
};

const verifyEmailService = (email) => {
  return customizeAxios.post("/verifyEmail", { email });
};

const changePasswordFirebaseService = async (
  email,
  currentPassword,
  newPassword
) => {
  try {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("Không tìm thấy người dùng đang đăng nhập");
    }

    // Xác thực lại người dùng bằng mật khẩu hiện tại
    const credential = EmailAuthProvider.credential(email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    // Cập nhật mật khẩu mới trên Firebase
    await updatePassword(user, newPassword);

    return {
      EC: 0,
      EM: "Đổi mật khẩu thành công",
      DT: null,
    };
  } catch (error) {
    console.error("Lỗi đổi mật khẩu Firebase:", error);
    let errorMessage = "Lỗi đổi mật khẩu";

    if (error.code === "auth/wrong-password") {
      errorMessage = "Mật khẩu hiện tại không chính xác";
    } else if (error.code === "auth/weak-password") {
      errorMessage = "Mật khẩu mới quá yếu";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      EC: 1,
      EM: errorMessage,
      DT: null,
    };
  }
};

export {
  handleLoginApi,
  registerService,
  sendCodeService,
  resetPasswordService,
  changePasswordService,
  verifyEmailService,
  changePasswordFirebaseService,
};
