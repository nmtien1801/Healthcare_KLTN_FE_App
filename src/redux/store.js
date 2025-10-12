import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import foodAiReducer from "./foodAiSlice";
import patientReducer from "./patientSlice";
import medicineAiReducer from "./medicineAiSlice";
import paymentReducer from "./paymentSlice";
import foodReducer from "./foodSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    foodAi: foodAiReducer,
    patient: patientReducer,
    medicineAi: medicineAiReducer,
    payment: paymentReducer,
    food: foodReducer,
  },
});
