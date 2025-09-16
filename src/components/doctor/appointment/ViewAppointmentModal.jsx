import React from "react";
import {
    View,
    Text,
    Image,
    Modal,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
} from "react-native";
import { Clock, CalendarDays, Stethoscope, FileText, MessageSquare, Phone } from "lucide-react-native";
import { getLabelFromOptions } from "../../../utils/appointmentHelper";
import { STATUS_COLORS, STATUS_OPTIONS, TYPE_OPTIONS } from "../../../utils/appointmentConstants";

const ViewAppointmentModal = ({ visible, onClose, appointment, onEdit }) => {
    if (!visible || !appointment) return null;

    const getInitials = (name) => {
        return name
            ?.split(" ")
            .map((n) => n[0])
            .join("");
    };

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
                        <Text style={styles.modalTitle}>Chi tiết lịch hẹn</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.closeButton}>×</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.modalBody}>
                        {/* Header with avatar and basic info */}
                        <View style={styles.headerContainer}>
                            {appointment.patientAvatar ? (
                                <Image
                                    source={{ uri: appointment.patientAvatar }}
                                    style={styles.avatar}
                                />
                            ) : (
                                <View style={styles.avatarFallback}>
                                    <Text style={styles.avatarText}>{getInitials(appointment.patientName)}</Text>
                                </View>
                            )}
                            <View style={styles.headerInfo}>
                                <Text style={styles.patientName}>{appointment.patientName}</Text>
                                <Text style={styles.patientDetails}>
                                    {appointment.patientAge} tuổi • {appointment.patientDisease}
                                </Text>
                                <View
                                    style={[
                                        styles.statusBadge,
                                        { backgroundColor: STATUS_COLORS[appointment.status]?.bg },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.statusText,
                                            { color: STATUS_COLORS[appointment.status]?.text },
                                        ]}
                                    >
                                        {getLabelFromOptions(STATUS_OPTIONS, appointment.status)}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Appointment Details */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Thông tin lịch hẹn</Text>
                            <View style={styles.row}>
                                <View style={styles.detailItem}>
                                    <View style={styles.labelContainer}>
                                        <CalendarDays size={14} color="#666" />
                                        <Text style={styles.label}>Ngày hẹn:</Text>
                                    </View>
                                    <Text style={styles.detailText}>{appointment.date}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <View style={styles.labelContainer}>
                                        <Clock size={14} color="#666" />
                                        <Text style={styles.label}>Giờ hẹn:</Text>
                                    </View>
                                    <Text style={styles.detailText}>{appointment.time}</Text>
                                </View>
                            </View>
                            <View style={styles.row}>
                                <View style={styles.detailItem}>
                                    <Text style={styles.label}>Loại khám:</Text>
                                    <Text style={styles.detailText}>
                                        {getLabelFromOptions(TYPE_OPTIONS, appointment.type)}
                                    </Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <View style={styles.labelContainer}>
                                        <Stethoscope size={14} color="#666" />
                                        <Text style={styles.label}>Bác sĩ:</Text>
                                    </View>
                                    <Text style={styles.detailText}>{appointment.doctor}</Text>
                                </View>
                            </View>
                            <View style={styles.detailItem}>
                                <Text style={styles.label}>Lý do khám:</Text>
                                <Text style={styles.detailText}>{appointment.reason}</Text>
                            </View>
                            {appointment.notes && (
                                <View style={styles.detailItem}>
                                    <View style={styles.labelContainer}>
                                        <FileText size={14} color="#666" />
                                        <Text style={styles.label}>Ghi chú:</Text>
                                    </View>
                                    <Text style={styles.detailText}>{appointment.notes}</Text>
                                </View>
                            )}
                        </View>
                    </ScrollView>
                    <View style={styles.modalFooter}>
                        <View style={styles.actionButtons}>
                            <TouchableOpacity style={styles.iconButton}>
                                <MessageSquare size={16} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconButton}>
                                <Phone size={16} color="#fff" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.mainButtons}>
                            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                                <Text style={styles.buttonText}>Đóng</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.editButton}
                                onPress={() => onEdit(appointment)}
                            >
                                <Text style={styles.buttonText}>Chỉnh sửa</Text>
                            </TouchableOpacity>
                        </View>
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
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f8f9fa",
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        marginRight: 12,
    },
    avatarFallback: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: "#007bff",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    avatarText: {
        color: "#fff",
        fontSize: 24,
        fontWeight: "bold",
    },
    headerInfo: {
        flex: 1,
    },
    patientName: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#333",
        marginBottom: 4,
    },
    patientDetails: {
        fontSize: 14,
        color: "#666",
        marginBottom: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: "flex-start",
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
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
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    detailItem: {
        width: "48%",
    },
    labelContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    label: {
        fontSize: 12,
        fontWeight: "500",
        color: "#666",
        marginLeft: 4,
    },
    detailText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#333",
    },
    modalFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingTop: 12,
    },
    actionButtons: {
        flexDirection: "row",
        gap: 8,
    },
    iconButton: {
        backgroundColor: "#17a2b8",
        padding: 8,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    mainButtons: {
        flexDirection: "row",
        gap: 8,
    },
    cancelButton: {
        backgroundColor: "#6c757d",
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
        flex: 1,
    },
    editButton: {
        backgroundColor: "#007bff",
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
        flex: 1,
    },
    buttonText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },
});

export default ViewAppointmentModal;