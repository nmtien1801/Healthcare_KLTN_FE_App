import customizeAxios from "../components/customizeAxios";

const getUpcomingAppointmentService = () => {
  return customizeAxios.get("/booking/upcoming");
};

export {
    getUpcomingAppointmentService
};
