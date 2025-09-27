import React, { useState, useEffect } from "react";
import {
    Modal,
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Dimensions,
} from "react-native";
import { X } from "lucide-react-native";
import ApiDoctor from "../../../apis/ApiDoctor";

const { width } = Dimensions.get("window");

const PastAppointmentsModal = ({ show, onHide, patientId }) => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Gọi API để lấy lịch hẹn đã khám
    useEffect(() => {
        if (!show || !patientId) return;

        const fetchPastAppointments = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await ApiDoctor.getPatientPastAppointments(patientId);
                console.log("Past Appointments Data:", response); // Debug
                setAppointments(Array.isArray(response) ? response : response.data || []);
            } catch (err) {
                console.error("Lỗi khi gọi API lịch hẹn:", err.message, err.response?.data);
                setError(
                    err.response?.data?.message || "Không thể tải danh sách lịch hẹn. Vui lòng thử lại sau."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchPastAppointments();
    }, [show, patientId]);

    if (!show) return null;

    return (
        <Modal visible={show} animationType="slide" transparent={true}>
            <View style={styles.modalOverlay}>
                <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onHide} />
                <View style={[styles.modalContent, { maxWidth: width * 0.9 }]}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Lịch sử khám</Text>
                        <TouchableOpacity onPress={onHide}>
                            <X color="#1f2937" size={24} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.modalBody}>
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#2563eb" />
                                <Text style={styles.loadingText}>Đang tải danh sách lịch hẹn...</Text>
                            </View>
                        ) : error ? (
                            <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>{error}</Text>
                            </View>
                        ) : appointments.length > 0 ? (
                            <FlatList
                                data={appointments}
                                renderItem={({ item: appt }) => (
                                    <View style={styles.tableRow}>
                                        <Text style={styles.tableCell}>
                                            {new Date(appt.date).toLocaleDateString("vi-VN", {
                                                day: "2-digit",
                                                month: "2-digit",
                                                year: "numeric",
                                            })}
                                        </Text>
                                        <Text style={styles.tableCell}>{appt.time || "-"}</Text>
                                        <Text style={styles.tableCell}>
                                            {appt.doctorId?.userId?.username || "Không xác định"}
                                        </Text>
                                        <Text style={styles.tableCell}>{appt.doctorId?.hospital || "-"}</Text>
                                    </View>
                                )}
                                keyExtractor={(item) => item._id}
                                ListHeaderComponent={() => (
                                    <View style={styles.tableHeader}>
                                        <Text style={styles.tableHeaderCell}>Ngày</Text>
                                        <Text style={styles.tableHeaderCell}>Giờ</Text>
                                        <Text style={styles.tableHeaderCell}>Bác sĩ</Text>
                                        <Text style={styles.tableHeaderCell}>Bệnh viện</Text>
                                    </View>
                                )}
                                showsVerticalScrollIndicator={false}
                            />
                        ) : (
                            <Text style={styles.emptyText}>Không có lịch hẹn nào trong quá khứ.</Text>
                        )}
                    </View>
                    <View style={styles.modalFooter}>
                        <TouchableOpacity style={styles.footerButton} onPress={onHide}>
                            <Text style={styles.footerButtonText}>Đóng</Text>
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
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalBackdrop: {
        flex: 1,
    },
    modalContent: {
        backgroundColor: "#fff",
        borderRadius: 16,
        width: width * 0.9,
        maxHeight: "90%",
        overflow: "hidden",
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#f8f9fa",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#1f2937",
    },
    modalBody: {
        padding: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 32,
    },
    loadingText: {
        fontSize: 16,
        color: "#6b7280",
        marginTop: 12,
    },
    errorContainer: {
        backgroundColor: "#fee2e2",
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
    },
    errorText: {
        fontSize: 16,
        color: "#dc2626",
        textAlign: "center",
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: "#f8f9fa",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#e0e7ff",
    },
    tableHeaderCell: {
        flex: 1,
        fontSize: 14,
        fontWeight: "600",
        color: "#1e40af",
        textAlign: "center",
    },
    tableRow: {
        flexDirection: "row",
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    tableCell: {
        flex: 1,
        fontSize: 14,
        color: "#1f2937",
        textAlign: "center",
    },
    emptyText: {
        fontSize: 14,
        color: "#6b7280",
        fontStyle: "italic",
        textAlign: "center",
        padding: 16,
    },
    modalFooter: {
        flexDirection: "row",
        justifyContent: "flex-end",
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
    },
    footerButton: {
        paddingVertical: 8,
        paddingHorizontal: 20,
        borderRadius: 8,
        backgroundColor: "#e5e7eb",
    },
    footerButtonText: {
        fontSize: 14,
        color: "#1f2937",
        fontWeight: "600",
    },
});

export default PastAppointmentsModal;