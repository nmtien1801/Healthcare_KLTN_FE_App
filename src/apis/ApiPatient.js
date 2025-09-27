import { ApiManager } from "./ApiManager";

const ApiPatient = {
    getAllPatients: () => ApiManager.get(`/getAllPatients`),
}
export default ApiPatient;
