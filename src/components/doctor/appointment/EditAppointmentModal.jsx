import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    Modal,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
} from "react-native";
import { User, Clock, CalendarDays, Stethoscope, FileText } from "lucide-react-native";
import { TYPE_OPTIONS, STATUS_OPTIONS } from "../../../utils/appointmentConstants";

const EditAppointmentModal = ({ visible, onClose, appointment, onSave }) => {
    const [formData, setFormData] = useState({
        patientName: "",
        patientAge: "",
        patientDisease: "",
        date: "",
        time: "",
        type: "",
        reason: "",
        doctor: "",
        notes: "",
        status: "",
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (appointment) {
            setFormData({
                patientName: appointment.patientName || "",
                patientAge: appointment.patientAge || "",
                patientDisease: appointment.patientDisease || "",
                date: appointment.date || "",
                time: appointment.time || "",
                type: appointment.type || "Tái khám",
                reason: appointment.reason || "",
                doctor: appointment.doctor || "",
                notes: appointment.notes || "",
                status: appointment.status || "Chờ xác nhận",
            });
        }
    }, [appointment]);

    const validateForm = () => {
        const newErrors = {};
        if (!formData.patientName.trim()) newErrors.patientName = "Tên bệnh nhân là bắt buộc";
        if (!formData.patientAge || formData.patientAge < 1 || formData.patientAge > 120)
            newErrors.patientAge = "Tuổi phải từ 1-120";
        if (!formData.patientDisease.trim()) newErrors.patientDisease = "Bệnh là bắt buộc";
        if (!formData.date.trim()) newErrors.date = "Ngày hẹn là bắt buộc";
        if (!formData.time.trim()) newErrors.time = "Giờ hẹn là bắt buộc";
        if (!formData.reason.trim()) newErrors.reason = "Lý do khám là bắt buộc";
        if (!formData.doctor.trim()) newErrors.doctor = "Bác sĩ là bắt buộc";
        if (!formData.type.trim()) newErrors.type = "Loại khám là bắt buộc";
        if (!formData.status.trim()) newErrors.status = "Tình trạng là bắt buộc";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const parseDate = (dateStr) => {
        if (!dateStr) return null;
        const [day, month, year] = dateStr.split("/");
        return new Date(`${year}-${month}-${day}`);
    };

    const handleChange = (field, value) => {
        let newErrors = { ...errors };

        if (field === "date") {
            if (!value) {
                setFormData({ ...formData, date: "" });
                delete newErrors.date;
            } else {
                const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
                if (!regex.test(value)) {
                    newErrors.date = "Vui lòng nhập ngày theo định dạng DD/MM/YYYY";
                } else {
                    const [day, month, year] = value.split("/").map(Number);
                    const date = new Date(year, month - 1, day);
                    if (
                        date.getDate() !== day ||
                        date.getMonth() !== month - 1 ||
                        date.getFullYear() !== year
                    ) {
                        newErrors.date = "Ngày không hợp lệ";
                    } else {
                        delete newErrors.date;
                    }
                }
            }
        } else if (field === "time") {
            if (!value) {
                setFormData({ ...formData, time: "" });
                delete newErrors.time;
            } else {
                const regex = /^(\d{2}):(\d{2})$/;
                if (!regex.test(value)) {
                    newErrors.time = "Vui lòng nhập giờ theo định dạng HH:MM";
                } else {
                    const [hour, minute] = value.split(":").map(Number);
                    if (hour > 23 || minute > 59) {
                        newErrors.time = "Giờ hoặc phút không hợp lệ";
                    } else {
                        delete newErrors.time;
                    }
                }
            }
        } else if (field === "type") {
            if (!value) {
                setFormData({ ...formData, type: "" });
                delete newErrors.type;
            } else {
                const validTypes = TYPE_OPTIONS.map(opt => opt.value);
                if (!validTypes.includes(value)) {
                    newErrors.type = "Loại khám phải là: Tái khám, Khám mới, hoặc Tư vấn";
                } else {
                    delete newErrors.type;
                }
            }
        } else if (field === "status") {
            if (!value) {
                setFormData({ ...formData, status: "" });
                delete newErrors.status;
            } else {
                const validStatuses = STATUS_OPTIONS.map(opt => opt.value);
                if (!validStatuses.includes(value)) {
                    newErrors.status = "Tình trạng phải là: Đã xác nhận, Chờ xác nhận, Đã hủy, hoặc Hoàn thành";
                } else {
                    delete newErrors.status;
                }
            }
        } else {
            if (errors[field]) {
                delete newErrors[field];
            }
        }

        setFormData({ ...formData, [field]: value });
        setErrors(newErrors);
    };

    const handleSubmit = () => {
        if (validateForm()) {
            const parsedDate = parseDate(formData.date);
            const payload = {
                ...appointment,
                ...formData,
                id: appointment.id,
                date: parsedDate ? parsedDate.toISOString().split("T")[0] : null,
            };
            onSave(payload);
            setErrors({});
            onClose();
        }
    };

    if (!visible || !appointment) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Chỉnh sửa lịch hẹn</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.closeButton}>×</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.modalBody}>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Thông tin bệnh nhân</Text>
                            <View style={styles.inputGroup}>
                                <View style={styles.labelContainer}>
                                    <User size={14} color="#333" />
                                    <Text style={styles.label}>Tên bệnh nhân *</Text>
                                </View>
                                <TextInput
                                    style={[styles.input, errors.patientName && styles.inputError]}
                                    value={formData.patientName}
                                    onChangeText={(value) => handleChange("patientName", value)}
                                    placeholder="Nhập tên bệnh nhân"
                                />
                                {errors.patientName && (
                                    <Text style={styles.errorText}>{errors.patientName}</Text>
                                )}
                            </View>
                            <View style={styles.row}>
                                <View style={[styles.inputGroup, styles.halfWidth]}>
                                    <Text style={styles.label}>Tuổi *</Text>
                                    <TextInput
                                        style={[styles.input, errors.patientAge && styles.inputError]}
                                        value={formData.patientAge}
                                        onChangeText={(value) => handleChange("patientAge", value)}
                                        placeholder="Nhập tuổi"
                                        keyboardType="numeric"
                                    />
                                    {errors.patientAge && (
                                        <Text style={styles.errorText}>{errors.patientAge}</Text>
                                    )}
                                </View>
                                <View style={[styles.inputGroup, styles.halfWidth]}>
                                    <Text style={styles.label}>Bệnh *</Text>
                                    <TextInput
                                        style={[styles.input, errors.patientDisease && styles.inputError]}
                                        value={formData.patientDisease}
                                        onChangeText={(value) => handleChange("patientDisease", value)}
                                        placeholder="Nhập bệnh"
                                    />
                                    {errors.patientDisease && (
                                        <Text style={styles.errorText}>{errors.patientDisease}</Text>
                                    )}
                                </View>
                            </View>
                        </View>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Thông tin lịch hẹn</Text>
                            <View style={styles.row}>
                                <View style={[styles.inputGroup, styles.halfWidth]}>
                                    <View style={styles.labelContainer}>
                                        <CalendarDays size={14} color="#333" />
                                        <Text style={styles.label}>Ngày hẹn *</Text>
                                    </View>
                                    <TextInput
                                        style={[styles.input, errors.date && styles.inputError]}
                                        value={formData.date}
                                        onChangeText={(value) => handleChange("date", value)}
                                        placeholder="DD/MM/YYYY"
                                        keyboardType="numeric"
                                    />
                                    {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
                                </View>
                                <View style={[styles.inputGroup, styles.halfWidth]}>
                                    <View style={styles.labelContainer}>
                                        <Clock size={14} color="#333" />
                                        <Text style={styles.label}>Giờ hẹn *</Text>
                                    </View>
                                    <TextInput
                                        style={[styles.input, errors.time && styles.inputError]}
                                        value={formData.time}
                                        onChangeText={(value) => handleChange("time", value)}
                                        placeholder="HH:MM"
                                        keyboardType="numeric"
                                    />
                                    {errors.time && <Text style={styles.errorText}>{errors.time}</Text>}
                                </View>
                            </View>
                            <View style={styles.row}>
                                <View style={[styles.inputGroup, styles.halfWidth]}>
                                    <Text style={styles.label}>Loại khám *</Text>
                                    <TextInput
                                        style={[styles.input, errors.type && styles.inputError]}
                                        value={formData.type}
                                        onChangeText={(value) => handleChange("type", value)}
                                        placeholder="Tái khám, Khám mới, Tư vấn"
                                    />
                                    {errors.type && <Text style={styles.errorText}>{errors.type}</Text>}
                                </View>
                                <View style={[styles.inputGroup, styles.halfWidth]}>
                                    <View style={styles.labelContainer}>
                                        <Stethoscope size={14} color="#333" />
                                        <Text style={styles.label}>Bác sĩ *</Text>
                                    </View>
                                    <TextInput
                                        style={[styles.input, errors.doctor && styles.inputError]}
                                        value={formData.doctor}
                                        onChangeText={(value) => handleChange("doctor", value)}
                                        placeholder="Nhập tên bác sĩ"
                                    />
                                    {errors.doctor && (
                                        <Text style={styles.errorText}>{errors.doctor}</Text>
                                    )}
                                </View>
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Lý do khám *</Text>
                                <TextInput
                                    style={[styles.textArea, errors.reason && styles.inputError]}
                                    value={formData.reason}
                                    onChangeText={(value) => handleChange("reason", value)}
                                    placeholder="Mô tả lý do khám"
                                    multiline
                                    numberOfLines={2}
                                />
                                {errors.reason && (
                                    <Text style={styles.errorText}>{errors.reason}</Text>
                                )}
                            </View>
                            <View style={styles.inputGroup}>
                                <View style={styles.labelContainer}>
                                    <FileText size={14} color="#333" />
                                    <Text style={styles.label}>Ghi chú</Text>
                                </View>
                                <TextInput
                                    style={styles.textArea}
                                    value={formData.notes}
                                    onChangeText={(value) => handleChange("notes", value)}
                                    placeholder="Ghi chú thêm về lịch hẹn"
                                    multiline
                                    numberOfLines={2}
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <Text style={styles.label}>Tình trạng *</Text>
                                <TextInput
                                    style={[styles.input, errors.status && styles.inputError]}
                                    value={formData.status}
                                    onChangeText={(value) => handleChange("status", value)}
                                    placeholder="Đã xác nhận, Chờ xác nhận, Đã hủy, Hoàn thành"
                                />
                                {errors.status && <Text style={styles.errorText}>{errors.status}</Text>}
                            </View>
                        </View>
                    </ScrollView>
                    <View style={styles.modalFooter}>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
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
        width: "90%",
        maxHeight: "80%",
        padding: 16,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
    },
    closeButton: {
        fontSize: 24,
        color: "#333",
    },
    modalBody: {
        flex: 1,
    },
    section: {
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#007bff",
        marginBottom: 12,
    },
    inputGroup: {
        marginBottom: 12,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    halfWidth: {
        width: "48%",
    },
    labelContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    label: {
        fontSize: 14,
        fontWeight: "500",
        color: "#333",
        marginLeft: 4,
    },
    input: {
        backgroundColor: "#f8f9fa",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: "#333",
        borderWidth: 1,
        borderColor: "#dee2e6",
    },
    inputError: {
        borderColor: "#dc3545",
    },
    textArea: {
        backgroundColor: "#f8f9fa",
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: "#333",
        borderWidth: 1,
        borderColor: "#dee2e6",
        minHeight: 60,
    },
    errorText: {
        fontSize: 12,
        color: "#dc3545",
        marginTop: 4,
    },
    modalFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingTop: 12,
    },
    cancelButton: {
        backgroundColor: "#6c757d",
        padding: 12,
        borderRadius: 8,
        flex: 1,
        marginRight: 8,
        alignItems: "center",
    },
    submitButton: {
        backgroundColor: "#007bff",
        padding: 12,
        borderRadius: 8,
        flex: 1,
        marginLeft: 8,
        alignItems: "center",
    },
    buttonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },
});

export default EditAppointmentModal;