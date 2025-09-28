import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
    getBalanceService,
    depositService,
    createPaymentUrlService,
} from "../apis/paymentService";

const initialState = {
    balance: 0,
};

export const getBalance = createAsyncThunk(
    "payment/getBalance",
    async (userId, thunkAPI) => {
        const response = await getBalanceService(userId);
        return response;
    }
);

export const deposit = createAsyncThunk(
    "payment/deposit",
    async ({ userId, amount }, thunkAPI) => {
        const response = await depositService(userId, amount);
        return response;
    }
);

export const createPaymentUrl = createAsyncThunk(
    "payment/createPaymentUrl",
    async ({ amount, orderDescription, orderType, language, bankCode }, thunkAPI) => {
        const response = await createPaymentUrlService(amount, orderDescription, orderType, language, bankCode);
        return response;
    }
);

const paymentSlice = createSlice({
    name: "payment",
    initialState,

    reducers: {},

    extraReducers: (builder) => {
        // getBalance
        builder
            .addCase(getBalance.pending, (state) => { })
            .addCase(getBalance.fulfilled, (state, action) => { state.balance = action.payload.DT.balance })
            .addCase(getBalance.rejected, (state, action) => { });

        // deposit
        builder
            .addCase(deposit.pending, (state) => { })
            .addCase(deposit.fulfilled, (state, action) => { state.balance = action.payload.DT.balance })
            .addCase(deposit.rejected, (state, action) => { });

        // createPaymentUrl
        builder
            .addCase(createPaymentUrl.pending, (state) => { })
            .addCase(createPaymentUrl.fulfilled, (state, action) => { })
            .addCase(createPaymentUrl.rejected, (state, action) => { });
    },
});

// Export actions
export const { } = paymentSlice.actions;

// Export reducer
export default paymentSlice.reducer;
