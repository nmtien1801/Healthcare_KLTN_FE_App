import customizeAxios from "../components/customizeAxios";

const suggestFoods = (min, max, mean, currentCalo, menuFoodId) => {
  return customizeAxios.post("/trendFood", {
    min,
    max,
    mean,
    currentCalo,
    menuFoodId
  });
};

const GetCaloFoodService = (userId) => {
  return customizeAxios.post("/GetCaloFood", { userId });
};

const updateMenuFoodService = (menuFoodId, userId) => {
  return customizeAxios.post("/updateMenuFood", { menuFoodId, userId });
};

const getMenuFoodService = () => {
  return customizeAxios.get("/getMenuFood");
};

export {
  suggestFoods,
  GetCaloFoodService,
  updateMenuFoodService,
  getMenuFoodService,
};
