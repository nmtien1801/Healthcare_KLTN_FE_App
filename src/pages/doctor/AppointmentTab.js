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
  ScrollView,
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

const { width } = Dimensions.get("window");
const itemsPerPage = 5;

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

  useEffect(() => {
    const fetchAppointments = async () => {
      console.log("fetchAppointments chạy...");

      try {
        const resToday = await ApiDoctor.getAppointmentsToday();
        console.log("Raw Today:", resToday);
        setTodayAppointments(resToday.map(mapAppointment));

        console.log("Appointments Today:", resToday);
        const resUpcoming = await ApiDoctor.getAppointments();
        console.log("Upcoming Appointments:", resUpcoming);
        setUpcomingAppointments(resUpcoming.map(mapAppointment));
      } catch (err) {
        console.error("Lỗi lấy appointments:", err);
      }
    };
    fetchAppointments();
  }, []);

  const mapAppointment = (item) => {
    console.log("Mapping item:", item);
    return ({
      id: item._id,
      patientName: item.patientId?.userId?.username || "N/A",
      patientAge: item.patientId?.age || "N/A",
      patientDisease: item.patientId?.disease || "N/A",
      patientAvatar:
        item.patientId?.userId?.avatar ||
        "https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face",
      date: new Date(item.date).toLocaleDateString("vi-VN"),
      time: item.time,
      type: item.type,
      reason: item.reason || "Tạm thời chưa có",
      doctor: item.doctorId?.userId?.username || "Tạm thời chưa có",
      notes: item.notes || "Tạm thời chưa có",
      status: item.status,
    })
  };

  const getStatusColors = (status) => {
    switch (status) {
      case "Đã xác nhận":
        return { bg: "#28a745", text: "#fff" };
      case "Chờ xác nhận":
        return { bg: "#ffc107", text: "#000" };
      case "Đã hủy":
        return { bg: "#dc3545", text: "#fff" };
      case "Hoàn thành":
        return { bg: "#007bff", text: "#fff" };
      default:
        return { bg: "#6c757d", text: "#fff" };
    }
  };

  // Xử lý nhập ngày
  const handleDateChange = (text) => {
    setDateInput(text);

    if (!text) {
      setFilterDate(null);
      return;
    }

    // Kiểm tra định dạng DD/MM/YYYY
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!regex.test(text)) {
      Alert.alert("Lỗi", "Vui lòng nhập ngày theo định dạng DD/MM/YYYY.");
      return;
    }

    const [day, month, year] = text.split("/").map(Number);
    const date = new Date(year, month - 1, day);

    // Kiểm tra ngày hợp lệ
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

  // Filter + Search
  const filteredToday = useMemo(() => {
    return todayAppointments.filter((a) => {
      const matchSearch =
        a.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.patientDisease.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.reason.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDate = filterDate ? a.date === new Date(filterDate).toLocaleDateString("vi-VN") : true;

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

      const matchDate = filterDate ? a.date === new Date(filterDate).toLocaleDateString("vi-VN") : true;

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
        date: new Date(updatedAppointment.date).toISOString().split("T")[0],
      };

      await ApiDoctor.updateAppointment(updatedAppointment.id, payload);

      setUpcomingAppointments((prev) =>
        prev.map((app) => (app.id === updatedAppointment.id ? updatedAppointment : app))
      );
      setTodayAppointments((prev) =>
        prev.map((app) => (app.id === updatedAppointment.id ? updatedAppointment : app))
      );

      setShowEditModal(false);
      setSelectedAppointment(updatedAppointment);
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

  // Pagination
  const paginate = (appointments, page) =>
    appointments.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const totalTodayPages = Math.ceil(filteredToday.length / itemsPerPage);
  const totalUpcomingPages = Math.ceil(filteredUpcoming.length / itemsPerPage);

  const paginatedToday = paginate(filteredToday, todayPage);
  const paginatedUpcoming = paginate(filteredUpcoming, upcomingPage);

  const renderAppointmentRow = (appointment) => {
    const statusColors = getStatusColors(appointment.status);
    return (
      <View style={styles.row}>
        <View style={styles.patientCell}>
          <Image source={{ uri: appointment.patientAvatar }} style={styles.avatar} />
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{appointment.patientName}</Text>
            <Text style={styles.patientAge}>{appointment.patientAge} tuổi</Text>
          </View>
        </View>
        <Text style={styles.diseaseCell} numberOfLines={1}>{appointment.patientDisease}</Text>
        <View style={styles.timeCell}>
          <Clock size={12} color="#666" />
          <Text style={styles.timeText}>{appointment.time}</Text>
          <CalendarDays size={12} color="#666" style={styles.dateIcon} />
          <Text style={styles.dateText}>{appointment.date}</Text>
        </View>
        <Text style={styles.typeCell}>{getLabelFromOptions(TYPE_OPTIONS, appointment.type)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
          <Text style={[styles.statusText, { color: statusColors.text }]}>
            {getLabelFromOptions(STATUS_OPTIONS, appointment.status)}
          </Text>
        </View>
        <View style={styles.actionsCell}>
          <TouchableOpacity onPress={() => handleViewAppointment(appointment)} style={styles.actionButton}>
            <Eye size={16} color="#007bff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleEditAppointment(appointment)} style={styles.actionButton}>
            <Edit size={16} color="#28a745" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteAppointment(appointment)} style={styles.actionButton}>
            <Trash2 size={16} color="#dc3545" />
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
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <TouchableOpacity
            key={page}
            onPress={() => setPage(page)}
            style={[
              styles.pagButton,
              styles.pageItem,
              page === currentPage && styles.activePage,
            ]}
          >
            <Text style={[styles.pagText, page === currentPage && styles.activeText]}>
              {page}
            </Text>
          </TouchableOpacity>
        ))}
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
      <Text style={styles.sectionTitle}>{title}</Text>
      {isToday && (
        <View style={styles.filterRow}>
          <View style={styles.searchContainer}>
            <SearchIcon size={16} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm..."
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
          <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
            <Plus size={16} color="#fff" />
            <Text style={styles.addButtonText}>Thêm</Text>
          </TouchableOpacity>
        </View>
      )}
      {isToday && (
        <Text style={styles.appointmentCount}>Tổng {filteredToday.length} cuộc hẹn</Text>
      )}
      <FlatList
        data={paginated}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => renderAppointmentRow(item)}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Không có lịch hẹn.</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
      {renderPagination(page, totalPages, setPage)}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.header}>Lịch hẹn khám bệnh</Text>

      {renderTable("Lịch hẹn hôm nay", paginatedToday, totalTodayPages, todayPage, setTodayPage, true)}

      {renderTable("Lịch hẹn sắp tới", paginatedUpcoming, totalUpcomingPages, upcomingPage, setUpcomingPage)}

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

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Xác nhận xóa</Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
    color: "#333",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    flexWrap: "wrap",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    flex: 1,
    minWidth: 150,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 16,
  },
  dateInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
    minWidth: 120,
  },
  dateInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 16,
    marginLeft: 4,
  },
  dateIcon: {
    marginRight: 4,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007bff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: "#fff",
    marginLeft: 4,
    fontWeight: "600",
  },
  appointmentCount: {
    fontSize: 14,
    color: "#007bff",
    marginBottom: 12,
  },
  list: {
    maxHeight: 400,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  patientCell: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontWeight: "600",
    color: "#333",
  },
  patientAge: {
    fontSize: 12,
    color: "#666",
  },
  diseaseCell: {
    flex: 1.5,
    fontSize: 14,
    color: "#333",
  },
  timeCell: {
    flex: 1.5,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 2,
  },
  dateIcon: {
    marginLeft: 8,
  },
  dateText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 2,
  },
  typeCell: {
    flex: 1,
    fontSize: 14,
    color: "#333",
    textAlign: "center",
  },
  statusBadge: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: "center",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  actionsCell: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#999",
    fontSize: 16,
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    gap: 8,
  },
  pagButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 40,
    alignItems: "center",
  },
  pageItem: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  activePage: {
    backgroundColor: "#007bff",
    borderColor: "#007bff",
  },
  activeText: {
    color: "#fff",
  },
  pagText: {
    fontSize: 14,
    color: "#333",
  },
  disabled: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: width * 0.8,
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  modalBody: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 20,
    textAlign: "center",
  },
  modalBold: {
    fontWeight: "bold",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  cancelButton: {
    backgroundColor: "#6c757d",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    flex: 1,
    marginRight: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "#dc3545",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    flex: 1,
    marginLeft: 8,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});