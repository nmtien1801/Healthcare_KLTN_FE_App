import React from "react";
import {
    View,
    Text,
    Image,
    Modal,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Dimensions,
} from "react-native";
import { Clock, CalendarDays, Stethoscope, FileText, MessageSquare, Phone } from "lucide-react-native";
import { getLabelFromOptions } from "../../../utils/appointmentHelper";
import { STATUS_COLORS, STATUS_OPTIONS, TYPE_OPTIONS } from "../../../utils/appointmentConstants";

const { width, height } = Dimensions.get("window");

const ViewAppointmentModal = ({ visible, onClose, appointment, onEdit }) => {
    if (!visible || !appointment) return null;

    const getInitials = (name) => {
        return name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase();
    };

    // Đảm bảo định dạng ngày DD/MM/YYYY
    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        // Giả định dateStr đã ở định dạng DD/MM/YYYY hoặc YYYY-MM-DD
        if (dateStr.includes("-")) {
            const [year, month, day] = dateStr.split("-");
            return `${day}/${month}/${year}`;
        }
        return dateStr;
    };

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
                        <Text style={styles.modalTitle}>Chi Tiết Lịch Hẹn</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Text style={styles.closeButton}>×</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView
                        style={styles.modalBody}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
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
                            <Text style={styles.sectionTitle}>Thông Tin Lịch Hẹn</Text>
                            <View style={styles.row}>
                                <View style={styles.detailItem}>
                                    <View style={styles.labelContainer}>
                                        <CalendarDays size={16} color="#1a3c6e" />
                                        <Text style={styles.label}>Ngày hẹn:</Text>
                                    </View>
                                    <Text style={styles.detailText}>{formatDate(appointment.date)}</Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <View style={styles.labelContainer}>
                                        <Clock size={16} color="#1a3c6e" />
                                        <Text style={styles.label}>Giờ hẹn:</Text>
                                    </View>
                                    <Text style={styles.detailText}>{appointment.time}</Text>
                                </View>
                            </View>
                            <View style={styles.row}>
                                <View style={styles.detailItem}>
                                    <View style={styles.labelContainer}>
                                        <Text style={styles.label}>Loại khám:</Text>
                                    </View>
                                    <Text style={styles.detailText}>
                                        {getLabelFromOptions(TYPE_OPTIONS, appointment.type)}
                                    </Text>
                                </View>
                                <View style={styles.detailItem}>
                                    <View style={styles.labelContainer}>
                                        <Stethoscope size={16} color="#1a3c6e" />
                                        <Text style={styles.label}>Bác sĩ:</Text>
                                    </View>
                                    <Text style={styles.detailText}>{appointment.doctor}</Text>
                                </View>
                            </View>
                            <View style={styles.detailItem}>
                                <View style={styles.labelContainer}>
                                    <Text style={styles.label}>Lý do khám:</Text>
                                </View>
                                <Text style={styles.detailText} numberOfLines={3} ellipsizeMode="tail">
                                    {appointment.reason}
                                </Text>
                            </View>
                            {appointment.notes && (
                                <View style={styles.detailItem}>
                                    <View style={styles.labelContainer}>
                                        <FileText size={16} color="#1a3c6e" />
                                        <Text style={styles.label}>Ghi chú:</Text>
                                    </View>
                                    <Text style={styles.detailText} numberOfLines={3} ellipsizeMode="tail">
                                        {appointment.notes}
                                    </Text>
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
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f0f2f5",
        borderRadius: 12,
        padding: width * 0.03,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    avatar: {
        width: width * 0.15,
        height: width * 0.15,
        borderRadius: width * 0.075,
        marginRight: 12,
        borderWidth: 1,
        borderColor: "#e0e4e8",
    },
    avatarFallback: {
        width: width * 0.15,
        height: width * 0.15,
        borderRadius: width * 0.075,
        backgroundColor: "#007bff",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
        borderWidth: 1,
        borderColor: "#e0e4e8",
    },
    avatarText: {
        color: "#fff",
        fontSize: width * 0.06,
        fontWeight: "700",
    },
    headerInfo: {
        flex: 1,
    },
    patientName: {
        fontSize: width * 0.045,
        fontWeight: "700",
        color: "#1a3c6e",
        marginBottom: 4,
    },
    patientDetails: {
        fontSize: width * 0.035,
        color: "#666",
        marginBottom: 8,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        alignSelf: "flex-start",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    statusText: {
        fontSize: width * 0.035,
        fontWeight: "600",
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
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 8,
        flexWrap: "wrap",
    },
    detailItem: {
        flex: 1,
        maxWidth: width * 0.42,
        gap: 6,
    },
    labelContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    label: {
        fontSize: width * 0.035,
        fontWeight: "500",
        color: "#1a3c6e",
    },
    detailText: {
        fontSize: width * 0.04,
        fontWeight: "500",
        color: "#333",
    },
    modalFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: 12,
        gap: 12,
    },
    actionButtons: {
        flexDirection: "row",
        gap: 8,
    },
    iconButton: {
        backgroundColor: "#17a2b8",
        padding: 10,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    mainButtons: {
        flexDirection: "row",
        gap: 8,
        flex: 1,
    },
    cancelButton: {
        backgroundColor: "#6c757d",
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: "center",
        flex: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    editButton: {
        backgroundColor: "#007bff",
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: "center",
        flex: 1,
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

export default ViewAppointmentModal;