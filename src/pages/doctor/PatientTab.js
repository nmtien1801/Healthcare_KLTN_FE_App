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
  ActivityIndicator,
  Dimensions,
  FlatList,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import {
  Search,
  Filter,
  Eye,
  Edit,
  MessageSquare,
  Phone,
  ChevronDown,
  X,
  Bot,
  Send,
  ArrowLeft,
} from "lucide-react-native";
import { collection, onSnapshot, orderBy, query, addDoc, serverTimestamp } from "firebase/firestore";
import { useSelector } from "react-redux";
import { db } from "../../../firebase";
import ApiPatient from "../../apis/ApiPatient";
import ApiDoctor from "../../apis/ApiDoctor";
import ViewPatientModal from "../../components/doctor/patient/ViewPatientModal";
import EditPatientModal from "../../components/doctor/patient/EditPatientModal";
import { listenStatus } from "../../utils/SetupSignFireBase";

const { width, height } = Dimensions.get("window");

const mapPatientData = (apiPatient, pastAppointments = []) => {
  const statusColors = {
    "Cần theo dõi": { color: "#ef4444", textColor: "#fff" },
    "Đang điều trị": { color: "#f59e0b", textColor: "#fff" },
    "Ổn định": { color: "#22c55e", textColor: "#fff" },
  };

  const hasHealthRecords = apiPatient.healthRecords && Array.isArray(apiPatient.healthRecords) && apiPatient.healthRecords.length > 0;
  const healthRecords = hasHealthRecords
    ? apiPatient.healthRecords.map(record => ({
      id: record._id || `temp-${Date.now()}`,
      date: record.date
        ? new Date(record.date).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
        : "-",
      bloodPressure: record.bloodPressure || "-",
      heartRate: record.heartRate || "-",
      bloodSugar: record.bloodSugar || "-",
      recordedAt: record.recordedAt
        ? new Date(record.recordedAt).toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
        : "-",
    }))
    : [];

  const userId = apiPatient.userId || {};
  const lastAppointment = pastAppointments.length > 0 ? pastAppointments[0] : null;
  const lastVisitDate = lastAppointment && lastAppointment.date ? new Date(lastAppointment.date) : null;

  return {
    id: apiPatient._id || `temp-${Date.now()}`,
    name: userId.username || apiPatient.name || "Không xác định",
    age: apiPatient.age || 0,
    patientCount: `${apiPatient.age || 0} tuổi`,
    avatar: userId.avatar || apiPatient.avatar || "https://via.placeholder.com/150?text=User",
    disease: apiPatient.disease || "Không xác định",
    patientId: apiPatient.insuranceId || "-",
    status: apiPatient.status || "Ổn định",
    statusColor: statusColors[apiPatient.status]?.color || "#6b7280",
    statusTextColor: statusColors[apiPatient.status]?.textColor || "#fff",
    lastVisit: lastVisitDate
      ? lastVisitDate.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })
      : "Chưa có",
    lastVisitDate: lastVisitDate || new Date(),
    phone: userId.phone || apiPatient.phone || "",
    email: userId.email || apiPatient.email || "",
    address: userId.address || apiPatient.address || "",
    bloodType: apiPatient.bloodType || "-",
    allergies: apiPatient.allergies || "Không có",
    emergencyContact: apiPatient.emergencyContact || "Không có",
    notes: apiPatient.notes || "",
    gender: userId.gender || "-",
    dob: userId.dob
      ? new Date(userId.dob).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      : "-",
    role: userId.role || "-",
    healthRecords,
    uid: userId.uid || apiPatient.uid || `uid-${apiPatient._id}`,
  };
};

