import customizeAxios from "../components/customizeAxios";

const fetchBloodSugarService = (userId, type, days) => {
  return customizeAxios.post("/fetchBloodSugar", { userId, type, days });
};

const saveBloodSugarService = (userId, value, type) => {
  return customizeAxios.post("/saveBloodSugar", { userId, value, type });
};

const getPatientByIdService = (userID) => {
  return customizeAxios.get(`/getPatientById/${userID}`, { userID });
};

const updatePatientInfoService = (data) => {
  return customizeAxios.post(`/updatePatientInfo`, data);
};

export {
  fetchBloodSugarService,
  saveBloodSugarService,
  getPatientByIdService,
  updatePatientInfoService,
};
