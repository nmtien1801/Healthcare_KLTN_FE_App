import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Modal,
  FlatList,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Search, Filter, Eye, Edit, MessageSquare, Phone, ChevronDown, X, Bot, Send } from "lucide-react-native";
import { Picker } from "@react-native-picker/picker";
import { collection, onSnapshot, orderBy, query, addDoc, serverTimestamp } from "firebase/firestore";
import { useSelector } from "react-redux";
import { db } from "../../../firebase";
import { acceptCall, endCall, createCall, generateJitsiUrl } from "../../components/call/functionCall";

// Mock data (giữ nguyên từ mã gốc)
const initialPatients = [
  {
    id: 1,
    name: "Trần Văn Bình",
    age: 68,
    patientCount: "68 tuổi",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    disease: "Tăng huyết áp, Tiểu đường type 2",
    patientId: "BHYT: BH123456789",
    status: "Cần theo dõi",
    statusColor: "#dc3545",
    statusTextColor: "#fff",
    lastVisit: "15/06/2025",
    lastVisitDate: new Date("2025-06-15"),
    phone: "0901234567",
    email: "tranvanbinhh@email.com",
    address: "123 Đường ABC, Quận 1, TP.HCM",
    bloodType: "A",
    allergies: "Penicillin",
    emergencyContact: "Trần Thị Mai - 0987654321 (Vợ)",
    notes: "Bệnh nhân cần theo dõi đường huyết thường xuyên",
  },
  // ... (các bệnh nhân khác tương tự, bỏ bớt để ngắn gọn)
];

// Mock ViewPatientModal
const ViewPatientModal = ({ show, onHide, patient, onEdit }) => (
  <Modal visible={show} animationType="slide" transparent={true}>
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Thông tin bệnh nhân</Text>
        {patient && (
          <>
            <Text style={styles.modalText}>Tên: {patient.name}</Text>
            <Text style={styles.modalText}>Tuổi: {patient.age}</Text>
            <Text style={styles.modalText}>Bệnh: {patient.disease}</Text>
            <Text style={styles.modalText}>Mã BHYT: {patient.patientId}</Text>
            <Text style={styles.modalText}>Trạng thái: {patient.status}</Text>
            <Text style={styles.modalText}>Lần khám cuối: {patient.lastVisit}</Text>
            <Text style={styles.modalText}>Số điện thoại: {patient.phone}</Text>
            <Text style={styles.modalText}>Email: {patient.email || "Không có"}</Text>
            <Text style={styles.modalText}>Địa chỉ: {patient.address}</Text>
            <Text style={styles.modalText}>Nhóm máu: {patient.bloodType}</Text>
            <Text style={styles.modalText}>Dị ứng: {patient.allergies || "Không có"}</Text>
            <Text style={styles.modalText}>Liên hệ khẩn cấp: {patient.emergencyContact}</Text>
            <Text style={styles.modalText}>Ghi chú: {patient.notes}</Text>
          </>
        )}
        <View style={styles.modalButtonGroup}>
          <TouchableOpacity style={styles.modalButton} onPress={onHide}>
            <Text style={styles.modalButtonText}>Đóng</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modalButton, { backgroundColor: "#28a745" }]} onPress={() => onEdit(patient)}>
            <Text style={styles.modalButtonText}>Chỉnh sửa</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

