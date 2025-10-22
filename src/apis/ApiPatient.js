import { ApiManager } from "./ApiManager";

const ApiPatient = {
    getAllPatients: () => ApiManager.get(`/getAllPatients`),
    getMedicinesByAppointment: (appointmentId) => ApiManager.get(`/getMedicinesByAppointment/${appointmentId}`),
}
export default ApiPatient;