export default function PatientTab({ handleStartCall }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [patientList, setPatientList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const patientsPerPage = 5;
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [chatPatient, setChatPatient] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const user = useSelector((state) => state.auth.userInfo);
  const senderId = user?.uid;
  const flatListRef = useRef(null);

  // Fetch patients
  const fetchPatientsAndAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ApiPatient.getAllPatients();
      let patients = Array.isArray(response) ? response : response.data || [];

      if (!Array.isArray(patients)) {
        setError("Dữ liệu không hợp lệ từ server.");
        return;
      }

      const patientsWithAppointments = await Promise.all(
        patients.map(async (patient) => {
          try {
            const appointmentsResponse = await ApiDoctor.getPatientPastAppointments(patient._id);
            const appointments = Array.isArray(appointmentsResponse)
              ? appointmentsResponse
              : appointmentsResponse.data || [];
            return mapPatientData(patient, appointments);
          } catch (err) {
            console.error(`Lỗi khi lấy lịch hẹn của ${patient._id}:`, err.message);
            return mapPatientData(patient, []);
          }
        })
      );

      setPatientList(patientsWithAppointments);
    } catch (err) {
      console.error("Lỗi khi gọi API bệnh nhân:", err.message, err.response?.data);
      setError("Không thể tải danh sách bệnh nhân.");
    } finally {
      setLoading(false);
    }
  };

  // Realtime listener for updates
  useEffect(() => {
    const receiverId = "cq6SC0A1RZXdLwFE1TKGRJG8fgl2"; // Cố định nếu chỉ 1 patient
    const roomChats = senderId ? [senderId, receiverId].sort().join("_") : null;

    if (!roomChats) {
      setLoading(false);
      return;
    }

    fetchPatientsAndAppointments();
    const unsub = listenStatus(roomChats, (signal) => {
      console.log("Nhận tín hiệu đầy đủ:", signal);
      if (signal && (signal.status === "update_patient_info" || signal.status === "update_patient_list")) {
        console.log("Cập nhật danh sách bệnh nhân...");
        fetchPatientsAndAppointments();
      } else {
        console.log("Signal không hợp lệ hoặc null, không cập nhật.");
      }
    });

    return () => unsub && unsub();
  }, [senderId]);

  // Realtime listener for chat messages
  useEffect(() => {
    if (!senderId || !chatPatient?.uid || !showChatModal) return;

    const roomChats = [senderId, chatPatient.uid].sort().join("_");
    const q = query(
      collection(db, "chats", roomChats, "messages"),
      orderBy("timestamp", "asc")
    );

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
            originalData: data,
          };
        });
        setChatMessages(messages);
      },
      (error) => {
        console.error("Lỗi lắng nghe tin nhắn:", error);
      }
    );

    return () => unsub();
  }, [senderId, chatPatient?.uid, showChatModal]);

  // Auto scroll to new message
  useEffect(() => {
    if (showChatModal && chatMessages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [chatMessages, showChatModal]);

  // Send message
  const sendMessage = async () => {
    if (messageInput.trim() === "" || !chatPatient?.uid) return;

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
      const roomChats = [senderId, chatPatient.uid].sort().join("_");
      const docRef = await addDoc(collection(db, "chats", roomChats, "messages"), {
        senderId,
        receiverId: chatPatient.uid,
        message: userMessage,
        timestamp: serverTimestamp(),
      });

      setChatMessages((prev) =>
        prev.map((msg) =>
          msg.isTemp && msg.text === userMessage
            ? { ...msg, id: docRef.id, isTemp: false }
            : msg
        )
      );
    } catch (err) {
      console.error("Lỗi gửi tin nhắn:", err);
      setChatMessages((prev) => prev.filter((msg) => !msg.isTemp || msg.text !== userMessage));
    } finally {
      setIsSending(false);
    }
  };

  // Update patient
  const handleUpdatePatient = (updatedPatient) => {
    const statusColors = {
      "Cần theo dõi": { color: "#ef4444", textColor: "#fff" },
      "Đang điều trị": { color: "#f59e0b", textColor: "#fff" },
      "Ổn định": { color: "#22c55e", textColor: "#fff" },
    };

    const updated = {
      ...updatedPatient,
      patientCount: `${updatedPatient.age || 0} tuổi`,
      statusColor: statusColors[updatedPatient.status]?.color || "#6b7280",
      statusTextColor: statusColors[updatedPatient.status]?.textColor || "#fff",
      lastVisitDate: updatedPatient.lastVisitDate || new Date(),
    };

    setPatientList((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setShowEditModal(false);
  };

  // View and edit patient
  const handleViewPatient = (patient) => {
    setSelectedPatient(patient);
    setShowViewModal(true);
  };

  const handleEditPatient = (patient) => {
    setSelectedPatient(patient);
    setShowViewModal(false);
    setShowEditModal(true);
  };

  // Open chat
  const handleOpenChat = (patient) => {
    setChatPatient(patient);
    setShowChatModal(true);
  };

  // Close chat
  const handleCloseChat = () => {
    setShowChatModal(false);
    setChatPatient(null);
    setChatMessages([]);
    setMessageInput("");
  };

  // Page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Filtered and sorted patients
  const filteredAndSortedPatients = useMemo(() => {
    if (loading || error) return [];

    const filtered = patientList.filter((patient) => {
      const matchesSearch =
        (patient.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (patient.disease?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (patient.patientId?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || patient.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "age":
          return (a.age || 0) - (b.age || 0);
        case "lastVisit":
          return (b.lastVisitDate || new Date()) - (a.lastVisitDate || new Date());
        case "status":
          return (a.status || "").localeCompare(b.status || "");
        default:
          return 0;
      }
    });

    return filtered;
  }, [patientList, searchTerm, statusFilter, sortBy, loading, error]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedPatients.length / patientsPerPage);
  const paginatedPatients = filteredAndSortedPatients.slice(
    (currentPage - 1) * patientsPerPage,
    currentPage * patientsPerPage
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Quản lý bệnh nhân</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Quản lý bệnh nhân</Text>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              fetchPatientsAndAppointments();
            }}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Search and Filters */}
        <View style={styles.filterCard}>
          <View style={styles.searchContainer}>
            <Search color="#6b7280" size={20} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm bệnh nhân..."
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholderTextColor="#9ca3af"
            />
          </View>
          <View style={styles.filterRow}>
            <View style={styles.filterItem}>
              <Filter color="#6b7280" size={20} style={styles.filterIcon} />
              <View style={styles.pickerContainer}>
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
            </View>
            <View style={styles.filterItem}>
              <ChevronDown color="#6b7280" size={20} style={styles.filterIcon} />
              <View style={styles.pickerContainer}>
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
        <View style={styles.patientList}>
          {paginatedPatients.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Bot color="#6b7280" size={40} />
              <Text style={styles.emptyText}>Không tìm thấy bệnh nhân</Text>
              <Text style={styles.emptySubText}>Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</Text>
            </View>
          ) : (
            paginatedPatients.map((patient) => (
              <View key={patient.id} style={styles.patientCard}>
                <View style={styles.patientInfo}>
                  <Image
                    source={{ uri: patient.avatar }}
                    style={styles.avatar}
                    onError={() => console.log("Error loading avatar for:", patient.name)}
                  />
                  <View style={styles.patientDetails}>
                    <Text style={styles.patientName}>{patient.name}</Text>
                    <Text style={styles.patientDetail}>{patient.patientCount}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: patient.statusColor }]}>
                    <Text style={[styles.statusText, { color: patient.statusTextColor }]}>
                      {patient.status}
                    </Text>
                  </View>
                </View>
                <View style={styles.patientInfo}>
                  <View style={styles.patientDetails}>
                    <Text style={styles.patientDetail}>{patient.disease}</Text>
                    <Text style={styles.patientDetail}>ID: {patient.patientId}</Text>
                    <Text style={styles.lastVisit}>Lần khám cuối: {patient.lastVisit}</Text>
                  </View>
                  <View style={styles.patientRightSection}>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleViewPatient(patient)}
                      >
                        <Eye color="#06b6d4" size={20} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleEditPatient(patient)}
                      >
                        <Edit color="#22c55e" size={20} />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleOpenChat(patient)}
                      >
                        <MessageSquare color="#3b82f6" size={20} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleStartCall(user, { uid: patient.uid }, "doctor")}
                      >
                        <Phone color="#f59e0b" size={20} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Pagination */}
        {filteredAndSortedPatients.length > patientsPerPage && (
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
                <Text style={[styles.pageButtonText, currentPage === page + 1 && styles.activePageButtonText]}>
                  {page + 1}
                </Text>
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
      </ScrollView>

      {/* Chat Modal */}
      <Modal visible={showChatModal} animationType="slide" transparent={true}>
        <View style={styles.chatModalOverlay}>
          <TouchableOpacity style={styles.chatModalBackdrop} activeOpacity={1} onPress={handleCloseChat} />
          <View style={styles.chatModalContent}>
            <View style={styles.chatHeader}>
              <TouchableOpacity onPress={handleCloseChat} style={styles.backButton}>
                <ArrowLeft color="#fff" size={24} />
              </TouchableOpacity>
              <Text style={styles.chatHeaderTitle}>{chatPatient?.name || "Chat với bệnh nhân"}</Text>
              <View style={styles.headerSpacer} />
            </View>
            <FlatList
              ref={flatListRef}
              data={chatMessages}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.chatMessageContainer,
                    item.sender === "doctor" ? styles.doctorMessageContainer : styles.patientMessageContainer,
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      item.sender === "doctor" ? styles.doctorBubble : styles.patientBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        item.sender === "doctor" ? styles.doctorMessageText : styles.patientMessageText,
                      ]}
                    >
                      {item.text}
                    </Text>
                  </View>
                  <Text style={[styles.messageTime, item.sender === "doctor" ? styles.doctorTime : styles.patientTime]}>
                    {item.timestamp instanceof Date
                      ? item.timestamp.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
                      : new Date(item.timestamp).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
              )}
              keyExtractor={(item) => item.id}
              style={styles.chatMessages}
              contentContainerStyle={styles.chatMessagesContent}
              ListEmptyComponent={
                <View style={styles.emptyChat}>
                  <Bot color="#6b7280" size={40} />
                  <Text style={styles.emptyChatText}>Chưa có tin nhắn</Text>
                  <Text style={styles.emptyChatSubText}>Bắt đầu cuộc trò chuyện với bệnh nhân</Text>
                </View>
              }
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />
            <View style={styles.chatInputContainer}>
              <TextInput
                style={styles.chatInput}
                placeholder="Nhập tin nhắn..."
                value={messageInput}
                onChangeText={setMessageInput}
                onSubmitEditing={sendMessage}
                editable={!isSending}
                placeholderTextColor="#9ca3af"
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[styles.sendButton, (!messageInput.trim() || isSending) && styles.disabledSendButton]}
                onPress={sendMessage}
                disabled={isSending || !messageInput.trim()}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Send color="#fff" size={20} />
                )}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    marginTop: 62,
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 24,
    textAlign: "center",
    fontFamily: "System",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#6b7280",
    marginTop: 12,
    fontWeight: "500",
  },
  errorContainer: {
    backgroundColor: "#fee2e2",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    margin: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#dc2626",
    marginBottom: 16,
    textAlign: "center",
    fontWeight: "500",
  },
  retryButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  filterCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    color: "#1e293b",
    fontFamily: "System",
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  filterItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
    overflow: "hidden",
  },
  filterIcon: {
    marginLeft: 12,
    marginRight: 8,
  },
  pickerContainer: {
    flex: 1,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
  },
  picker: {
    fontSize: 16,
    color: "#1e293b",
  },
  patientList: {
    marginBottom: 24,
  },
  patientCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  patientInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginBottom: 8,
  },
  patientDetails: {
    flex: 1,
  },
  patientRightSection: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 8,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  patientName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 6,
  },
  patientDetail: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 4,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  lastVisit: {
    fontSize: 14,
    color: "#4b5563",
    marginTop: 12,
  },
  actionButtons: {
    flexDirection: "row",
  },
  actionButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    marginLeft: 8,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  pageButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    marginHorizontal: 4,
  },
  activePageButton: {
    backgroundColor: "#3b82f6",
  },
  activePageButtonText: {
    color: "#fff",
  },
  disabledButton: {
    opacity: 0.5,
  },
  pageButtonText: {
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: "#6b7280",
    marginTop: 12,
    fontWeight: "500",
  },
  emptySubText: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
    textAlign: "center",
  },
  chatModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  chatModalBackdrop: {
    flex: 1,
  },
  chatModalContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.8,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  backButton: {
    padding: 8,
  },
  headerSpacer: {
    width: 24,
  },
  chatHeaderTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
  chatMessages: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  chatMessagesContent: {
    paddingBottom: 16,
  },
  chatMessageContainer: {
    marginVertical: 6,
  },
  doctorMessageContainer: {
    alignItems: "flex-end",
  },
  patientMessageContainer: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  doctorBubble: {
    backgroundColor: "#3b82f6",
    borderBottomRightRadius: 4,
  },
  patientBubble: {
    backgroundColor: "#e5e7eb",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  doctorMessageText: {
    color: "#fff",
  },
  patientMessageText: {
    color: "#1e293b",
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
    color: "#6b7280",
  },
  doctorTime: {
    textAlign: "right",
  },
  patientTime: {
    textAlign: "left",
  },
  chatInputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 16,
    backgroundColor: "#f8fafc",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  chatInput: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 12,
    maxHeight: 120,
    color: "#1e293b",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  sendButton: {
    backgroundColor: "#3b82f6",
    padding: 14,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  disabledSendButton: {
    backgroundColor: "#9ca3af",
  },
  emptyChat: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: 40,
  },
  emptyChatText: {
    fontSize: 18,
    color: "#6b7280",
    marginTop: 12,
    fontWeight: "500",
  },
  emptyChatSubText: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
    textAlign: "center",
  },
});