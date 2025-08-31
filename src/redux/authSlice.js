import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  handleLoginApi,
  registerService,
  sendCodeService,
  resetPasswordService,
  changePasswordService,
  verifyEmailService,
} from "../apis/authService";

const initialState = {
  user: null, // user info nào login(hs - teacher)
  isLoggedIn: false, // kiểm tra xem đã login chưa -> chặn nếu chưa login
  isLoading: false,
  isError: false,
};

// action -> export
export const Login = createAsyncThunk(
  "auth/Login",
  async ({ user }, thunkAPI) => {
    const response = await handleLoginApi(user);
    return response;
  }
);

export const register = createAsyncThunk(
  "auth/register",
  async (formData, thunkAPI) => {
    const response = await registerService({ formData });
    console.log("sss", response);

    return response;
  }
);

export const sendCode = createAsyncThunk(
  "auth/sendCode",
  async (email, thunkAPI) => {
    const response = await sendCodeService(email);

    return response;
  }
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ email, code, password }, thunkAPI) => {
    const response = await resetPasswordService(email, code, password);
    return response;
  }
);

export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async ({ phone, currentPassword, newPassword }, thunkAPI) => {
    const response = await changePasswordService(
      phone,
      currentPassword,
      newPassword
    );
    return response;
  }
);

export const verifyEmail = createAsyncThunk(
  "auth/verifyEmail",
  async (email, thunkAPI) => {
    const response = await verifyEmailService(email);
    return response;
  }
);

// đây là reducer
const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    logout: (state) => {
      state.user = null; // Xóa thông tin người dùng
      state.isLoggedIn = false; // Đặt trạng thái đăng xuất
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    clearUser: (state) => {
      state.user = null;
    },
  },

  // dùng api mới sử dụng extraReducers
  // 3 trạng thái của api: pending, fulfilled, rejected
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(Login.pending, (state) => {
        state.isLoading = true; // Bắt đầu loading
      })
      .addCase(Login.fulfilled, (state, action) => {
        if (action.payload.EC === 0) {
          state.userInfo = action.payload.DT || {};

          state.isLoggedIn = true;
          state.isLoading = false; // Kết thúc loading
        }
      })
      .addCase(Login.rejected, (state, action) => {
        state.isLoggedIn = false;
        state.isLoading = false; // Kết thúc loading
      });

    // register
    builder
      .addCase(register.pending, (state) => {})
      .addCase(register.fulfilled, (state, action) => {})
      .addCase(register.rejected, (state, action) => {});

    // sendCode
    builder
      .addCase(sendCode.pending, (state) => {})
      .addCase(sendCode.fulfilled, (state, action) => {})
      .addCase(sendCode.rejected, (state, action) => {});

    // resetPassword
    builder
      .addCase(resetPassword.pending, (state) => {})
      .addCase(resetPassword.fulfilled, (state, action) => {})
      .addCase(resetPassword.rejected, (state, action) => {});

    // changePassword
    builder
      .addCase(changePassword.pending, (state) => {})
      .addCase(changePassword.fulfilled, (state, action) => {})
      .addCase(changePassword.rejected, (state, action) => {});

    //verifyEmail
    builder
      .addCase(verifyEmail.pending, (state) => {})
      .addCase(verifyEmail.fulfilled, (state, action) => {})
      .addCase(verifyEmail.rejected, (state, action) => {});
  },
});

// Export actions
export const { setUser, clearUser, logout } = authSlice.actions;

export default authSlice.reducer;
