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
  Dimensions,
} from "react-native";
import { Search, Filter, Eye, Edit, MessageSquare, Phone, ChevronDown, X, Bot, Send, ArrowLeft } from "lucide-react-native";
import { Picker } from "@react-native-picker/picker";
import { collection, onSnapshot, orderBy, query, addDoc, serverTimestamp } from "firebase/firestore";
import { useSelector } from "react-redux";
import { db } from "../../../firebase";
import { acceptCall, endCall, createCall, generateJitsiUrl } from "../../components/call/functionCall";

// Mock data với UID cho từng bệnh nhân để chat động
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
    statusColor: "bg-danger",
    statusTextColor: "text-white",
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
  {
    id: 2,
    name: "Nguyễn Thị Mai",
    age: 52,
    patientCount: "52 tuổi",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    disease: "Tiểu đường type 2",
    patientId: "BHYT: BH987654321",
    status: "Đang điều trị",
    statusColor: "bg-warning",
    statusTextColor: "text-dark",
    lastVisit: "20/06/2025",
    lastVisitDate: new Date("2025-06-20"),
    phone: "0912345678",
    email: "nguyenthimai@email.com",
    address: "456 Đường DEF, Quận 3, TP.HCM",
    bloodType: "B",
    allergies: "",
    emergencyContact: "Nguyễn Văn Nam - 0976543210 (Con trai)",
    notes: "Đang điều trị insulin, cần kiểm tra định kỳ",
  },
  {
    id: 3,
    name: "Lê Minh Tuấn",
    age: 35,
    patientCount: "35 tuổi",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    disease: "Viêm phổi",
    patientId: "BHYT: BH456789123",
    status: "Cần theo dõi",
    statusColor: "bg-danger",
    statusTextColor: "text-white",
    lastVisit: "21/06/2025",
    lastVisitDate: new Date("2025-06-21"),
    phone: "0923456789",
    email: "leminhtuan@email.com",
    address: "789 Đường GHI, Quận 5, TP.HCM",
    bloodType: "O",
    allergies: "Không có",
    emergencyContact: "Lê Thị Lan - 0965432109 (Vợ)",
    notes: "Đã hồi phục tốt, cần theo dõi thêm 1 tuần",
  },
  {
    id: 4,
    name: "Phạm Thị Hương",
    age: 72,
    patientCount: "72 tuổi",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    disease: "Suy tim, Tăng huyết áp",
    patientId: "BHYT: BH789123456",
    status: "Ổn định",
    statusColor: "bg-success",
    statusTextColor: "text-white",
    lastVisit: "18/06/2025",
    lastVisitDate: new Date("2025-06-18"),
    phone: "0934567890",
    email: "",
    address: "321 Đường JKL, Quận 7, TP.HCM",
    bloodType: "AB",
    allergies: "Aspirin",
    emergencyContact: "Phạm Văn Minh - 0954321098 (Con trai)",
    notes: "Tình trạng ổn định, tiếp tục dùng thuốc theo đơn",
  },
  {
    id: 5,
    name: "Phạm Thị Hương1",
    age: 72,
    patientCount: "72 tuổi",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    disease: "Suy tim, Tăng huyết áp",
    patientId: "BHYT: BH789123456",
    status: "Ổn định",
    statusColor: "bg-success",
    statusTextColor: "text-white",
    lastVisit: "18/06/2025",
    lastVisitDate: new Date("2025-06-18"),
    phone: "0934567890",
    email: "",
    address: "321 Đường JKL, Quận 7, TP.HCM",
    bloodType: "AB",
    allergies: "Aspirin",
    emergencyContact: "Phạm Văn Minh - 0954321098 (Con trai)",
    notes: "Tình trạng ổn định, tiếp tục dùng thuốc theo đơn",
  },
  {
    id: 6,
    name: "Phạm Thị Hương12",
    age: 72,
    patientCount: "72 tuổi",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    disease: "Suy tim, Tăng huyết áp",
    patientId: "BHYT: BH789123456",
    status: "Ổn định",
    statusColor: "bg-success",
    statusTextColor: "text-white",
    lastVisit: "18/06/2025",
    lastVisitDate: new Date("2025-06-18"),
    phone: "0934567890",
    email: "",
    address: "321 Đường JKL, Quận 7, TP.HCM",
    bloodType: "AB",
    allergies: "Aspirin",
    emergencyContact: "Phạm Văn Minh - 0954321098 (Con trai)",
    notes: "Tình trạng ổn định, tiếp tục dùng thuốc theo đơn",
  },
  {
    id: 7,
    name: "Phạm Thị Hương3",
    age: 72,
    patientCount: "72 tuổi",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    disease: "Suy tim, Tăng huyết áp",
    patientId: "BHYT: BH789123456",
    status: "Ổn định",
    statusColor: "bg-success",
    statusTextColor: "text-white",
    lastVisit: "18/06/2025",
    lastVisitDate: new Date("2025-06-18"),
    phone: "0934567890",
    email: "",
    address: "321 Đường JKL, Quận 7, TP.HCM",
    bloodType: "AB",
    allergies: "Aspirin",
    emergencyContact: "Phạm Văn Minh - 0954321098 (Con trai)",
    notes: "Tình trạng ổn định, tiếp tục dùng thuốc theo đơn",
  },
]

