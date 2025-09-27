import { ApiManager } from "./ApiManager";

const ApiDoctor = {
    getDoctorInfo: () => ApiManager.get(`/doctor/info`),
    updateDoctor: (data) => ApiManager.put(`/doctor/update`, data),
    getAppointments: () => ApiManager.get(`/doctor/appointment/upcoming`),
    getAppointmentsToday: () => ApiManager.get(`/doctor/appointment/today`),
    updateAppointment: (id, data) => ApiManager.put(`/doctor/appointment/${id}`, data),
    getAppointmentById: (id) => ApiManager.get(`/doctor/appointment/${id}`),
    deleteAppointment: (id) => ApiManager.delete(`/doctor/appointment/${id}`),
    getPatientPastAppointments: (patientId) => ApiManager.get(`/doctor/past-appointments/${patientId}`),
    getSummary: () => ApiManager.get(`/doctor/summary`),
    getRevenue: (period) => ApiManager.get(`/doctor/revenue/${period}`),
    getPatientsAttention: () => ApiManager.get(`/doctor/patients-attention`),
    getPatientHealth: (patientId, period) => ApiManager.get(`/doctor/patient-health/${patientId}/${period}`),
}

export default ApiDoctor;
