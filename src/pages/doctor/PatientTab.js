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
  Dimensions,
} from "react-native";
import { Search, Filter, Eye, Edit, MessageSquare, Phone, ChevronDown, X, Bot, Send } from "lucide-react-native";
import { Picker } from "@react-native-picker/picker";
import { collection, onSnapshot, orderBy, query, addDoc, serverTimestamp } from "firebase/firestore";
import { useSelector } from "react-redux";
import { db } from "../../../firebase";
import { acceptCall, endCall, createCall, generateJitsiUrl } from "../../components/call/functionCall";

// Mock data với nhiều bệnh nhân hơn
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
    statusColor: "#dc2626",
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
  {
    id: 2,
    name: "Nguyễn Thị Lan",
    age: 45,
    patientCount: "45 tuổi",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    disease: "Viêm khớp dạng thấp",
    patientId: "BHYT: BH987654321",
    status: "Đang điều trị",
    statusColor: "#f59e0b",
    statusTextColor: "#1f2937",
    lastVisit: "10/09/2025",
    lastVisitDate: new Date("2025-09-10"),
    phone: "0912345678",
    email: "nguyenthilan@email.com",
    address: "456 Đường XYZ, Quận 7, TP.HCM",
    bloodType: "O",
    allergies: "Không có",
    emergencyContact: "Nguyễn Văn Hùng - 0932145678 (Chồng)",
    notes: "Bệnh nhân đang dùng thuốc chống viêm, cần tái khám định kỳ",
  },
  {
    id: 3,
    name: "Lê Minh Tuấn",
    age: 30,
    patientCount: "30 tuổi",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    disease: "Viêm dạ dày mãn tính",
    patientId: "BHYT: BH456789123",
    status: "Ổn định",
    statusColor: "#16a34a",
    statusTextColor: "#fff",
    lastVisit: "01/08/2025",
    lastVisitDate: new Date("2025-08-01"),
    phone: "0923456789",
    email: "leminhtuan@email.com",
    address: "789 Đường DEF, TP. Thủ Đức, TP.HCM",
    bloodType: "B",
    allergies: "Hải sản",
    emergencyContact: "Lê Thị Hồng - 0943216789 (Mẹ)",
    notes: "Bệnh nhân cần duy trì chế độ ăn uống lành mạnh",
  },
  {
    id: 4,
    name: "Phạm Thị Hương",
    age: 52,
    patientCount: "52 tuổi",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face",
    disease: "Suy giáp",
    patientId: "BHYT: BH789123456",
    status: "Đang điều trị",
    statusColor: "#f59e0b",
    statusTextColor: "#1f2937",
    lastVisit: "20/08/2025",
    lastVisitDate: new Date("2025-08-20"),
    phone: "0934567890",
    email: "phamthihuong@email.com",
    address: "101 Đường GHI, Quận 3, TP.HCM",
    bloodType: "AB",
    allergies: "Không có",
    emergencyContact: "Phạm Văn Nam - 0956789012 (Chồng)",
    notes: "Bệnh nhân cần kiểm tra hormone định kỳ",
  },
  {
    id: 5,
    name: "Võ Quốc Anh",
    age: 27,
    patientCount: "27 tuổi",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face",
    disease: "Hen suyễn",
    patientId: "BHYT: BH321654987",
    status: "Ổn định",
    statusColor: "#16a34a",
    statusTextColor: "#fff",
    lastVisit: "05/09/2025",
    lastVisitDate: new Date("2025-09-05"),
    phone: "0945678901",
    email: "voquocanh@email.com",
    address: "202 Đường JKL, Quận 5, TP.HCM",
    bloodType: "A",
    allergies: "Bụi, lông thú",
    emergencyContact: "Võ Thị Ngọc - 0967890123 (Chị)",
    notes: "Bệnh nhân cần tránh môi trường ô nhiễm",
  },
  {
    id: 6,
    name: "Đỗ Thị Minh Thư",
    age: 60,
    patientCount: "60 tuổi",
    avatar: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=150&h=150&fit=crop&crop=face",
    disease: "Loãng xương, Tăng huyết áp",
    patientId: "BHYT: BH654987321",
    status: "Cần theo dõi",
    statusColor: "#dc2626",
    statusTextColor: "#fff",
    lastVisit: "25/07/2025",
    lastVisitDate: new Date("2025-07-25"),
    phone: "0956789012",
    email: "dothiminhthu@email.com",
    address: "303 Đường MNO, Quận 10, TP.HCM",
    bloodType: "O",
    allergies: "Không có",
    emergencyContact: "Đỗ Văn Hùng - 0978901234 (Con trai)",
    notes: "Bệnh nhân cần bổ sung canxi và tái khám định kỳ",
  },
  {
    id: 7,
    name: "Hoàng Văn Đức",
    age: 39,
    patientCount: "39 tuổi",
    avatar: "https://images.unsplash.com/photo-1522552557456-20e6e4c00b6b?w=150&h=150&fit=crop&crop=face",
    disease: "Viêm gan B",
    patientId: "BHYT: BH147258369",
    status: "Đang điều trị",
    statusColor: "#f59e0b",
    statusTextColor: "#1f2937",
    lastVisit: "12/09/2025",
    lastVisitDate: new Date("2025-09-12"),
    phone: "0967890123",
    email: "hoangvanduc@email.com",
    address: "404 Đường PQR, Quận Bình Thạnh, TP.HCM",
    bloodType: "B",
    allergies: "Không có",
    emergencyContact: "Hoàng Thị Lan - 0989012345 (Vợ)",
    notes: "Bệnh nhân đang dùng thuốc kháng virus",
  },
  {
    id: 8,
    name: "Trương Thị Kim Ngân",
    age: 33,
    patientCount: "33 tuổi",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    disease: "Thiếu máu",
    patientId: "BHYT: BH258369147",
    status: "Ổn định",
    statusColor: "#16a34a",
    statusTextColor: "#fff",
    lastVisit: "30/08/2025",
    lastVisitDate: new Date("2025-08-30"),
    phone: "0978901234",
    email: "truongthikimngan@email.com",
    address: "505 Đường STU, Quận Gò Vấp, TP.HCM",
    bloodType: "A",
    allergies: "Thuốc sulfa",
    emergencyContact: "Trương Văn Hòa - 0990123456 (Chồng)",
    notes: "Bệnh nhân cần bổ sung sắt và vitamin B12",
  },
  {
    id: 9,
    name: "Bùi Văn Hùng",
    age: 55,
    patientCount: "55 tuổi",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    disease: "Bệnh phổi tắc nghẽn mãn tính (COPD)",
    patientId: "BHYT: BH369147258",
    status: "Cần theo dõi",
    statusColor: "#dc2626",
    statusTextColor: "#fff",
    lastVisit: "18/08/2025",
    lastVisitDate: new Date("2025-08-18"),
    phone: "0989012345",
    email: "buivanhung@email.com",
    address: "606 Đường VWX, Quận 12, TP.HCM",
    bloodType: "AB",
    allergies: "Không có",
    emergencyContact: "Bùi Thị Mai - 0902345678 (Vợ)",
    notes: "Bệnh nhân cần sử dụng máy thở định kỳ",
  },
  {
    id: 10,
    name: "Lý Thị Hồng Nhung",
    age: 29,
    patientCount: "29 tuổi",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face",
    disease: "Suy thận mạn giai đoạn 2",
    patientId: "BHYT: BH741852963",
    status: "Đang điều trị",
    statusColor: "#f59e0b",
    statusTextColor: "#1f2937",
    lastVisit: "05/09/2025",
    lastVisitDate: new Date("2025-09-05"),
    phone: "0990123456",
    email: "lythihongnhung@email.com",
    address: "707 Đường YZA, Quận Tân Bình, TP.HCM",
    bloodType: "O",
    allergies: "Không có",
    emergencyContact: "Lý Văn Minh - 0913456789 (Anh trai)",
    notes: "Bệnh nhân cần kiểm soát chế độ ăn và tái khám hàng tháng",
  },
  {
    id: 11,
    name: "Ngô Văn Tâm",
    age: 72,
    patientCount: "72 tuổi",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    disease: "Suy tim độ II, Tiểu đường type 2",
    patientId: "BHYT: BH852963741",
    status: "Cần theo dõi",
    statusColor: "#dc2626",
    statusTextColor: "#fff",
    lastVisit: "01/09/2025",
    lastVisitDate: new Date("2025-09-01"),
    phone: "0902345678",
    email: "ngovantam@email.com",
    address: "808 Đường BCD, Quận 9, TP.HCM",
    bloodType: "B",
    allergies: "Không có",
    emergencyContact: "Ngô Thị Lan - 0924567890 (Con gái)",
    notes: "Bệnh nhân cần dùng thuốc lợi tiểu và kiểm tra đường huyết",
  },
];

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
          <ScrollView style={styles.modalBody}>
            <TextInput
              style={styles.modalInput}
              value={formData.name}
              onChangeText={(text) => handleChange("name", text)}
              placeholder="Tên bệnh nhân"
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              style={styles.modalInput}
              value={String(formData.age)}
              onChangeText={(text) => handleChange("age", Number(text))}
              placeholder="Tuổi"
              keyboardType="numeric"
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              style={styles.modalInput}
              value={formData.disease}
              onChangeText={(text) => handleChange("disease", text)}
              placeholder="Bệnh lý"
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              style={styles.modalInput}
              value={formData.patientId}
              onChangeText={(text) => handleChange("patientId", text)}
              placeholder="Mã BHYT"
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              style={styles.modalInput}
              value={formData.phone}
              onChangeText={(text) => handleChange("phone", text)}
              placeholder="Số điện thoại"
              keyboardType="phone-pad"
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              style={styles.modalInput}
              value={formData.email}
              onChangeText={(text) => handleChange("email", text)}
              placeholder="Email"
              keyboardType="email-address"
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              style={styles.modalInput}
              value={formData.address}
              onChangeText={(text) => handleChange("address", text)}
              placeholder="Địa chỉ"
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              style={styles.modalInput}
              value={formData.bloodType}
              onChangeText={(text) => handleChange("bloodType", text)}
              placeholder="Nhóm máu"
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              style={styles.modalInput}
              value={formData.allergies}
              onChangeText={(text) => handleChange("allergies", text)}
              placeholder="Dị ứng"
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              style={styles.modalInput}
              value={formData.emergencyContact}
              onChangeText={(text) => handleChange("emergencyContact", text)}
              placeholder="Liên hệ khẩn cấp"
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              style={styles.modalInput}
              value={formData.notes}
              onChangeText={(text) => handleChange("notes", text)}
              placeholder="Ghi chú"
              multiline
              numberOfLines={4}
              placeholderTextColor="#9ca3af"
            />
            <Picker
              selectedValue={formData.status}
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
      "Cần theo dõi": { color: "#dc2626", textColor: "#fff" },
      "Đang điều trị": { color: "#f59e0b", textColor: "#1f2937" },
      "Ổn định": { color: "#16a34a", textColor: "#fff" },
    };

    const updated = {
      ...updatedPatient,
      patientCount: `${updatedPatient.age} tuổi`,
      statusColor: statusColors[updatedPatient.status].color,
      statusTextColor: statusColors[updatedPatient.status].textColor,
      lastVisitDate: new Date(updatedPatient.lastVisit),
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
                  onPress={() => setShowChatModal(true)}
                >
                  <MessageSquare color="#2563eb" size={20} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleStartCall(user, { uid: "cq6SC0A1RZXdLwFE1TKGRJG8fgl2" }, "doctor")}
                >
                  <Phone color="#f59e0b" size={20} />
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

      {/* Chat Modal */}
      <Modal visible={showChatModal} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.chatModalContent}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatHeaderTitle}>Chat với bệnh nhân</Text>
              <TouchableOpacity onPress={() => setShowChatModal(false)}>
                <X color="#fff" size={24} />
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
                  <Bot color="#6b7280" size={32} />
                  <Text style={styles.emptyChatText}>Chưa có tin nhắn</Text>
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
                placeholderTextColor="#9ca3af"
              />
              <TouchableOpacity
                style={[styles.sendButton, (!messageInput.trim() || isSending) && styles.disabledSendButton]}
                onPress={sendMessage}
                disabled={isSending || !messageInput.trim()}
              >
                {isSending ? <ActivityIndicator size="small" color="#fff" /> : <Send color="#fff" size={20} />}
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
    alignItems: "center",
    marginBottom: 12,
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
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  lastVisit: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionButton: {
    padding: 10,
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
  chatModalContent: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingTop: 16,
    marginTop: 80,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#2563eb",
    padding: 16,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  chatMessages: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  chatMessage: {
    marginBottom: 16,
    maxWidth: "80%",
    padding: 8,
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
    backgroundColor: "#2563eb",
    color: "#fff",
  },
  patientMessageText: {
    backgroundColor: "#e5e7eb",
    color: "#1f2937",
  },
  messageTime: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
    textAlign: "right",
  },
  chatInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  chatInput: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginRight: 12,
    color: "#1f2937",
  },
  sendButton: {
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 20,
  },
  disabledSendButton: {
    backgroundColor: "#6b7280",
  },
  emptyChat: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
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
  },
});