// Mock EditPatientModal
const EditPatientModal = ({ show, onHide, patient, onSave }) => {
  const [formData, setFormData] = useState(patient || {});
  const handleChange = (key, value) => setFormData({ ...formData, [key]: value });

  return (
    <Modal visible={show} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Chỉnh sửa bệnh nhân</Text>
          <TextInput
            style={styles.modalInput}
            value={formData.name}
            onChangeText={(text) => handleChange("name", text)}
            placeholder="Tên bệnh nhân"
          />
          <TextInput
            style={styles.modalInput}
            value={String(formData.age)}
            onChangeText={(text) => handleChange("age", Number(text))}
            placeholder="Tuổi"
            keyboardType="numeric"
          />
          <TextInput
            style={styles.modalInput}
            value={formData.disease}
            onChangeText={(text) => handleChange("disease", text)}
            placeholder="Bệnh lý"
          />
          <TextInput
            style={styles.modalInput}
            value={formData.patientId}
            onChangeText={(text) => handleChange("patientId", text)}
            placeholder="Mã BHYT"
          />
          <Picker
            selectedValue={formData.status}
            onValueChange={(value) => handleChange("status", value)}
            style={styles.modalInput}
          >
            <Picker.Item label="Cần theo dõi" value="Cần theo dõi" />
            <Picker.Item label="Đang điều trị" value="Đang điều trị" />
            <Picker.Item label="Ổn định" value="Ổn định" />
          </Picker>
          <View style={styles.modalButtonGroup}>
            <TouchableOpacity style={styles.modalButton} onPress={onHide}>
              <Text style={styles.modalButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: "#007bff" }]}
              onPress={() => onSave(formData)}
            >
              <Text style={styles.modalButtonText}>Lưu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function PatientTab({ handleStartCall }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [patientList, setPatientList] = useState(initialPatients);
  const [currentPage, setCurrentPage] = useState(1);
  const patientsPerPage = 5;
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const user = useSelector((state) => state.auth.userInfo);
  const senderId = user?.uid;
  const receiverId = "cq6SC0A1RZXdLwFE1TKGRJG8fgl2";
  const roomChats = [senderId, receiverId].sort().join("_");
  const flatListRef = useRef(null);

  // Firebase chat
  useEffect(() => {
    if (!senderId) return;

    const q = query(collection(db, "chats", roomChats, "messages"), orderBy("timestamp", "asc"));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const messages = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            text: data.message || data.text || "",
            sender: data.senderId === senderId ? "doctor" : "patient",
            timestamp: data.timestamp ? data.timestamp.toDate() : new Date(),
          };
        });
        setChatMessages(messages);
      },
      (error) => console.error("Firebase listener error:", error)
    );

    return () => unsub();
  }, [senderId, roomChats]);

  // Scroll to bottom khi có tin nhắn mới
  useEffect(() => {
    if (showChatModal && chatMessages.length > 0 && flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [chatMessages, showChatModal]);

  const sendMessage = async () => {
    if (messageInput.trim() === "") return;

    setIsSending(true);
    const userMessage = messageInput.trim();
    setMessageInput("");

    const tempMessage = {
      id: Date.now().toString(),
      text: userMessage,
      sender: "doctor",
      timestamp: new Date(),
      isTemp: true,
    };

    setChatMessages((prev) => [...prev, tempMessage]);

    try {
      const docRef = await addDoc(collection(db, "chats", roomChats, "messages"), {
        senderId,
        receiverId,
        message: userMessage,
        timestamp: serverTimestamp(),
      });

      setChatMessages((prev) =>
        prev.map((msg) => (msg.isTemp && msg.text === userMessage ? { ...msg, id: docRef.id, isTemp: false } : msg))
      );
    } catch (err) {
      console.error("Error sending message:", err);
      setChatMessages((prev) => prev.filter((msg) => !msg.isTemp || msg.text !== userMessage));
    } finally {
      setIsSending(false);
    }
  };

  // Lọc và sắp xếp bệnh nhân
  const filteredAndSortedPatients = useMemo(() => {
    const filtered = patientList.filter((patient) => {
      const matchesSearch =
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.disease.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.patientId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || patient.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "age":
          return a.age - b.age;
        case "lastVisit":
          return b.lastVisitDate - a.lastVisitDate;
        case "status":
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return filtered;
  }, [patientList, searchTerm, statusFilter, sortBy]);

  // Phân trang
  const totalPages = Math.ceil(filteredAndSortedPatients.length / patientsPerPage);
  const paginatedPatients = filteredAndSortedPatients.slice(
    (currentPage - 1) * patientsPerPage,
    currentPage * patientsPerPage
  );

  // Cập nhật bệnh nhân
  const handleUpdatePatient = (updatedPatient) => {
    const statusColors = {
      "Cần theo dõi": { color: "#dc3545", textColor: "#fff" },
      "Đang điều trị": { color: "#ffc107", textColor: "#212529" },
      "Ổn định": { color: "#28a745", textColor: "#fff" },
    };

    const updated = {
      ...updatedPatient,
      patientCount: `${updatedPatient.age} tuổi`,
      statusColor: statusColors[updatedPatient.status].color,
      statusTextColor: statusColors[updatedPatient.status].textColor,
    };

    setPatientList(patientList.map((p) => (p.id === updated.id ? updated : p)));
    setShowEditModal(false);
  };

  // Xem và chỉnh sửa bệnh nhân
  const handleViewPatient = (patient) => {
    setSelectedPatient(patient);
    setShowViewModal(true);
  };

  const handleEditPatient = (patient) => {
    setSelectedPatient(patient);
    setShowViewModal(false);
    setShowEditModal(true);
  };

  // Điều hướng trang
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Quản lý bệnh nhân</Text>

      {/* Thống kê */}
      <View style={styles.summaryContainer}>
        {[
          { icon: "!", title: "Cần theo dõi", value: patientList.filter((p) => p.status === "Cần theo dõi").length, color: "#dc3545" },
          { icon: "🏥", title: "Đang điều trị", value: patientList.filter((p) => p.status === "Đang điều trị").length, color: "#ffc107" },
          { icon: "✔", title: "Ổn định", value: patientList.filter((p) => p.status === "Ổn định").length, color: "#28a745" },
        ].map((item, index) => (
          <View key={index} style={styles.summaryCard}>
            <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
              <Text style={[styles.icon, { color: item.color }]}>{item.icon}</Text>
            </View>
            <View>
              <Text style={styles.summaryTitle}>{item.title}</Text>
              <Text style={styles.summaryValue}>{item.value}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Search and Filters */}
      <View style={styles.card}>
        <View style={styles.filterContainer}>
          <View style={styles.searchContainer}>
            <Search color="#6c757d" size={18} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm bệnh nhân..."
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
          <View style={styles.filterRow}>
            <View style={styles.filterItem}>
              <Filter color="#6c757d" size={18} style={styles.filterIcon} />
              <Picker
                selectedValue={statusFilter}
                onValueChange={setStatusFilter}
                style={styles.picker}
              >
                <Picker.Item label="Tất cả tình trạng" value="all" />
                <Picker.Item label="Cần theo dõi" value="Cần theo dõi" />
                <Picker.Item label="Đang điều trị" value="Đang điều trị" />
                <Picker.Item label="Ổn định" value="Ổn định" />
              </Picker>
            </View>
            <View style={styles.filterItem}>
              <Picker
                selectedValue={sortBy}
                onValueChange={setSortBy}
                style={styles.picker}
              >
                <Picker.Item label="Sắp xếp theo tên" value="name" />
                <Picker.Item label="Sắp xếp theo tuổi" value="age" />
                <Picker.Item label="Lần khám gần nhất" value="lastVisit" />
                <Picker.Item label="Tình trạng" value="status" />
              </Picker>
            </View>
          </View>
        </View>
      </View>

      {/* Patient List */}
      <View style={styles.card}>
        {paginatedPatients.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không tìm thấy bệnh nhân nào</Text>
            <Text style={styles.emptySubText}>Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</Text>
          </View>
        ) : (
          paginatedPatients.map((patient) => (
            <View key={patient.id} style={styles.patientRow}>
              <View style={styles.patientInfo}>
                <Image source={{ uri: patient.avatar }} style={styles.avatar} />
                <View>
                  <Text style={styles.patientName}>{patient.name}</Text>
                  <Text style={styles.patientAge}>{patient.patientCount}</Text>
                  <Text style={styles.patientDetail}>{patient.disease}</Text>
                  <Text style={styles.patientDetail}>{patient.patientId}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: patient.statusColor }]}>
                    <Text style={[styles.statusText, { color: patient.statusTextColor }]}>{patient.status}</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.lastVisit}>{patient.lastVisit}</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleViewPatient(patient)}
                >
                  <Eye color="#17a2b8" size={18} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEditPatient(patient)}
                >
                  <Edit color="#28a745" size={18} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => setShowChatModal(true)}
                >
                  <MessageSquare color="#007bff" size={18} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleStartCall(user, { uid: "cq6SC0A1RZXdLwFE1TKGRJG8fgl2" }, "doctor")}
                >
                  <Phone color="#ffc107" size={18} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Pagination */}
      {filteredAndSortedPatients.length > 0 && (
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            style={[styles.pageButton, currentPage === 1 && styles.disabledButton]}
            onPress={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <Text style={styles.pageButtonText}>Trước</Text>
          </TouchableOpacity>
          {[...Array(totalPages).keys()].map((page) => (
            <TouchableOpacity
              key={page + 1}
              style={[styles.pageButton, currentPage === page + 1 && styles.activePageButton]}
              onPress={() => handlePageChange(page + 1)}
            >
              <Text style={styles.pageButtonText}>{page + 1}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.pageButton, currentPage === totalPages && styles.disabledButton]}
            onPress={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <Text style={styles.pageButtonText}>Sau</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Chat Modal */}
      <Modal visible={showChatModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.chatModalContent}>
            <View style={styles.chatHeader}>
              <Text style={styles.modalTitle}>Chat với bệnh nhân</Text>
              <TouchableOpacity onPress={() => setShowChatModal(false)}>
                <X color="#fff" size={18} />
              </TouchableOpacity>
            </View>
            <FlatList
              ref={flatListRef}
              data={chatMessages}
              renderItem={({ item }) => (
                <View style={[styles.chatMessage, item.sender === "doctor" ? styles.doctorMessage : styles.patientMessage]}>
                  <Text style={[styles.messageText, item.sender === "doctor" ? styles.doctorMessageText : styles.patientMessageText]}>
                    {item.text}
                  </Text>
                  <Text style={styles.messageTime}>
                    {item.timestamp instanceof Date
                      ? item.timestamp.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
                      : new Date(item.timestamp).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
              )}
              keyExtractor={(item) => item.id}
              style={styles.chatMessages}
              ListEmptyComponent={
                <View style={styles.emptyChat}>
                  <Bot color="#6c757d" size={24} />
                  <Text style={styles.emptyChatText}>Chưa có tin nhắn nào</Text>
                  <Text style={styles.emptyChatSubText}>Bắt đầu cuộc trò chuyện với bệnh nhân</Text>
                </View>
              }
            />
            <View style={styles.chatInputContainer}>
              <TextInput
                style={styles.chatInput}
                placeholder="Nhập tin nhắn..."
                value={messageInput}
                onChangeText={setMessageInput}
                onSubmitEditing={() => !isSending && sendMessage()}
                editable={!isSending}
              />
              <TouchableOpacity
                style={[styles.sendButton, (!messageInput.trim() || isSending) && styles.disabledSendButton]}
                onPress={sendMessage}
                disabled={isSending || !messageInput.trim()}
              >
                {isSending ? <ActivityIndicator size="small" color="#fff" /> : <Send color="#fff" size={18} />}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modals */}
      <ViewPatientModal
        show={showViewModal}
        onHide={() => setShowViewModal(false)}
        patient={selectedPatient}
        onEdit={handleEditPatient}
      />
      <EditPatientModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        patient={selectedPatient}
        onSave={handleUpdatePatient}
      />
    </ScrollView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 16,
  },
  summaryContainer: {
    marginBottom: 16,
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    padding: 12,
    borderRadius: 12,
    marginRight: 16,
  },
  icon: {
    fontSize: 24,
  },
  summaryTitle: {
    fontSize: 14,
    color: "#6c757d",
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212529",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  filterContainer: {
    paddingVertical: 8,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  filterItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginRight: 8,
  },
  filterIcon: {
    marginLeft: 12,
  },
  picker: {
    flex: 1,
    fontSize: 16,
  },
  patientRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f4",
  },
  patientInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  patientName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
  },
  patientAge: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 4,
  },
  patientDetail: {
    fontSize: 14,
    color: "#495057",
    marginBottom: 2,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  lastVisit: {
    fontSize: 14,
    color: "#212529",
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  pageButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#e9ecef",
    marginHorizontal: 4,
  },
  activePageButton: {
    backgroundColor: "#007bff",
  },
  disabledButton: {
    opacity: 0.5,
  },
  pageButtonText: {
    fontSize: 14,
    color: "#212529",
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: "#6c757d",
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: "#6c757d",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    width: "90%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    color: "#495057",
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  modalButtonGroup: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
  },
  modalButton: {
    backgroundColor: "#6c757d",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 8,
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  chatModalContent: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingTop: 16,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#007bff",
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  chatMessages: {
    flex: 1,
    paddingHorizontal: 16,
  },
  chatMessage: {
    marginBottom: 12,
    maxWidth: "80%",
  },
  doctorMessage: {
    alignSelf: "flex-end",
  },
  patientMessage: {
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  doctorMessageText: {
    backgroundColor: "#007bff",
    color: "#fff",
  },
  patientMessageText: {
    backgroundColor: "#e9ecef",
    color: "#212529",
  },
  messageTime: {
    fontSize: 12,
    color: "#6c757d",
    marginTop: 4,
    textAlign: "right",
  },
  chatInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f3f4",
  },
  chatInput: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 20,
  },
  disabledSendButton: {
    backgroundColor: "#6c757d",
  },
  emptyChat: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  emptyChatText: {
    fontSize: 16,
    color: "#6c757d",
    marginTop: 8,
  },
  emptyChatSubText: {
    fontSize: 14,
    color: "#6c757d",
  },
});