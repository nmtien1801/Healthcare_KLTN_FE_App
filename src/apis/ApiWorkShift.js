import { ApiManager } from "./ApiManager";

const ApiWorkShift = {
    getWorkShiftsByDoctor: () => ApiManager.get(`/workshift`),
    createWorkShifts: (data) => ApiManager.post(`/workshift`, data),
    updateWorkShifts: (data) => ApiManager.put(`/workshift`, data),
    deleteWorkShift: (shiftId) => ApiManager.delete(`/workshift/${shiftId}`),
    deleteManyWorkShifts: (shiftIds) =>
        ApiManager.delete(`/workshift`, { shiftIds }),
    getTodayWorkShifts: () => ApiManager.get(`/workshift/today`),
    checkInWorkShift: (method) => ApiManager.post(`/workshift/checkin`, { method }),
    checkOutWorkShift: (method) => ApiManager.post(`/workshift/checkout`, { method }),


}
export default ApiWorkShift;
