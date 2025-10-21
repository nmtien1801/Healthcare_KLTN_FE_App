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
    ScrollView,
} from "react-native";
import { X, Pill, ChevronDown, ChevronUp } from "lucide-react-native";
import ApiDoctor from "../../../apis/ApiDoctor";
import ApiPatient from "../../../apis/ApiPatient";

const { width } = Dimensions.get("window");

const PastAppointmentsModal = ({ show, onHide, patientId }) => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedId, setExpandedId] = useState(null);
    const [medicines, setMedicines] = useState({});
    const [loadingMed, setLoadingMed] = useState(false);

    // Lấy lịch hẹn đã khám
    useEffect(() => {
        if (!show || !patientId) return;
        const fetchPastAppointments = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await ApiDoctor.getPatientPastAppointments(patientId);
                setAppointments(Array.isArray(response) ? response : response.data || []);
            } catch (err) {
                console.error(err);
                setError("Không thể tải danh sách lịch hẹn.");
            } finally {
                setLoading(false);
            }
        };
        fetchPastAppointments();
    }, [show, patientId]);

    // Mở/đóng lịch hẹn và load thuốc
    const handleToggle = async (id) => {
        if (expandedId === id) {
            setExpandedId(null);
            return;
        }
        setExpandedId(id);
        if (!medicines[id]) {
            setLoadingMed(true);
            try {
                const res = await ApiPatient.getMedicinesByAppointment(id);
                setMedicines((prev) => ({ ...prev, [id]: res?.DT || res?.data || [] }));
            } catch (error) {
                console.error("Lỗi tải thuốc:", error);
            } finally {
                setLoadingMed(false);
            }
        }
    };


    if (!show) return null;

    return (
        <Modal visible={show} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
                <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={onHide} />
                <View style={[styles.modalContent, { maxWidth: width * 0.9 }]}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Lịch sử khám</Text>
                        <TouchableOpacity onPress={onHide}>
                            <X color="#1f2937" size={24} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody}>
                        {loading ? (
                            <View style={styles.center}>
                                <ActivityIndicator size="large" color="#2563eb" />
                                <Text style={styles.loadingText}>Đang tải danh sách lịch hẹn...</Text>
                            </View>
                        ) : error ? (
                            <Text style={styles.errorText}>{error}</Text>
                        ) : appointments.length > 0 ? (
                            appointments.map((appt) => (
                                <View key={appt._id} style={styles.appointmentCard}>
                                    <TouchableOpacity
                                        style={styles.appointmentHeader}
                                        onPress={() => handleToggle(appt._id)}
                                    >
                                        <Text style={styles.dateText}>
                                            {new Date(appt.date).toLocaleDateString("vi-VN")}
                                        </Text>
                                        <Text style={styles.timeText}>{appt.time || "-"}</Text>
                                        <Text style={styles.doctorText}>
                                            {appt.doctorId?.userId?.username || "Không xác định"}
                                        </Text>
                                        {expandedId === appt._id ? (
                                            <ChevronUp size={18} color="#2563eb" />
                                        ) : (
                                            <ChevronDown size={18} color="#2563eb" />
                                        )}
                                    </TouchableOpacity>

                                    {expandedId === appt._id && (
                                        <View style={styles.medicineContainer}>
                                            {loadingMed ? (
                                                <ActivityIndicator size="small" color="#2563eb" />
                                            ) : medicines[appt._id]?.length > 0 ? (
                                                medicines[appt._id].map((med) => (
                                                    <View key={med._id} style={styles.medicineItem}>
                                                        <Pill size={18} color="#2563eb" />
                                                        <View style={{ flex: 1, marginLeft: 8 }}>
                                                            <Text style={styles.medName}>{med.name}</Text>
                                                            <Text style={styles.medDose}>
                                                                Liều lượng: {med.lieu_luong}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                ))
                                            ) : (
                                                <Text style={styles.emptyText}>
                                                    Không có thuốc trong ngày khám này.
                                                </Text>
                                            )}
                                        </View>
                                    )}
                                </View>
                            ))
                        ) : (
                            <Text style={styles.emptyText}>Không có lịch hẹn nào trong quá khứ.</Text>
                        )}
                    </ScrollView>

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
    modalBackdrop: { flex: 1 },
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
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    modalTitle: { fontSize: 20, fontWeight: "700", color: "#1f2937" },
    modalBody: { padding: 16 },
    appointmentCard: {
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 12,
        marginBottom: 12,
        backgroundColor: "#f9fafb",
        overflow: "hidden",
    },
    appointmentHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 12,
    },
    medicineContainer: {
        padding: 10,
        backgroundColor: "#fff",
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
    },
    medicineItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 6,
    },
    medName: { fontWeight: "600", color: "#1f2937" },
    medDose: { color: "#6b7280", fontSize: 12 },
    emptyText: {
        fontSize: 14,
        color: "#6b7280",
        fontStyle: "italic",
        textAlign: "center",
        paddingVertical: 10,
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
