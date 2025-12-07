import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchBloodSugarService,
  saveBloodSugarService,
  getPatientByIdService,
  updatePatientInfoService,
} from "../apis/patientService";

const initialState = {
  bloodSugar: [],
  patient: {},
};

export const fetchBloodSugar = createAsyncThunk(
  "patient/fetchBloodSugar",
  async ({ userId, type, days }, thunkAPI) => {
    const response = await fetchBloodSugarService(userId, type, days);
    return response;
  }
);

export const saveBloodSugar = createAsyncThunk(
  "patient/saveBloodSugar",
  async ({ userId, value, type }, thunkAPI) => {
    const response = await saveBloodSugarService(userId, value, type);
    return response;
  }
);

export const getPatientById = createAsyncThunk(
  "patient/getPatientById",
  async (userId, thunkAPI) => {
    const response = await getPatientByIdService(userId);
    return response;
  }
);

export const updatePatientInfo = createAsyncThunk(
  "patient/updatePatientInfo",
  async (data, thunkAPI) => {
    const response = await updatePatientInfoService(data);
    return response;
  }
);

const patientSlice = createSlice({
  name: "patient",
  initialState,

  reducers: {},

  extraReducers: (builder) => {
    // fetchBloodSugar
    builder
      .addCase(fetchBloodSugar.pending, (state) => {})
      .addCase(fetchBloodSugar.fulfilled, (state, action) => {
        state.bloodSugar = action.payload;
      })
      .addCase(fetchBloodSugar.rejected, (state, action) => {});

    // saveBloodSugar
    builder
      .addCase(saveBloodSugar.pending, (state) => {})
      .addCase(saveBloodSugar.fulfilled, (state, action) => {})
      .addCase(saveBloodSugar.rejected, (state, action) => {});

    // getPatientById
    builder
      .addCase(getPatientById.pending, (state) => {})
      .addCase(getPatientById.fulfilled, (state, action) => {
        state.patient = action.payload.DT.patient;
      })
      .addCase(getPatientById.rejected, (state, action) => {});

    // updatePatientInfo
    builder
      .addCase(updatePatientInfo.pending, (state) => {})
      .addCase(updatePatientInfo.fulfilled, (state, action) => {})
      .addCase(updatePatientInfo.rejected, (state, action) => {});
  },
});

// Export actions
export const {} = patientSlice.actions;

// Export reducer
export default patientSlice.reducer;
