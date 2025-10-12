import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  InsertFoodsService,
  GetListFoodService,
  updateStatusFoodService,
} from "../apis/foodService";

const initialState = {
  totalCalo: 0,
};

export const GetListFood = createAsyncThunk(
  "food/GetListFood",
  async (userId, thunkAPI) => {
    const response = await GetListFoodService(userId);
    return response;
  }
);

export const InsertFoods = createAsyncThunk(
  "food/InsertFoods",
  async (data, thunkAPI) => {
    const response = await InsertFoodsService(data);
    return response;
  }
);

export const updateStatusFood = createAsyncThunk(
  "food/updateStatusFood",
  async ({ id, checked }, thunkAPI) => {
    const response = await updateStatusFoodService(id, checked);
    return response;
  }
);

const foodSlice = createSlice({
  name: "food",
  initialState,

  reducers: {},

  extraReducers: (builder) => {
    // GetListFood
    builder
      .addCase(GetListFood.pending, (state) => {})
      .addCase(GetListFood.fulfilled, (state, action) => {
        const currentFoodsArray = action.payload?.DT;
        let newTotalCalo = 0;
        if (Array.isArray(currentFoodsArray)) {
          newTotalCalo = currentFoodsArray.reduce((total, foodItem) => {
            const foodCalo = foodItem.calo || 0;
            return total + foodCalo;
          }, 0);
        }
        state.totalCalo = newTotalCalo;
      })
      .addCase(GetListFood.rejected, (state, action) => {});

    // InsertFoods
    builder
      .addCase(InsertFoods.pending, (state) => {})
      .addCase(InsertFoods.fulfilled, (state, action) => {
        const currentFoodsArray = action.payload?.DT;
        let newTotalCalo = 0;
        if (Array.isArray(currentFoodsArray)) {
          newTotalCalo = currentFoodsArray.reduce((total, foodItem) => {
            const foodCalo = foodItem.calo || 0;
            return total + foodCalo;
          }, 0);
        }
        state.totalCalo = newTotalCalo;
      })
      .addCase(InsertFoods.rejected, (state, action) => {});

    // updateStatusFood
    builder
      .addCase(updateStatusFood.pending, (state) => {})
      .addCase(updateStatusFood.fulfilled, (state, action) => {})
      .addCase(updateStatusFood.rejected, (state, action) => {});
  },
});

// Export actions
export const {} = foodSlice.actions;

// Export reducer
export default foodSlice.reducer;
