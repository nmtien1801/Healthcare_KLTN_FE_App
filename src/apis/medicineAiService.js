import customizeAxios from "../components/customizeAxios";

const getTrendMedicine = ({ age, gender, BMI, HbA1c, bloodSugar }) => {
  return customizeAxios.post("/trendMedicine", {
    age,
    gender,
    BMI,
    HbA1c,
    bloodSugar,
  });
};

const applyMedicinesService = (userId, name, time, lieu_luong, status) => {
  return customizeAxios.post("/applyMedicines", {
    userId,
    name,
    time,
    lieu_luong,
    status,
  });
};

const fetchMedicinesService = (userId, date) => {
  return customizeAxios.post("/fetchMedicines", { userId, date });
};

const updateStatusMedicineService = (id, status) => {
  return customizeAxios.post("/updateStatusMedicine", { id, status });
};

export {
  getTrendMedicine,
  applyMedicinesService,
  fetchMedicinesService,
  updateStatusMedicineService,
};
