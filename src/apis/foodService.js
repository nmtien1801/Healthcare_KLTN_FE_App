import customizeAxios from "../components/customizeAxios";

const GetListFoodService = (userID) => {
    return customizeAxios.get(`/GetListFood/${userID}`);
};

const InsertFoodsService = (data) => {
    return customizeAxios.post("/insertFoods", data);
};

export {
  GetListFoodService,
  InsertFoodsService,
};
