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
  FlatList
} from "react-native";
import { Search, Filter, Eye, Edit, MessageSquare, Phone, ChevronDown, X, Bot, Send, ArrowLeft } from "lucide-react-native";
import { Picker } from "@react-native-picker/picker";
import { collection, onSnapshot, orderBy, query, addDoc, serverTimestamp } from "firebase/firestore";
import { useSelector } from "react-redux";
import { db } from "../../../firebase";
import { acceptCall, endCall, createCall, generateJitsiUrl } from "../../components/call/functionCall";
import ApiPatient from "../../apis/ApiPatient";
import ApiDoctor from "../../apis/ApiDoctor";
import ViewPatientModal from "../../components/doctor/patient/ViewPatientModal";
import EditPatientModal from "../../components/doctor/patient/EditPatientModal";

const { width } = Dimensions.get("window");

// Hàm ánh xạ dữ liệu từ API sang định dạng phù hợp với component
const mapPatientData = (apiPatient, pastAppointments = []) => {
  const statusColors = {
    "Cần theo dõi": { color: "#dc2626", textColor: "#fff" },
    "Đang điều trị": { color: "#f59e0b", textColor: "#1f2937" },
    "Ổn định": { color: "#16a34a", textColor: "#fff" },
  };

  // Xử lý healthRecords an toàn
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

  // Xử lý thông tin userId
  const userId = apiPatient.userId || {};

  // Lấy lịch hẹn gần nhất từ pastAppointments
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
    uid: userId.uid || apiPatient.uid || `uid-${apiPatient._id}`, // Đảm bảo mỗi bệnh nhân có UID cho chat
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

  // Lấy dữ liệu bệnh nhân và lịch hẹn từ API
  useEffect(() => {
    const fetchPatientsAndAppointments = async () => {
      setLoading(true);
      setError(null);
      try {
        // Lấy danh sách bệnh nhân
        const response = await ApiPatient.getAllPatients();
        console.log("Dữ liệu API thô (bệnh nhân):", response); // Debug
        let patients;
        if (Array.isArray(response)) {
          patients = response;
        } else {
          patients = response.data || [];
        }
        console.log("patients extracted:", patients); // Debug

        if (!Array.isArray(patients)) {
          console.warn("Dữ liệu API không đúng định dạng:", response);
          setError("Dữ liệu không hợp lệ từ server. Vui lòng kiểm tra định dạng dữ liệu API.");
          setLoading(false);
          return;
        }

        // Lấy lịch hẹn gần nhất cho từng bệnh nhân
        const patientsWithAppointments = await Promise.all(
          patients.map(async (patient) => {
            try {
              const appointmentsResponse = await ApiDoctor.getPatientPastAppointments(patient._id);
              const appointments = Array.isArray(appointmentsResponse)
                ? appointmentsResponse
                : appointmentsResponse.data || [];
              console.log(`Lịch hẹn của bệnh nhân ${patient._id}:`, appointments); // Debug
              return mapPatientData(patient, appointments);
            } catch (err) {
              console.error(`Lỗi khi lấy lịch hẹn cho bệnh nhân ${patient._id}:`, err.message);
              return mapPatientData(patient, []); // Nếu lỗi, trả về bệnh nhân với lịch hẹn rỗng
            }
          })
        );

        setPatientList(patientsWithAppointments);
      } catch (err) {
        console.error("Lỗi khi gọi API bệnh nhân:", err.message, err.response?.data);
        setError(err.response?.data?.message || "Không thể tải danh sách bệnh nhân. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchPatientsAndAppointments();
  }, []);

  // Thiết lập phòng chat động dựa trên bệnh nhân được chọn
  const getRoomChats = (patientUid) => {
    if (!senderId || !patientUid) return null;
    return [senderId, patientUid].sort().join("_");
  };

  // Lắng nghe tin nhắn từ Firebase
  useEffect(() => {
    if (!senderId || !chatPatient?.uid || !showChatModal) return;

    const roomChats = getRoomChats(chatPatient.uid);
    const q = query(
      collection(db, "chats", roomChats, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
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

      // Scroll xuống cuối danh sách tin nhắn
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }, (error) => {
      console.error("Firebase listener error:", error);
    });

    return () => unsub();
  }, [senderId, chatPatient, showChatModal]);

  // Gửi tin nhắn
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
      const roomChats = getRoomChats(chatPatient.uid);
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
      console.error("Error sending message:", err);
      setChatMessages((prev) => prev.filter((msg) => !msg.isTemp || msg.text !== userMessage));
      setError("Không thể gửi tin nhắn. Vui lòng thử lại.");
    } finally {
      setIsSending(false);
    }
  };

  // Lọc và sắp xếp bệnh nhân
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

  // Phân trang
  const totalPages = Math.ceil(filteredAndSortedPatients.length / patientsPerPage);
  const paginatedPatients = filteredAndSortedPatients.slice(
    (currentPage - 1) * patientsPerPage,
    currentPage * patientsPerPage
  );

  // Cập nhật bệnh nhân
  const handleUpdatePatient = (updatedPatient) => {
    const statusColors = {
      "Cần theo dõi": { color: "#dc2626", textColor: "#fff" },
      "Đang điều trị": { color: "#f59e0b", textColor: "#1f2937" },
      "Ổn định": { color: "#16a34a", textColor: "#fff" },
    };

    const updated = {
      ...updatedPatient,
      patientCount: `${updatedPatient.age || 0} tuổi`,
      statusColor: statusColors[updatedPatient.status]?.color || "#6b7280",
      statusTextColor: statusColors[updatedPatient.status]?.textColor || "#fff",
      lastVisitDate: updatedPatient.lastVisitDate || new Date(),
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

  // Mở chat với bệnh nhân
  const handleOpenChat = (patient) => {
    setChatPatient(patient);
    setShowChatModal(true);
  };

  // Đóng chat
  const handleCloseChat = () => {
    setShowChatModal(false);
    setChatPatient(null);
    setChatMessages([]);
    setMessageInput("");
  };

  // Điều hướng trang
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Hiển thị loading
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Quản lý bệnh nhân</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Đang tải danh sách bệnh nhân...</Text>
        </View>
      </View>
    );
  }

  // Hiển thị lỗi
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Quản lý bệnh nhân</Text>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              setError(null);
              // Gọi lại hàm fetch
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
        <Text style={styles.title}>Quản lý bệnh nhân</Text>

        {/* Thống kê */}
        <View style={styles.summaryContainer}>
          {[
            { icon: "!", title: "Cần theo dõi", value: patientList.filter((p) => p.status === "Cần theo dõi").length, color: "#dc2626" },
            { icon: "🏥", title: "Đang điều trị", value: patientList.filter((p) => p.status === "Đang điều trị").length, color: "#f59e0b" },
            { icon: "✔", title: "Ổn định", value: patientList.filter((p) => p.status === "Ổn định").length, color: "#16a34a" },
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
                <ChevronDown color="#6b7280" size={20} style={styles.filterIcon} />
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
              <Bot color="#6b7280" size={32} />
              <Text style={styles.emptyText}>Không tìm thấy bệnh nhân</Text>
              <Text style={styles.emptySubText}>Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</Text>
            </View>
          ) : (
            paginatedPatients.map((patient) => (
              <View key={patient.id.toString()} style={styles.patientRow}>
                <View style={styles.patientInfo}>
                  <Image source={{ uri: patient.avatar }} style={styles.avatar} onError={() => { }} />
                  <View style={styles.patientDetails}>
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
                  <TouchableOpacity style={styles.actionButton} onPress={() => handleViewPatient(patient)}>
                    <Eye color="#06b6d4" size={20} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={() => handleEditPatient(patient)}>
                    <Edit color="#16a34a" size={20} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={() => handleOpenChat(patient)}>
                    <MessageSquare color="#2563eb" size={20} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleStartCall(user, { uid: patient.uid }, "doctor")}
                  >
                    <Phone color="#f59e0b" size={20} />
                  </TouchableOpacity>
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
              <Text style={styles.chatHeaderTitle}>{chatPatient?.name || "Bệnh nhân"}</Text>
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
                  <Text
                    style={[
                      styles.messageTime,
                      item.sender === "doctor" ? styles.doctorTime : styles.patientTime,
                    ]}
                  >
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
                  <Bot color="#6b7280" size={32} />
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
    backgroundColor: "#f1f5f9",
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 20,
    textAlign: "center",
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
    marginBottom: 12,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#dc2626",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  summaryContainer: {
    marginBottom: 20,
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  icon: {
    fontSize: 24,
    fontWeight: "600",
  },
  summaryTitle: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  filterContainer: {
    paddingVertical: 12,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: "#1f2937",
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  filterItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    overflow: "hidden",
  },
  filterIcon: {
    marginLeft: 12,
    marginRight: 8,
  },
  picker: {
    flex: 1,
    fontSize: 16,
    color: "#1f2937",
  },
  patientRow: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  patientInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  patientDetails: {
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  patientName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  patientAge: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  patientDetail: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 4,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  lastVisit: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 12,
    textAlign: "right",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    marginLeft: 8,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  pageButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 4,
  },
  activePageButton: {
    backgroundColor: "#2563eb",
  },
  activePageButtonText: {
    color: "#fff",
  },
  disabledButton: {
    opacity: 0.5,
  },
  pageButtonText: {
    fontSize: 14,
    color: "#1f2937",
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 8,
    fontWeight: "500",
  },
  emptySubText: {
    fontSize: 14,
    color: "#6b7280",
  },
  chatModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  chatModalBackdrop: {
    flex: 1,
  },
  chatModalContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "100%",
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  backButton: {
    padding: 4,
  },
  headerSpacer: {
    width: 24,
  },
  chatHeaderTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
  chatMessages: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chatMessagesContent: {
    paddingBottom: 16,
  },
  chatMessageContainer: {
    marginVertical: 4,
  },
  doctorMessageContainer: {
    alignItems: "flex-end",
  },
  patientMessageContainer: {
    alignItems: "flex-start",
  },
  messageBubble: {
    maxWidth: "75%",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  doctorBubble: {
    backgroundColor: "#2563eb",
    borderBottomRightRadius: 4,
  },
  patientBubble: {
    backgroundColor: "#e5e7eb",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  doctorMessageText: {
    color: "#fff",
  },
  patientMessageText: {
    color: "#1f2937",
  },
  messageTime: {
    fontSize: 11,
    marginTop: 2,
    opacity: 0.7,
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
    marginRight: 8,
    maxHeight: 100,
    color: "#1f2937",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  sendButton: {
    backgroundColor: "#2563eb",
    padding: 12,
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
    fontSize: 16,
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

