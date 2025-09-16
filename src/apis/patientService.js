import customizeAxios from "../components/customizeAxios";

const fetchBloodSugarService = (userId, type, days) => {
  return customizeAxios.post("/fetchBloodSugar", { userId, type, days });
};

const saveBloodSugarService = (userId, value, type) => {
  return customizeAxios.post("/saveBloodSugar", { userId, value, type });
};

export {
  fetchBloodSugarService,
  saveBloodSugarService
};
