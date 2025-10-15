import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  getTrendMedicine,
  applyMedicinesService,
  fetchMedicinesService,
  updateStatusMedicineService,
} from "../apis/medicineAiService";

const initialState = {
  trendMedicine: null,
  loading: false,
  error: null,
};

export const fetchTrendMedicine = createAsyncThunk(
  "medicineAi/fetchTrendMedicine",
  async ({ age, gender, BMI, HbA1c, bloodSugar }, thunkAPI) => {
    try {
      const response = await getTrendMedicine({
        age,
        gender,
        BMI,
        HbA1c,
        bloodSugar,
      });
      return response.result;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.result || error.message);
    }
  }
);

export const applyMedicines = createAsyncThunk(
  "medicineAi/applyMedicines",
  async ({ userId, name, time, lieu_luong, status }, thunkAPI) => {
    const response = await applyMedicinesService(
      userId,
      name,
      time,
      lieu_luong,
      status
    );
    return response;
  }
);

export const fetchMedicines = createAsyncThunk(
  "medicineAi/fetchMedicines ",
  async ({ userId, date }, thunkAPI) => {
    try {
      const response = await fetchMedicinesService(userId, date);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response || error.message);
    }
  }
);

export const updateStatusMedicine = createAsyncThunk(
  "medicineAi/updateStatusMedicine ",
  async ({id, status}, thunkAPI) => {
    try {
      const response = await updateStatusMedicineService(id, status);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response || error.message);
    }
  }
);

const medicineAiSlice = createSlice({
  name: "medicineAi",
  initialState,

  reducers: {
    clearTrendMedicine: (state) => {
      state.trendMedicine = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    // fetchTrendMedicine
    builder
      .addCase(fetchTrendMedicine.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrendMedicine.fulfilled, (state, action) => {
        state.loading = false;
        state.trendMedicine = action.payload;
        state.error = null;
      })
      .addCase(fetchTrendMedicine.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch trend medicine";
      });

    // applyMedicines
    builder
      .addCase(applyMedicines.pending, (state) => {})
      .addCase(applyMedicines.fulfilled, (state, action) => {})
      .addCase(applyMedicines.rejected, (state, action) => {});

    // fetchMedicines
    builder
      .addCase(fetchMedicines.pending, (state) => {})
      .addCase(fetchMedicines.fulfilled, (state, action) => {})
      .addCase(fetchMedicines.rejected, (state, action) => {});

    // updateStatusMedicine
    builder
      .addCase(updateStatusMedicine.pending, (state) => {})
      .addCase(updateStatusMedicine.fulfilled, (state, action) => {})
      .addCase(updateStatusMedicine.rejected, (state, action) => {});
  },
});

// Export actions
export const { clearTrendMedicine, clearError } = medicineAiSlice.actions;

// Export selectors
export const selectTrendMedicine = (state) => state.medicineAi.trendMedicine;
export const selectMedicineLoading = (state) => state.medicineAi.loading;
export const selectMedicineError = (state) => state.medicineAi.error;

// Export reducer
export default medicineAiSlice.reducer;
