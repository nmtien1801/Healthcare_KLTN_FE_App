import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    Modal,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Dimensions,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { X, Stethoscope, FileText } from "lucide-react-native";
import ApiDoctor from "../../../apis/ApiDoctor";
import { useSelector } from "react-redux";
import { listenStatus, sendStatus } from "../../../utils/SetupSignFireBase";

const { width, height } = Dimensions.get("window");

const EditPatientModal = ({ show, onHide, patient, onSave }) => {
    // Lấy user từ Redux
    const user = useSelector((state) => state.auth.userInfo);
    const doctorUid = user?.uid;
    const patientUid = "cq6SC0A1RZXdLwFE1TKGRJG8fgl2";
    const roomChats = doctorUid ? [doctorUid, patientUid].sort().join("_") : null;

    // State để lưu dữ liệu form
    const [formData, setFormData] = useState({
        disease: "",
        status: "Theo dõi",
        allergies: "",
        notes: "",
    });

    // State để lưu lỗi validation
    const [errors, setErrors] = useState({});

    // Cập nhật formData khi patient thay đổi
    useEffect(() => {
        if (patient) {
            setFormData({
                disease: patient.disease || "",
                status: patient.status || "Theo dõi",
                allergies: patient.allergies || "",
                notes: patient.notes || "",
            });
        }
    }, [patient]);

    // Lắng nghe realtime từ Firebase
    useEffect(() => {
        if (!roomChats) {
            return;
        }


        const unsubscribe = listenStatus(roomChats, (signal) => {

            if (signal?.status === "update_patient_info") {
                setFormData((prev) => ({
                    ...prev,
                    ...patient, // Cập nhật từ patient props
                }));
            }
        });

        return () => {
            unsubscribe && unsubscribe();
        };
    }, [roomChats, patient]);

    // Hàm kiểm tra dữ liệu đầu vào
    const validateForm = () => {
        const newErrors = {};
        if (!formData.disease.trim()) newErrors.disease = "Bệnh là bắt buộc";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Xử lý khi gửi form
    const handleSubmit = async () => {
        if (validateForm()) {
            try {
                await ApiDoctor.updatePatientHealthInfo(patient.id, formData);

                // Gửi tín hiệu realtime
                if (doctorUid) {
                    sendStatus(doctorUid, patientUid, "update_patient_info");
                } else {
                    console.error("Cannot send status: doctorUid is undefined");
                }

                // Cập nhật danh sách tại giao diện hiện tại
                onSave({ ...patient, ...formData });

                setErrors({});
                onHide();
            } catch (error) {
                console.error("Lỗi khi cập nhật thông tin y tế:", error);
                setErrors({ api: "Không thể cập nhật thông tin. Vui lòng thử lại sau." });
            }
        }
    };

    // Xử lý thay đổi giá trị input
    const handleChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
        if (errors[field]) {
            setErrors({ ...errors, [field]: "" });
        }
    };

    if (!show || !patient) return null;

    return (
        <Modal visible={show} animationType="slide" transparent={true}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Chỉnh sửa thông tin y tế bệnh nhân</Text>
                        <TouchableOpacity onPress={onHide} style={styles.closeButton}>
                            <X color="#6b7280" size={24} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView
                        style={styles.modalBody}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Thông tin y tế</Text>
                            <View style={styles.inputGroup}>
                                <View style={styles.labelContainer}>
                                    <Stethoscope size={16} color="#1a3c6e" />
                                    <Text style={styles.label}>Bệnh *</Text>
                                </View>
                                <TextInput
                                    style={[styles.input, errors.disease && styles.inputError]}
                                    value={formData.disease}
                                    onChangeText={(value) => handleChange("disease", value)}
                                    placeholder="Nhập tên bệnh"
                                    placeholderTextColor="#9ca3af"
                                />
                                {errors.disease && <Text style={styles.errorText}>{errors.disease}</Text>}
                            </View>
                            <View style={styles.inputGroup}>
                                <View style={styles.labelContainer}>
                                    <Text style={styles.label}>Tình trạng *</Text>
                                </View>
                                <View style={[styles.pickerContainer, errors.status && styles.inputError]}>
                                    <Picker
                                        selectedValue={formData.status}
                                        onValueChange={(value) => handleChange("status", value)}
                                        style={styles.picker}
                                    >
                                        <Picker.Item label="Cần theo dõi" value="Cần theo dõi" />
                                        <Picker.Item label="Đang điều trị" value="Đang điều trị" />
                                        <Picker.Item label="Theo dõi" value="Theo dõi" />
                                        <Picker.Item label="Ổn định" value="Ổn định" />
                                    </Picker>
                                </View>
                            </View>
                            <View style={styles.inputGroup}>
                                <View style={styles.labelContainer}>
                                    <Text style={styles.label}>Dị ứng</Text>
                                </View>
                                <TextInput
                                    style={styles.input}
                                    value={formData.allergies}
                                    onChangeText={(value) => handleChange("allergies", value)}
                                    placeholder="Nhập thông tin dị ứng (nếu có)"
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <View style={styles.labelContainer}>
                                    <FileText size={16} color="#1a3c6e" />
                                    <Text style={styles.label}>Ghi chú</Text>
                                </View>
                                <TextInput
                                    style={styles.textArea}
                                    value={formData.notes}
                                    onChangeText={(value) => handleChange("notes", value)}
                                    placeholder="Ghi chú thêm về bệnh nhân"
                                    placeholderTextColor="#9ca3af"
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>
                            {errors.api && (
                                <View style={styles.errorContainer}>
                                    <Text style={styles.errorText}>{errors.api}</Text>
                                </View>
                            )}
                        </View>
                    </ScrollView>
                    <View style={styles.modalFooter}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onHide}>
                            <Text style={styles.buttonText}>Hủy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                            <Text style={styles.buttonText}>Cập nhật</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: "#fff",
        borderRadius: 12,
        width: width * 0.9,
        maxHeight: height * 0.8,
        padding: width * 0.05,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: width * 0.05,
        fontWeight: "700",
        color: "#1a3c6e",
    },
    closeButton: {
        padding: 8,
    },
    modalBody: {
        flexGrow: 0,
    },
    scrollContent: {
        paddingBottom: 20,
        gap: 12,
    },
    section: {
        marginBottom: 16,
        gap: 12,
    },
    sectionTitle: {
        fontSize: width * 0.045,
        fontWeight: "600",
        color: "#1a3c6e",
        marginBottom: 8,
    },
    inputGroup: {
        gap: 6,
    },
    labelContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    label: {
        fontSize: width * 0.04,
        fontWeight: "500",
        color: "#1a3c6e",
    },
    input: {
        backgroundColor: "#f8f9fa",
        borderRadius: 8,
        padding: width * 0.03,
        fontSize: width * 0.04,
        color: "#333",
        borderWidth: 1,
        borderColor: "#e0e4e8",
    },
    inputError: {
        borderColor: "#dc3545",
    },
    pickerContainer: {
        backgroundColor: "#f8f9fa",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#e0e4e8",
        overflow: "hidden",
    },
    picker: {
        fontSize: width * 0.04,
        color: "#333",
    },
    textArea: {
        backgroundColor: "#f8f9fa",
        borderRadius: 8,
        padding: width * 0.03,
        fontSize: width * 0.04,
        color: "#333",
        borderWidth: 1,
        borderColor: "#e0e4e8",
        minHeight: height * 0.1,
    },
    errorContainer: {
        backgroundColor: "#f8d7da",
        padding: 10,
        borderRadius: 8,
        marginTop: 8,
    },
    errorText: {
        fontSize: width * 0.035,
        color: "#dc3545",
        marginTop: 4,
    },
    modalFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
        paddingTop: 12,
    },
    cancelButton: {
        backgroundColor: "#6b7280",
        paddingVertical: 12,
        borderRadius: 8,
        flex: 1,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    submitButton: {
        backgroundColor: "#2563eb",
        paddingVertical: 12,
        borderRadius: 8,
        flex: 1,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    buttonText: {
        fontSize: width * 0.04,
        color: "#fff",
        fontWeight: "600",
    },
});

export default EditPatientModal;