// ViewPatientModal
const ViewPatientModal = ({ show, onHide, patient, onEdit }) => (
  <Modal visible={show} animationType="slide" transparent={true}>
    <View style={styles.modalContainer}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Thông tin bệnh nhân</Text>
          <TouchableOpacity onPress={onHide} style={styles.closeButton}>
            <X color="#6b7280" size={24} />
          </TouchableOpacity>
        </View>
        {patient && (
          <ScrollView style={styles.modalBody}>
            <View style={styles.modalInfoCard}>
              <Text style={styles.modalLabel}>Tên:</Text>
              <Text style={styles.modalText}>{patient.name}</Text>
              <Text style={styles.modalLabel}>Tuổi:</Text>
              <Text style={styles.modalText}>{patient.age}</Text>
              <Text style={styles.modalLabel}>Bệnh:</Text>
              <Text style={styles.modalText}>{patient.disease}</Text>
              <Text style={styles.modalLabel}>Mã BHYT:</Text>
              <Text style={styles.modalText}>{patient.patientId}</Text>
              <Text style={styles.modalLabel}>Trạng thái:</Text>
              <Text style={[styles.modalText, { color: patient.statusColor, fontWeight: '600' }]}>{patient.status}</Text>
              <Text style={styles.modalLabel}>Lần khám cuối:</Text>
              <Text style={styles.modalText}>{patient.lastVisit}</Text>
              <Text style={styles.modalLabel}>Số điện thoại:</Text>
              <Text style={styles.modalText}>{patient.phone}</Text>
              <Text style={styles.modalLabel}>Email:</Text>
              <Text style={styles.modalText}>{patient.email || "Không có"}</Text>
              <Text style={styles.modalLabel}>Địa chỉ:</Text>
              <Text style={styles.modalText}>{patient.address}</Text>
              <Text style={styles.modalLabel}>Nhóm máu:</Text>
              <Text style={styles.modalText}>{patient.bloodType}</Text>
              <Text style={styles.modalLabel}>Dị ứng:</Text>
              <Text style={styles.modalText}>{patient.allergies || "Không có"}</Text>
              <Text style={styles.modalLabel}>Liên hệ khẩn cấp:</Text>
              <Text style={styles.modalText}>{patient.emergencyContact}</Text>
              <Text style={styles.modalLabel}>Ghi chú:</Text>
              <Text style={styles.modalText}>{patient.notes}</Text>
            </View>
          </ScrollView>
        )}
        <View style={styles.modalButtonGroup}>
          <TouchableOpacity style={styles.modalButton} onPress={onHide}>
            <Text style={styles.modalButtonText}>Đóng</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.modalButton, styles.editButton]} onPress={() => onEdit(patient)}>
            <Text style={styles.modalButtonText}>Chỉnh sửa</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

