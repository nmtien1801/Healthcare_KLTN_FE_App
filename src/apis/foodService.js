import customizeAxios from "../components/customizeAxios";

const GetListFoodService = (userID) => {
  return customizeAxios.get(`/GetListFood/${userID}`);
};

const InsertFoodsService = (data) => {
  return customizeAxios.post("/insertFoods", data);
};

const updateStatusFoodService = (id, checked) => {
  return customizeAxios.post("/updateStatusFood", { id, checked });
};

export { GetListFoodService, InsertFoodsService, updateStatusFoodService };
