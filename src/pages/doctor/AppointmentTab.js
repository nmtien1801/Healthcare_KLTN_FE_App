import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  Dimensions,
} from "react-native";
import { Search as SearchIcon, Clock, CalendarDays, Plus, Trash2, Edit, Eye } from "lucide-react-native";
import AddAppointmentModal from "../../components/doctor/appointment/AddAppointmentModal";
import ViewAppointmentModal from "../../components/doctor/appointment/ViewAppointmentModal";
import EditAppointmentModal from "../../components/doctor/appointment/EditAppointmentModal";
import ApiDoctor from "../../apis/ApiDoctor";
import { getLabelFromOptions } from "../../utils/appointmentHelper";
import { STATUS_COLORS, STATUS_OPTIONS, TYPE_OPTIONS } from "../../utils/appointmentConstants";
import { listenStatus } from "../../utils/SetupSignFireBase";

const { width, height } = Dimensions.get("window");
const itemsPerPage = 5;

// Hàm formatDate để chuyển đổi ngày từ YYYY-MM-DD sang DD/MM/YYYY
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  // Kiểm tra nếu dateStr đã ở định dạng DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    return dateStr;
  }
  // Chuyển đổi từ YYYY-MM-DD sang DD/MM/YYYY
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
};

export default function AppointmentTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState(null);
  const [dateInput, setDateInput] = useState("");
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [todayPage, setTodayPage] = useState(1);
  const [upcomingPage, setUpcomingPage] = useState(1);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);

  const fetchAppointments = async () => {
    try {
      const resToday = await ApiDoctor.getAppointmentsToday();
      setTodayAppointments(resToday.map(mapAppointment));
      const resUpcoming = await ApiDoctor.getAppointments();
      setUpcomingAppointments(resUpcoming.map(mapAppointment));
    } catch (err) {
      console.error("Lỗi lấy appointments:", err);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Lắng nghe tín hiệu hủy lịch qua Firestore (status message) trong chats
  let doctorUid = "1HwseYsBwxby5YnsLUWYzvRtCw53";
  let patientUid = "cq6SC0A1RZXdLwFE1TKGRJG8fgl2";
  useEffect(() => {
    const roomChats = [doctorUid, patientUid].sort().join("_");

    const unsub = listenStatus(roomChats, doctorUid, (signal) => {
      if (signal?.status === "Hủy lịch") {
        fetchAppointments();
      }
      else if (signal?.status === "Đặt lịch") {
        fetchAppointments();
      }
    });

    return () => unsub();
  }, [doctorUid, patientUid]);

  const mapAppointment = (item) => {
    return {
      id: item._id,
      patientName: item.patientId?.userId?.username || "N/A",
      patientEmail: item.patientId?.userId?.email || "N/A",
      patientAge: item.patientId?.age || "N/A",
      patientDisease: item.patientId?.disease || "N/A",
      patientAvatar:
        item.patientId?.userId?.avatar ||
        "https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face",
      date: formatDate(new Date(item.date).toISOString().split("T")[0]), // Sử dụng formatDate
      time: item.time,
      type: item.type,
      reason: item.reason || "Tạm thời chưa có",
      doctor: item.doctorId?.userId?.username || "Tạm thời chưa có",
      notes: item.notes || "Tạm thời chưa có",
      status: item.status,
    };
  };

  const handleDateChange = (text) => {
    setDateInput(text);
    if (!text) {
      setFilterDate(null);
      return;
    }
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!regex.test(text)) {
      Alert.alert("Lỗi", "Vui lòng nhập ngày theo định dạng DD/MM/YYYY.");
      return;
    }
    const [day, month, year] = text.split("/").map(Number);
    const date = new Date(year, month - 1, day);
    if (
      date.getDate() === day &&
      date.getMonth() === month - 1 &&
      date.getFullYear() === year
    ) {
      setFilterDate(date);
    } else {
      Alert.alert("Lỗi", "Ngày không hợp lệ. Vui lòng kiểm tra lại.");
      setFilterDate(null);
    }
  };

  const filteredToday = useMemo(() => {
    return todayAppointments.filter((a) => {
      const matchSearch =
        a.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.patientDisease.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.reason.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDate = filterDate ? a.date === formatDate(new Date(filterDate).toISOString().split("T")[0]) : true;
      return matchSearch && matchDate;
    });
  }, [todayAppointments, searchTerm, filterDate]);

  const filteredUpcoming = useMemo(() => {
    return upcomingAppointments.filter((a) => {
      const matchSearch =
        a.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.patientDisease.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.reason.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDate = filterDate ? a.date === formatDate(new Date(filterDate).toISOString().split("T")[0]) : true;
      return matchSearch && matchDate;
    });
  }, [upcomingAppointments, searchTerm, filterDate]);

  const handleAddAppointment = (newAppointmentData) => {
    const newAppointment = {
      id: Date.now(),
      patientAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        newAppointmentData.patientName
      )}&size=150&background=random`,
      ...newAppointmentData,
      date: formatDate(newAppointmentData.date), // Đảm bảo định dạng ngày
    };
    setUpcomingAppointments((prev) => [...prev, newAppointment]);
    setShowAddModal(false);
  };

  const handleViewAppointment = async (appointment) => {
    try {
      const data = await ApiDoctor.getAppointmentById(appointment.id);
      const mapped = mapAppointment(data);
      setSelectedAppointment(mapped);
      setShowViewModal(true);
    } catch (err) {
      console.error("Lỗi khi lấy chi tiết lịch hẹn:", err);
      Alert.alert("Lỗi", "Không thể tải chi tiết lịch hẹn.");
    }
  };

  const handleEditAppointment = async (appointment) => {
    try {
      const data = await ApiDoctor.getAppointmentById(appointment.id);
      const mapped = mapAppointment(data);
      setSelectedAppointment(mapped);
      setShowViewModal(false);
      setShowEditModal(true);
    } catch (err) {
      console.error("Lỗi khi lấy chi tiết lịch hẹn để chỉnh sửa:", err);
      Alert.alert("Lỗi", "Không thể tải chi tiết lịch hẹn.");
    }
  };

  const handleUpdateAppointment = async (updatedAppointment) => {
    try {
      const payload = {
        ...updatedAppointment,
        date: new Date(updatedAppointment.date).toISOString().split("T")[0], // Lưu trữ dưới dạng YYYY-MM-DD
      };
      await ApiDoctor.updateAppointment(updatedAppointment.id, payload);
      const updatedMapped = {
        ...updatedAppointment,
        date: formatDate(updatedAppointment.date), // Chuyển đổi sang DD/MM/YYYY khi lưu vào state
      };
      setUpcomingAppointments((prev) =>
        prev.map((app) => (app.id === updatedAppointment.id ? updatedMapped : app))
      );
      setTodayAppointments((prev) =>
        prev.map((app) => (app.id === updatedAppointment.id ? updatedMapped : app))
      );
      setShowEditModal(false);
      setSelectedAppointment(updatedMapped);
    } catch (error) {
      console.error("Lỗi khi cập nhật lịch hẹn:", error);
      Alert.alert("Lỗi", "Cập nhật lịch hẹn thất bại. Vui lòng thử lại.");
    }
  };

  const handleDeleteAppointment = (appointment) => {
    setAppointmentToDelete(appointment);
    setShowDeleteModal(true);
  };

  const confirmDeleteAppointment = async () => {
    try {
      if (!appointmentToDelete) return;
      await ApiDoctor.deleteAppointment(appointmentToDelete.id);
      setUpcomingAppointments((prev) =>
        prev.filter((app) => app.id !== appointmentToDelete.id)
      );
      setTodayAppointments((prev) =>
        prev.filter((app) => app.id !== appointmentToDelete.id)
      );
      setShowDeleteModal(false);
      setAppointmentToDelete(null);
    } catch (error) {
      console.error("Lỗi khi xóa lịch hẹn:", error);
      Alert.alert("Lỗi", "Xóa lịch hẹn thất bại. Vui lòng thử lại.");
    }
  };

  const paginate = (appointments, page) =>
    appointments.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const totalTodayPages = Math.ceil(filteredToday.length / itemsPerPage);
  const totalUpcomingPages = Math.ceil(filteredUpcoming.length / itemsPerPage);

  const paginatedToday = paginate(filteredToday, todayPage);
  const paginatedUpcoming = paginate(filteredUpcoming, upcomingPage);

  const renderAppointmentCard = (appointment) => {
    return (
      <View style={styles.cardItem}>
        <View style={styles.cardHeader}>
          <Image source={{ uri: appointment.patientAvatar }} style={styles.avatar} />
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>
              {appointment.patientName}
            </Text>
            <Text style={styles.patientAge}>{appointment.patientAge} tuổi</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[appointment.status]?.bg }]}>
            <Text style={[styles.statusText, { color: STATUS_COLORS[appointment.status]?.text }]} numberOfLines={1}>
              {getLabelFromOptions(STATUS_OPTIONS, appointment.status)}
            </Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardText}>
            <Text style={styles.cardLabel}>Bệnh: </Text>
            {appointment.patientDisease}
          </Text>
          <View style={styles.timeRow}>
            <Clock size={16} color="#666" />
            <Text style={styles.cardText}>{appointment.time}</Text>
            <CalendarDays size={16} color="#666" style={styles.dateIcon} />
            <Text style={styles.cardText}>{appointment.date}</Text>
          </View>
          <Text style={styles.cardText}>
            <Text style={styles.cardLabel}>Loại: </Text>
            {getLabelFromOptions(TYPE_OPTIONS, appointment.type)}
          </Text>
          <Text style={styles.cardText}>
            <Text style={styles.cardLabel}>Lý do: </Text>
            {appointment.reason}
          </Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={() => handleViewAppointment(appointment)}
            style={styles.actionButton}
          >
            <Eye size={16} color="#007bff" />
            <Text style={styles.actionText}>Xem</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleEditAppointment(appointment)}
            style={styles.actionButton}
          >
            <Edit size={16} color="#28a745" />
            <Text style={styles.actionText}>Sửa</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteAppointment(appointment)}
            style={styles.actionButton}
          >
            <Trash2 size={16} color="#dc3545" />
            <Text style={styles.actionText}>Xóa</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderPagination = (currentPage, totalPages, setPage) => {
    if (totalPages <= 1) return null;
    return (
      <View style={styles.pagination}>
        <TouchableOpacity
          onPress={() => setPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          style={[styles.pagButton, currentPage === 1 && styles.disabled]}
        >
          <Text style={styles.pagText}>Trước</Text>
        </TouchableOpacity>
        <Text style={styles.pageInfo}>
          Trang {currentPage} / {totalPages}
        </Text>
        <TouchableOpacity
          onPress={() => setPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
          style={[styles.pagButton, currentPage === totalPages && styles.disabled]}
        >
          <Text style={styles.pagText}>Sau</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderTable = (title, paginated, totalPages, page, setPage, isToday = false) => (
    <View style={styles.card}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" , marginTop: 5}}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Plus size={16} color="#fff" />
        </TouchableOpacity>
      </View>

      {isToday && (
        <View style={styles.filterRow}>
          <View style={styles.searchContainer}>
            <SearchIcon size={16} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm bệnh nhân, bệnh, bác sĩ..."
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
          <View style={styles.dateInputContainer}>
            <CalendarDays size={16} color="#007bff" style={styles.dateIcon} />
            <TextInput
              style={styles.dateInput}
              placeholder="DD/MM/YYYY"
              value={dateInput}
              onChangeText={handleDateChange}
              keyboardType="numeric"
            />
          </View>

        </View>
      )}
      {isToday && (
        <Text style={styles.appointmentCount}>Tổng {filteredToday.length} cuộc hẹn</Text>
      )}
      <FlatList
        data={paginated}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => renderAppointmentCard(item)}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không có lịch hẹn.</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
      {renderPagination(page, totalPages, setPage)}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={[{ key: 'content' }]}
        keyExtractor={(item) => item.key}
        showsVerticalScrollIndicator={false}
        renderItem={() => (
          <View style={{ paddingVertical: 20 }}>
            {renderTable("Lịch Hẹn Hôm Nay", paginatedToday, totalTodayPages, todayPage, setTodayPage, true)}
            {renderTable("Lịch Hẹn Sắp Tới", paginatedUpcoming, totalUpcomingPages, upcomingPage, setUpcomingPage)}
          </View>
        )}
      />
      <AddAppointmentModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddAppointment}
      />
      <ViewAppointmentModal
        visible={showViewModal}
        onClose={() => setShowViewModal(false)}
        appointment={selectedAppointment}
        onEdit={handleEditAppointment}
      />
      <EditAppointmentModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        appointment={selectedAppointment}
        onSave={handleUpdateAppointment}
      />
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Xác Nhận Xóa Lịch Hẹn</Text>
            <Text style={styles.modalBody}>
              Bạn có chắc chắn muốn xóa lịch hẹn của{"\n"}
              <Text style={styles.modalBold}>{appointmentToDelete?.patientName}</Text>{"\n"}
              vào ngày <Text style={styles.modalBold}>{appointmentToDelete?.date}</Text>{"\n"}
              lúc <Text style={styles.modalBold}>{appointmentToDelete?.time}</Text> không?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={confirmDeleteAppointment}
              >
                <Text style={styles.deleteButtonText}>Xóa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 60,
    backgroundColor: "#f5f7fa",
    paddingHorizontal: width * 0.05,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: width * 0.05,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: width * 0.05,
    fontWeight: "600",
    color: "#1a3c6e",
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 12,
    flexWrap: "nowrap",
    gap: 8,
    overflowX: "scroll",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f2f5",
    borderRadius: 12,
    paddingHorizontal: 12,
    width: width * 0.45,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: width * 0.04,
    color: "#333",
  },
  dateInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f2f5",
    borderRadius: 12,
    paddingHorizontal: 12,
    width: width * 0.32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dateInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: width * 0.04,
    color: "#333",
    marginLeft: 4,
  },
  dateIcon: {
    marginRight: 4,
  },
  addButton: {
    backgroundColor: "#007bff",
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    width: width * 0.12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  appointmentCount: {
    fontSize: width * 0.04,
    color: "#007bff",
    marginBottom: 12,
    fontWeight: "500",
  },
  list: {
    // maxHeight removed - không cần nữa với pagination
  },
  cardItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: width * 0.04,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  avatar: {
    width: width * 0.12,
    height: width * 0.12,
    borderRadius: width * 0.06,
    marginRight: 12,
  },
  patientInfo: {
    flex: 1,
    justifyContent: "center",
  },
  patientName: {
    fontSize: width * 0.045,
    fontWeight: "600",
    color: "#1a3c6e",
  },
  patientAge: {
    fontSize: width * 0.035,
    color: "#666",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    fontSize: width * 0.035,
    fontWeight: "600",
  },
  cardBody: {
    marginBottom: 8,
  },
  cardText: {
    fontSize: width * 0.04,
    color: "#333",
    marginBottom: 6,
  },
  cardLabel: {
    fontWeight: "600",
    color: "#1a3c6e",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f0f2f5",
  },
  actionText: {
    fontSize: width * 0.035,
    color: "#333",
    marginLeft: 4,
    fontWeight: "500",
  },
  emptyContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: width * 0.04,
    color: "#999",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 12,
  },
  pagButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pageInfo: {
    fontSize: width * 0.04,
    color: "#333",
    fontWeight: "500",
  },
  pagText: {
    fontSize: width * 0.04,
    color: "#007bff",
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: width * 0.06,
    width: width * 0.85,
    maxWidth: 340,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: width * 0.05,
    fontWeight: "700",
    color: "#1a3c6e",
    textAlign: "center",
    marginBottom: 12,
  },
  modalBody: {
    fontSize: width * 0.04,
    lineHeight: width * 0.06,
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  modalBold: {
    fontWeight: "600",
    color: "#1a3c6e",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#6c757d",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: width * 0.04,
    color: "#fff",
    fontWeight: "600",
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#dc3545",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  deleteButtonText: {
    fontSize: width * 0.04,
    color: "#fff",
    fontWeight: "600",
  },
});