// EditPatientModal
const EditPatientModal = ({ show, onHide, patient, onSave }) => {
  const [formData, setFormData] = useState(patient || {});
  const handleChange = (key, value) => setFormData({ ...formData, [key]: value });

  useEffect(() => {
    if (patient) {
      setFormData(patient);
    }
  }, [patient]);

  return (
    <Modal visible={show} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chỉnh sửa bệnh nhân</Text>
            <TouchableOpacity onPress={onHide} style={styles.closeButton}>
              <X color="#6b7280" size={24} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <TextInput
              style={styles.modalInput}
              value={formData.name || ""}
              onChangeText={(text) => handleChange("name", text)}
              placeholder="Tên bệnh nhân"
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              style={styles.modalInput}
              value={formData.age ? String(formData.age) : ""}
              onChangeText={(text) => handleChange("age", text ? parseInt(text, 10) : "")}
              placeholder="Tuổi"
              keyboardType="numeric"
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              style={styles.modalInput}
              value={formData.disease || ""}
              onChangeText={(text) => handleChange("disease", text)}
              placeholder="Bệnh lý"
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              style={styles.modalInput}
              value={formData.patientId || ""}
              onChangeText={(text) => handleChange("patientId", text)}
              placeholder="Mã BHYT"
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              style={styles.modalInput}
              value={formData.phone || ""}
              onChangeText={(text) => handleChange("phone", text)}
              placeholder="Số điện thoại"
              keyboardType="phone-pad"
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              style={styles.modalInput}
              value={formData.email || ""}
              onChangeText={(text) => handleChange("email", text)}
              placeholder="Email"
              keyboardType="email-address"
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              style={styles.modalInput}
              value={formData.address || ""}
              onChangeText={(text) => handleChange("address", text)}
              placeholder="Địa chỉ"
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              style={styles.modalInput}
              value={formData.bloodType || ""}
              onChangeText={(text) => handleChange("bloodType", text)}
              placeholder="Nhóm máu"
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              style={styles.modalInput}
              value={formData.allergies || ""}
              onChangeText={(text) => handleChange("allergies", text)}
              placeholder="Dị ứng"
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              style={styles.modalInput}
              value={formData.emergencyContact || ""}
              onChangeText={(text) => handleChange("emergencyContact", text)}
              placeholder="Liên hệ khẩn cấp"
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              style={styles.modalInput}
              value={formData.notes || ""}
              onChangeText={(text) => handleChange("notes", text)}
              placeholder="Ghi chú"
              multiline
              numberOfLines={4}
              placeholderTextColor="#9ca3af"
            />
            <Picker
              selectedValue={formData.status || "Ổn định"}
              onValueChange={(value) => handleChange("status", value)}
              style={styles.modalPicker}
            >
              <Picker.Item label="Cần theo dõi" value="Cần theo dõi" />
              <Picker.Item label="Đang điều trị" value="Đang điều trị" />
              <Picker.Item label="Ổn định" value="Ổn định" />
            </Picker>
          </ScrollView>
          <View style={styles.modalButtonGroup}>
            <TouchableOpacity style={styles.modalButton} onPress={onHide}>
              <Text style={styles.modalButtonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
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
  const [chatPatient, setChatPatient] = useState(null);
  const [showChatbot, setShowChatbot] = useState(false); // chat với bệnh nhân
  const [messageInput, setMessageInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const user = useSelector((state) => state.auth.userInfo);
  const senderId = user?.uid;
  const receiverId = "cq6SC0A1RZXdLwFE1TKGRJG8fgl2";
  const flatListRef = useRef(null);


  const roomChats = [senderId, receiverId].sort().join('_');
  useEffect(() => {
    if (!senderId) return;

    const q = query(
      collection(db, 'chats', roomChats, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => {
        const data = doc.data();

        return {
          id: doc.id,
          text: data.message || data.text || '', // Hỗ trợ cả 'message' và 'text'
          sender: data.senderId === senderId ? "doctor" : "patient",
          timestamp: data.timestamp ? data.timestamp.toDate() : new Date(), // Chuyển đổi Firestore timestamp
          originalData: data // Lưu trữ dữ liệu gốc để debug
        };
      });

      setChatMessages(messages);
    }, (error) => {
      console.error('Firebase listener error:', error);
    });

    return () => unsub();
  }, [senderId, roomChats]);

  // Scroll to bottom khi có tin nhắn mới
  useEffect(() => {
    if (showChatbot && chatMessages.length > 0) {
      const chatContainer = document.querySelector('.chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }
  }, [chatMessages, showChatbot]);

  const sendMessage = async () => {
    if (messageInput.trim() === "") return;

    setIsSending(true);
    const userMessage = messageInput.trim();
    setMessageInput("");

    // Thêm tin nhắn vào UI ngay lập tức
    const tempMessage = {
      id: Date.now().toString(), // Tạo ID tạm thời
      text: userMessage,
      sender: "doctor",
      timestamp: new Date(),
      isTemp: true // Đánh dấu là tin nhắn tạm thời
    };

    setChatMessages((prev) => [...prev, tempMessage]);

    try {
      const docRef = await addDoc(collection(db, "chats", roomChats, "messages"), {
        senderId,
        receiverId,
        message: userMessage, // Sử dụng 'message' để nhất quán
        timestamp: serverTimestamp()
      });

      // Cập nhật tin nhắn tạm thời thành tin nhắn thật
      setChatMessages((prev) => prev.map(msg =>
        msg.isTemp && msg.text === userMessage
          ? { ...msg, id: docRef.id, isTemp: false }
          : msg
      ));

    } catch (err) {
      console.error('Error sending message:', err);
      // Xóa tin nhắn khỏi UI nếu gửi thất bại
      setChatMessages((prev) => prev.filter(msg => !msg.isTemp || msg.text !== userMessage));
      // Có thể thay thế bằng toast notification sau này
      console.error("Lỗi kết nối đến máy chủ:", err);
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
      "Cần theo dõi": { color: "#dc2626", textColor: "#fff" },
      "Đang điều trị": { color: "#f59e0b", textColor: "#1f2937" },
      "Ổn định": { color: "#16a34a", textColor: "#fff" },
    };

    // Parse lastVisit nếu cần, nhưng giả sử giữ nguyên string
    const updated = {
      ...updatedPatient,
      patientCount: `${updatedPatient.age} tuổi`,
      statusColor: statusColors[updatedPatient.status]?.color || "#16a34a",
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

  // Mở chat với bệnh nhân cụ thể
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
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
            <View key={patient.id} style={styles.patientRow}>
              <View style={styles.patientInfo}>
                <Image source={{ uri: patient.avatar }} style={styles.avatar} />
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
                  <Edit color="#16a34a" size={20} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleOpenChat(patient)}
                >
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
              <Text style={[styles.pageButtonText, currentPage === page + 1 && styles.activePageButtonText]}>{page + 1}</Text>
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

      {/* Chat Modal - Cải thiện UI mobile: full height, bottom sheet style, better bubbles */}
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
                <View style={[
                  styles.chatMessageContainer,
                  item.sender === "doctor" ? styles.doctorMessageContainer : styles.patientMessageContainer
                ]}>
                  <View style={[
                    styles.messageBubble,
                    item.sender === "doctor" ? styles.doctorBubble : styles.patientBubble
                  ]}>
                    <Text style={[
                      styles.messageText,
                      item.sender === "doctor" ? styles.doctorMessageText : styles.patientMessageText
                    ]}>
                      {item.text}
                    </Text>
                  </View>
                  <Text style={[
                    styles.messageTime,
                    item.sender === "doctor" ? styles.doctorTime : styles.patientTime
                  ]}>
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
                style={[
                  styles.sendButton,
                  (!messageInput.trim() || isSending) && styles.disabledSendButton
                ]}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f5f9",
  },
  contentContainer: {
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
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
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
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    maxHeight: Dimensions.get('window').height * 0.6,
  },
  modalInfoCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginTop: 8,
  },
  modalText: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
    color: "#1f2937",
  },
  modalPicker: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#fff",
    color: "#1f2937",
  },
  modalButtonGroup: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
  },
  modalButton: {
    backgroundColor: "#6b7280",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: "#16a34a",
  },
  saveButton: {
    backgroundColor: "#2563eb",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Chat UI cải thiện cho mobile
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
    alignItems: "flex-end",
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