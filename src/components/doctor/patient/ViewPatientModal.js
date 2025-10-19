import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  Dimensions,
} from "react-native";
import {
  Calendar,
  Phone,
  Mail,
  MapPin,
  Heart,
  AlertTriangle,
  User,
  FileText,
  UserCheck,
  X,
} from "lucide-react-native";
import PastAppointmentsModal from "./PastAppointmentsModal";
import { listenStatusByReceiver } from "../../../utils/SetupSignFireBase";

const { width } = Dimensions.get("window");

const ViewPatientModal = ({ show, onHide, patient, onEdit }) => {
  const [showPastAppointments, setShowPastAppointments] = useState(false);

  // Lắng nghe tín hiệu realtime từ Firebase
//   useEffect(() => {
//     const unsub = listenStatusByReceiver(doctorUid, async (signal) => {
//       const statusCode = ["update_patient_info"];

//       if (statusCode.includes(signal?.status)) {
//         try {
//           const res = await ApiPatient.getAllPatients();
//           const allPatients = res.data || res;
//           const updatedApiPatient = allPatients.find(
//             (p) => p._id === patient.id
//           );
//           if (!updatedApiPatient) {
//             console.warn("Không tìm thấy bệnh nhân với ID:", patient.id);
//             return;
//           }
//           const updatedPatient = mapPatientData(updatedApiPatient);
//           setPatientData(updatedPatient);
//         } catch (err) {
//           console.error("Lỗi khi tải lại thông tin bệnh nhân:", err);
//         }
//       }
//     });

//     return () => unsub();
//   }, [doctorUid]);

  if (!show || !patient) return null;

  return (
    <Modal visible={show} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={onHide}
        />
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Hồ sơ bệnh nhân</Text>
            <TouchableOpacity onPress={onHide}>
              <X color="#1f2937" size={24} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.modalBody}>
            {/* Header với avatar và thông tin cơ bản */}
            <View style={styles.headerContainer}>
              <Image
                source={{ uri: patient.avatar }}
                style={styles.avatar}
                onError={() => {}}
              />
              <View style={styles.headerInfo}>
                <Text style={styles.patientName}>{patient.name}</Text>
                <Text style={styles.patientAge}>
                  Tuổi: {patient.patientCount}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: patient.statusColor },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: patient.statusTextColor },
                    ]}
                  >
                    {patient.status}
                  </Text>
                </View>
              </View>
            </View>

            {/* Thông tin cá nhân */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <User color="#1e40af" size={18} />
                <Text style={styles.cardTitle}>Thông tin cá nhân</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Họ tên:</Text>
                  <Text style={styles.infoValue}>{patient.name}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Giới tính:</Text>
                  <Text style={styles.infoValue}>{patient.gender}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Tuổi:</Text>
                  <Text style={styles.infoValue}>{patient.patientCount}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Ngày sinh:</Text>
                  <Text style={styles.infoValue}>{patient.dob}</Text>
                </View>
              </View>
            </View>

            {/* Thông tin liên hệ */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <UserCheck color="#1e40af" size={18} />
                <Text style={styles.cardTitle}>Thông tin liên hệ</Text>
              </View>
              <View style={styles.cardBody}>
                {patient.phone && (
                  <View style={styles.contactRow}>
                    <Phone color="#6b7280" size={16} />
                    <Text style={styles.contactText}>{patient.phone}</Text>
                  </View>
                )}
                {patient.email && (
                  <View style={styles.contactRow}>
                    <Mail color="#6b7280" size={16} />
                    <Text style={styles.contactText}>{patient.email}</Text>
                  </View>
                )}
                {patient.address && (
                  <View style={styles.contactRow}>
                    <MapPin color="#6b7280" size={16} />
                    <Text style={styles.contactText}>{patient.address}</Text>
                  </View>
                )}
                {patient.emergencyContact && (
                  <View style={[styles.infoRow, styles.borderTop]}>
                    <Text style={styles.infoLabel}>Liên hệ khẩn cấp:</Text>
                    <Text style={styles.infoValue}>
                      {patient.emergencyContact}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Tình trạng sức khỏe */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Heart color="#1e40af" size={18} />
                <Text style={styles.cardTitle}>Tình trạng sức khỏe</Text>
              </View>
              <View style={styles.healthRow}>
                <View style={styles.healthItem}>
                  <Text style={styles.healthLabel}>Bệnh</Text>
                  <Text style={styles.healthValue}>{patient.disease}</Text>
                </View>
                <View style={styles.healthItem}>
                  <Text style={styles.healthLabel}>Mã BHYT</Text>
                  <Text style={styles.healthValue}>{patient.patientId}</Text>
                </View>
                {patient.bloodType && (
                  <View style={styles.healthItem}>
                    <Text style={styles.healthLabel}>Nhóm máu</Text>
                    <Text style={styles.healthValue}>{patient.bloodType}</Text>
                  </View>
                )}
                <View style={styles.healthItem}>
                  <View style={styles.healthLabelRow}>
                    <AlertTriangle color="#dc2626" size={14} />
                    <Text style={[styles.healthLabel, styles.dangerText]}>
                      Dị ứng
                    </Text>
                  </View>
                  <Text style={styles.healthValue}>
                    {patient.allergies || "Không"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Hồ sơ sức khỏe chi tiết */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <FileText color="#1e40af" size={18} />
                <Text style={styles.cardTitle}>Hồ sơ sức khỏe chi tiết</Text>
              </View>
              {patient.healthRecords && patient.healthRecords.length > 0 ? (
                <FlatList
                  data={patient.healthRecords}
                  renderItem={({ item: record }) => (
                    <View style={styles.tableRow}>
                      <Text style={styles.tableCell}>{record.date}</Text>
                      <Text style={styles.tableCell}>
                        {record.bloodPressure}
                      </Text>
                      <Text style={styles.tableCell}>{record.heartRate}</Text>
                      <Text style={styles.tableCell}>{record.bloodSugar}</Text>
                      <Text style={styles.tableCell}>{record.recordedAt}</Text>
                    </View>
                  )}
                  keyExtractor={(item) => item.id}
                  ListHeaderComponent={() => (
                    <View style={styles.tableHeader}>
                      <Text style={styles.tableHeaderCell}>Ngày</Text>
                      <Text style={styles.tableHeaderCell}>Huyết áp</Text>
                      <Text style={styles.tableHeaderCell}>Nhịp tim</Text>
                      <Text style={styles.tableHeaderCell}>Đường huyết</Text>
                      <Text style={styles.tableHeaderCell}>
                        Thời gian ghi nhận
                      </Text>
                    </View>
                  )}
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <Text style={styles.emptyText}>
                  Không có hồ sơ sức khỏe nào.
                </Text>
              )}
            </View>

            {/* Ghi chú */}
            {patient.notes && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <FileText color="#1e40af" size={18} />
                  <Text style={styles.cardTitle}>Ghi chú</Text>
                </View>
                <Text style={styles.notesText}>{patient.notes}</Text>
              </View>
            )}

            {/* Lịch sử khám */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Calendar color="#1e40af" size={18} />
                <Text style={styles.cardTitle}>Lịch sử khám gần đây</Text>
              </View>
              <View style={styles.timelineContainer}>
                <View style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <View>
                    <Text style={styles.timelineDate}>{patient.lastVisit}</Text>
                    <Text style={styles.timelineDescription}>
                      Khám định kỳ - {patient.disease}
                    </Text>
                    <Text style={styles.timelineDescription}>
                      Tình trạng: {patient.status}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => setShowPastAppointments(true)}
              >
                <Text style={styles.viewAllButtonText}>Xem tất cả</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.footerButton} onPress={onHide}>
              <Text style={styles.footerButtonText}>Đóng</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.footerButton, styles.primaryButton]}
              onPress={() => onEdit(patient)}
            >
              <Text style={[styles.footerButtonText, styles.primaryButtonText]}>
                Chỉnh sửa
              </Text>
            </TouchableOpacity>
          </View>
          <PastAppointmentsModal
            show={showPastAppointments}
            onHide={() => setShowPastAppointments(false)}
            patientId={patient.id}
          />
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
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e6f0fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e7ff",
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: "#fff",
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  patientAge: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e40af",
    marginLeft: 8,
  },
  cardBody: {
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#1f2937",
    fontWeight: "500",
    textAlign: "right",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: "#1f2937",
    marginLeft: 8,
  },
  healthRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  healthItem: {
    width: "48%",
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  healthLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  healthLabelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dangerText: {
    color: "#dc2626",
    marginLeft: 4,
  },
  healthValue: {
    fontSize: 14,
    color: "#1f2937",
    fontWeight: "500",
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
  timelineContainer: {
    padding: 16,
  },
  timelineItem: {
    flexDirection: "row",
    marginBottom: 12,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2563eb",
    marginTop: 6,
    marginRight: 12,
  },
  timelineDate: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1f2937",
    marginBottom: 4,
  },
  timelineDescription: {
    fontSize: 12,
    color: "#6b7280",
  },
  viewAllButton: {
    backgroundColor: "#e0f2fe",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-end",
  },
  viewAllButtonText: {
    fontSize: 14,
    color: "#2563eb",
    fontWeight: "600",
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
    marginLeft: 8,
  },
  primaryButton: {
    backgroundColor: "#2563eb",
  },
  footerButtonText: {
    fontSize: 14,
    color: "#1f2937",
    fontWeight: "600",
  },
  primaryButtonText: {
    color: "#fff",
  },
});

export default ViewPatientModal;
