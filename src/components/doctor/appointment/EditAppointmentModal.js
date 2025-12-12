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
import { User, Clock, CalendarDays, Stethoscope, FileText } from "lucide-react-native";
import { TYPE_OPTIONS, STATUS_OPTIONS_BS } from "../../../utils/appointmentConstants";
import { book_appointment } from "../../../apis/assistant";
import { useSelector, useDispatch } from "react-redux";

const { width, height } = Dimensions.get("window");

const EditAppointmentModal = ({ visible, onClose, appointment, onSave }) => {
    const dispatch = useDispatch();
    const user = useSelector((state) => state.auth.user);
    const [formData, setFormData] = useState({
        patientName: "",
        patientAge: "",
        patientDisease: "",
        date: "",
        time: "",
        type: "Tái khám",
        reason: "",
        doctor: "",
        notes: "",
        status: "Chờ xác nhận",
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (appointment) {
            setFormData({
                patientName: appointment.patientName || "",
                patientAge: appointment.patientAge?.toString() || "",
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
        const date = new Date(`${year}-${month}-${day}`);
        date.setHours(date.getHours() + 7);
        return date;
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
                newErrors.type = "Loại khám là bắt buộc";
            } else {
                delete newErrors.type;
            }
        } else if (field === "status") {
            if (!value) {
                newErrors.status = "Tình trạng là bắt buộc";
            } else {
                delete newErrors.status;
            }
        } else {
            if (errors[field]) {
                delete newErrors[field];
            }
        }

        setFormData({ ...formData, [field]: value });
        setErrors(newErrors);
    };

    const handleSubmit = async () => {
        if (validateForm()) {
            const parsedDate = parseDate(formData.date);
            const payload = {
                ...appointment,
                ...formData,
                id: appointment.id,
                date: parsedDate ? parsedDate.toISOString().split("T")[0] : null,
            };

            // Kiểm tra nếu tình trạng là "đã xác nhận"
            if (formData.status === "confirmed") {
                try {
                    // Hàm chuyển đổi định dạng ngày/giờ
                    const formatDateTime = (dateStr, timeStr) => {
                        const [day, month, year] = dateStr.split('/');
                        const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                        const formattedTime = timeStr;
                        return `${formattedDate}T${formattedTime}`;
                    };

                    const calendarTime = formatDateTime(appointment.date, appointment.time);

                    const res = await book_appointment.post(
                        "/create-calendar-schedule",
                        {
                            email_Patient: appointment.patientEmail,
                            email_Docter: user.email,
                            period: 30,  // thời lượng buổi hẹn
                            time: calendarTime,
                            location: appointment.type  // "online"
                        }
                    );
                } catch (err) {
                    console.error(err);
                }
            }

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
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Chỉnh Sửa Lịch Hẹn</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.closeButton}>×</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView
                        style={styles.modalBody}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Thông Tin Bệnh Nhân</Text>
                            <View style={styles.inputGroup}>
                                <View style={styles.labelContainer}>
                                    <User size={16} color="#1a3c6e" />
                                    <Text style={styles.label}>Tên bệnh nhân</Text>
                                </View>
                                <TextInput
                                    style={[styles.input, errors.patientName && styles.inputError]}
                                    value={formData.patientName}
                                    onChangeText={(value) => handleChange("patientName", value)}
                                    placeholder="Nhập tên bệnh nhân"
                                    placeholderTextColor="#999"
                                />
                                {errors.patientName && (
                                    <Text style={styles.errorText}>{errors.patientName}</Text>
                                )}
                            </View>
                            <View style={styles.row}>
                                <View style={[styles.inputGroup, styles.halfWidth]}>
                                    <View style={styles.labelContainer}>
                                        <Text style={styles.label}>Tuổi</Text>
                                    </View>
                                    <TextInput
                                        style={[styles.input, errors.patientAge && styles.inputError]}
                                        value={formData.patientAge}
                                        onChangeText={(value) => handleChange("patientAge", value)}
                                        placeholder="Nhập tuổi"
                                        placeholderTextColor="#999"
                                        keyboardType="numeric"
                                    />
                                    {errors.patientAge && (
                                        <Text style={styles.errorText}>{errors.patientAge}</Text>
                                    )}
                                </View>
                                <View style={[styles.inputGroup, styles.halfWidth]}>
                                    <View style={styles.labelContainer}>
                                        <Text style={styles.label}>Bệnh</Text>
                                    </View>
                                    <TextInput
                                        style={[styles.input, errors.patientDisease && styles.inputError]}
                                        value={formData.patientDisease}
                                        onChangeText={(value) => handleChange("patientDisease", value)}
                                        placeholder="Nhập bệnh"
                                        placeholderTextColor="#999"
                                    />
                                    {errors.patientDisease && (
                                        <Text style={styles.errorText}>{errors.patientDisease}</Text>
                                    )}
                                </View>
                            </View>
                        </View>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Thông Tin Lịch Hẹn</Text>
                            <View style={styles.row}>
                                <View style={[styles.inputGroup, styles.halfWidth]}>
                                    <View style={styles.labelContainer}>
                                        <CalendarDays size={16} color="#1a3c6e" />
                                        <Text style={styles.label}>Ngày hẹn</Text>
                                    </View>
                                    <TextInput
                                        style={[styles.input, errors.date && styles.inputError]}
                                        value={formData.date}
                                        onChangeText={(value) => handleChange("date", value)}
                                        placeholder="DD/MM/YYYY"
                                        placeholderTextColor="#999"
                                        keyboardType="numeric"
                                    />
                                    {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
                                </View>
                                <View style={[styles.inputGroup, styles.halfWidth]}>
                                    <View style={styles.labelContainer}>
                                        <Clock size={16} color="#1a3c6e" />
                                        <Text style={styles.label}>Giờ hẹn</Text>
                                    </View>
                                    <TextInput
                                        style={[styles.input, errors.time && styles.inputError]}
                                        value={formData.time}
                                        onChangeText={(value) => handleChange("time", value)}
                                        placeholder="HH:MM"
                                        placeholderTextColor="#999"
                                        keyboardType="numeric"
                                    />
                                    {errors.time && <Text style={styles.errorText}>{errors.time}</Text>}
                                </View>
                            </View>
                            <View style={styles.row}>
                                <View style={[styles.inputGroup, styles.halfWidth]}>
                                    <View style={styles.labelContainer}>
                                        <Text style={styles.label}>Loại khám</Text>
                                    </View>
                                    <View style={[styles.pickerContainer, errors.type && styles.inputError]}>
                                        <Picker
                                            selectedValue={formData.type}
                                            onValueChange={(value) => handleChange("type", value)}
                                            style={styles.picker}
                                        >
                                            {TYPE_OPTIONS.map((option) => (
                                                <Picker.Item
                                                    key={option.value}
                                                    label={option.label}
                                                    value={option.value}
                                                />
                                            ))}
                                        </Picker>
                                    </View>
                                    {errors.type && <Text style={styles.errorText}>{errors.type}</Text>}
                                </View>
                                <View style={[styles.inputGroup, styles.halfWidth]}>
                                    <View style={styles.labelContainer}>
                                        <Stethoscope size={16} color="#1a3c6e" />
                                        <Text style={styles.label}>Bác sĩ</Text>
                                    </View>
                                    <TextInput
                                        style={[styles.input, errors.doctor && styles.inputError]}
                                        value={formData.doctor}
                                        onChangeText={(value) => handleChange("doctor", value)}
                                        placeholder="Nhập tên bác sĩ"
                                        placeholderTextColor="#999"
                                    />
                                    {errors.doctor && (
                                        <Text style={styles.errorText}>{errors.doctor}</Text>
                                    )}
                                </View>
                            </View>
                            <View style={styles.inputGroup}>
                                <View style={styles.labelContainer}>
                                    <Text style={styles.label}>Lý do khám</Text>
                                </View>
                                <TextInput
                                    style={[styles.textArea, errors.reason && styles.inputError]}
                                    value={formData.reason}
                                    onChangeText={(value) => handleChange("reason", value)}
                                    placeholder="Mô tả lý do khám"
                                    placeholderTextColor="#999"
                                    multiline
                                    numberOfLines={3}
                                />
                                {errors.reason && (
                                    <Text style={styles.errorText}>{errors.reason}</Text>
                                )}
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
                                    placeholder="Ghi chú thêm về lịch hẹn"
                                    placeholderTextColor="#999"
                                    multiline
                                    numberOfLines={3}
                                />
                            </View>
                            <View style={styles.inputGroup}>
                                <View style={styles.labelContainer}>
                                    <Text style={styles.label}>Tình trạng</Text>
                                </View>
                                <View style={[styles.pickerContainer, errors.status && styles.inputError]}>
                                    <Picker
                                        selectedValue={formData.status}
                                        onValueChange={(value) => handleChange("status", value)}
                                        style={styles.picker}
                                    >
                                        {STATUS_OPTIONS_BS.map((option) => (
                                            <Picker.Item
                                                key={option.value}
                                                label={option.label}
                                                value={option.value}
                                            />
                                        ))}
                                    </Picker>
                                </View>
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
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: "#fff",
        borderRadius: 16,
        width: width * 0.9,
        maxHeight: height * 0.9,
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
        fontSize: width * 0.06,
        color: "#1a3c6e",
        fontWeight: "600",
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
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 8,
    },
    halfWidth: {
        flex: 1,
        maxWidth: width * 0.42,
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
        backgroundColor: "#f0f2f5",
        borderRadius: 12,
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
        backgroundColor: "#f0f2f5",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#e0e4e8",
        overflow: "hidden",
    },
    picker: {
        fontSize: width * 0.04,
        color: "#333",
    },
    textArea: {
        backgroundColor: "#f0f2f5",
        borderRadius: 12,
        padding: width * 0.03,
        fontSize: width * 0.04,
        color: "#333",
        borderWidth: 1,
        borderColor: "#e0e4e8",
        minHeight: height * 0.1,
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
        backgroundColor: "#6c757d",
        paddingVertical: 12,
        borderRadius: 12,
        flex: 1,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    submitButton: {
        backgroundColor: "#007bff",
        paddingVertical: 12,
        borderRadius: 12,
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

export default EditAppointmentModal;