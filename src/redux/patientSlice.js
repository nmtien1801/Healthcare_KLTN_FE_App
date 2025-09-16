import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
    fetchBloodSugarService,
    saveBloodSugarService
} from "../apis/patientService";

const initialState = {
    bloodSugar: []
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

const patientSlice = createSlice({
    name: "patient",
    initialState,

    reducers: {},

    extraReducers: (builder) => {
        // fetchBloodSugar
        builder
            .addCase(fetchBloodSugar.pending, (state) => { })
            .addCase(fetchBloodSugar.fulfilled, (state, action) => {
                state.bloodSugar = action.payload;
            })
            .addCase(fetchBloodSugar.rejected, (state, action) => { });

        // saveBloodSugar
        builder
            .addCase(saveBloodSugar.pending, (state) => { })
            .addCase(saveBloodSugar.fulfilled, (state, action) => { })
            .addCase(saveBloodSugar.rejected, (state, action) => { });
    },
});

// Export actions
export const { } = patientSlice.actions;

// Export reducer
export default patientSlice.reducer;
