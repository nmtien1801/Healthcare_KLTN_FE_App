import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Image,
  StyleSheet,
  Alert,
  Dimensions
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSelector } from "react-redux";
import ApiBooking from "../../apis/ApiBooking";
import { db } from "../../../firebase";
import { collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";

const { width } = Dimensions.get('window');

// Custom Button Component
const CustomButton = ({ title, onPress, variant = "primary", size = "medium", disabled = false, loading = false, style, textStyle }) => {
  const buttonStyles = [
    styles.button,
    styles[`${variant}Button`],
    styles[`${size}Button`],
    disabled && styles.disabledButton,
    style
  ];

  const textStyles = [
    styles.buttonText,
    styles[`${variant}ButtonText`],
    disabled && styles.disabledButtonText,
    textStyle
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
          <Text style={textStyles}>{title}</Text>
        </View>
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

// Custom Modal Component
const CustomModal = ({ visible, onClose, title, children, type = "info" }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            {children}
          </View>
        </View>
      </View>
    </Modal>
  );
};

// UpcomingAppointment Component
const UpcomingAppointment = ({ refreshTrigger }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isCanceling, setIsCanceling] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const user = useSelector((state) => state.auth.userInfo);

  const fetchAppointments = useCallback(async (page = 1) => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      const response = await ApiBooking.getAppointmentsByPatient(user.uid, page);
      const data = response?.data || response || [];
      
      if (Array.isArray(data)) {
        setAppointments(data);
        setTotalPages(response?.totalPages || 1);
      } else if (data.appointments && Array.isArray(data.appointments)) {
        setAppointments(data.appointments);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setErrorMessage("Không thể tải danh sách lịch hẹn. Vui lòng thử lại.");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchAppointments(currentPage);
  }, [fetchAppointments, currentPage, refreshTrigger]);

  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;
    
    setIsCanceling(true);
    try {
      await ApiBooking.cancelAppointment(selectedAppointment._id);
      setShowCancelModal(false);
      setSelectedAppointment(null);
      fetchAppointments(currentPage);
    } catch (error) {
      console.error("Error canceling appointment:", error);
      setErrorMessage("Không thể hủy lịch hẹn. Vui lòng thử lại.");
      setShowErrorModal(true);
    } finally {
      setIsCanceling(false);
    }
  };

  const openCancelModal = (appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedAppointment || isSending) return;

    setIsSending(true);
    try {
      const messageData = {
        text: messageInput.trim(),
        sender: "patient",
        appointmentId: selectedAppointment._id,
        timestamp: serverTimestamp(),
        patientId: user.uid,
        doctorId: selectedAppointment.doctorId._id || selectedAppointment.doctorId
      };

      await addDoc(collection(db, "chatMessages"), messageData);
      setMessageInput("");
    } catch (error) {
      console.error("Error sending message:", error);
      setErrorMessage("Không thể gửi tin nhắn. Vui lòng thử lại.");
      setShowErrorModal(true);
    } finally {
      setIsSending(false);
    }
  };

  const openChatModal = (appointment) => {
    setSelectedAppointment(appointment);
    setShowChatbot(true);
    
    // Listen to chat messages
    const q = query(
      collection(db, "chatMessages"),
      where("appointmentId", "==", appointment._id),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
      setChatMessages(messages);
    });

    return () => unsubscribe();
  };

  const renderAppointmentCard = (appointment) => (
    <View key={appointment._id} style={styles.appointmentCard}>
      <View style={styles.cardHeader}>
        <Image
          source={{ uri: appointment.doctorId?.image || "https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face" }}
          style={styles.doctorImage}
        />
        <View style={styles.doctorInfo}>
          <Text style={styles.doctorName}>{appointment.doctorId?.name || "Bác sĩ"}</Text>
          <Text style={styles.doctorSpecialty}>{appointment.doctorId?.specialty || "Chuyên khoa"}</Text>
        </View>
        <View style={[styles.statusBadge, styles[`${appointment.status}Status`]]}>
          <Text style={styles.statusText}>
            {appointment.status === "pending" ? "Chờ xác nhận" :
             appointment.status === "confirmed" ? "Đã xác nhận" :
             appointment.status === "completed" ? "Hoàn thành" : "Đã hủy"}
          </Text>
        </View>
      </View>
      
      <View style={styles.appointmentDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color="#666" />
          <Text style={styles.detailText}>
            {new Date(appointment.date).toLocaleDateString("vi-VN")}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time" size={16} color="#666" />
          <Text style={styles.detailText}>{appointment.time}</Text>
        </View>
        {appointment.reason && (
          <View style={styles.detailRow}>
            <Ionicons name="document-text" size={16} color="#666" />
            <Text style={styles.detailText}>{appointment.reason}</Text>
          </View>
        )}
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => openChatModal(appointment)}
        >
          <Ionicons name="chatbubble" size={16} color="#007bff" />
          <Text style={styles.chatButtonText}>Chat</Text>
        </TouchableOpacity>
        
        {appointment.status === "pending" && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => openCancelModal(appointment)}
          >
            <Ionicons name="close-circle" size={16} color="#dc3545" />
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <View style={styles.pagination}>
        <TouchableOpacity
          style={[styles.pageButton, currentPage === 1 && styles.disabledPageButton]}
          onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
        >
          <Ionicons name="chevron-back" size={16} color={currentPage === 1 ? "#ccc" : "#007bff"} />
        </TouchableOpacity>
        
        <Text style={styles.pageInfo}>{currentPage} / {totalPages}</Text>
        
        <TouchableOpacity
          style={[styles.pageButton, currentPage === totalPages && styles.disabledPageButton]}
          onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
        >
          <Ionicons name="chevron-forward" size={16} color={currentPage === totalPages ? "#ccc" : "#007bff"} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.cardHeaderSection}>
          <Text style={styles.cardTitle}>📅 Lịch hẹn sắp tới</Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => fetchAppointments(currentPage)}
          >
            <Ionicons name="refresh" size={20} color="#007bff" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        ) : appointments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Chưa có lịch hẹn nào</Text>
            <Text style={styles.emptySubtext}>Đặt lịch khám mới để bắt đầu</Text>
          </View>
        ) : (
          <ScrollView style={styles.appointmentsList}>
            {appointments.map(renderAppointmentCard)}
          </ScrollView>
        )}

        {renderPagination()}

        {/* Chat Modal */}
        <Modal
          visible={showChatbot}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowChatbot(false)}
        >
          <View style={styles.chatModalOverlay}>
            <View style={styles.chatModal}>
              <View style={styles.chatHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="chatbubble" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.chatHeaderText}>Chat với bác sĩ</Text>
                </View>
                <TouchableOpacity onPress={() => setShowChatbot(false)}>
                  <Ionicons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.chatMessages}>
                {chatMessages.length === 0 ? (
                  <View style={styles.emptyChatContainer}>
                    <Ionicons name="chatbubble-outline" size={24} color="#666" style={{ marginBottom: 8 }} />
                    <Text style={styles.emptyChatText}>Chưa có tin nhắn nào</Text>
                    <Text style={styles.emptyChatSubtext}>Bắt đầu cuộc trò chuyện với bác sĩ</Text>
                  </View>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <View key={msg.id} style={styles.messageContainer}>
                      <View style={[
                        styles.messageBubble,
                        msg.sender === "patient" ? styles.patientMessage : styles.doctorMessage
                      ]}>
                        <Text style={[
                          styles.messageText,
                          msg.sender === "patient" ? styles.patientMessageText : styles.doctorMessageText
                        ]}>
                          {msg.text}
                        </Text>
                      </View>
                      <Text style={[
                        styles.messageTime,
                        { textAlign: msg.sender === "patient" ? 'right' : 'left' }
                      ]}>
                        {msg.timestamp && msg.timestamp instanceof Date ?
                          msg.timestamp.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) :
                          (msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '')
                        }
                      </Text>
                    </View>
                  ))
                )}
              </ScrollView>

              <View style={styles.chatInputContainer}>
                <TextInput
                  style={styles.chatInput}
                  placeholder="Nhập tin nhắn..."
                  value={messageInput}
                  onChangeText={setMessageInput}
                  onSubmitEditing={() => !isSending && sendMessage()}
                  editable={!isSending}
                  multiline
                />
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={sendMessage}
                  disabled={isSending || !messageInput.trim()}
                >
                  {isSending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Ionicons name="send" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Cancel Confirmation Modal */}
        <CustomModal
          visible={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          title="Xác nhận hủy lịch hẹn"
        >
          <Text style={styles.modalText}>Bạn có chắc chắn muốn hủy lịch hẹn này không?</Text>
          <View style={styles.modalActions}>
            <CustomButton
              title="Không"
              variant="secondary"
              onPress={() => setShowCancelModal(false)}
              disabled={isCanceling}
              style={{ flex: 1, marginRight: 8 }}
            />
            <CustomButton
              title="Có, hủy lịch hẹn"
              variant="danger"
              onPress={handleCancelAppointment}
              loading={isCanceling}
              style={{ flex: 1, marginLeft: 8 }}
            />
          </View>
        </CustomModal>

        {/* Error Modal */}
        <CustomModal
          visible={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          title="Lỗi"
        >
          <Text style={styles.modalText}>{errorMessage}</Text>
          <CustomButton
            title="Đóng"
            variant="primary"
            onPress={() => setShowErrorModal(false)}
          />
        </CustomModal>
      </View>
    </View>
  );
};

// BookingNew Component
const BookingNew = ({ handleSubmit }) => {
  const [appointmentType, setAppointmentType] = useState("onsite");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [selectedTime, setSelectedTime] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const user = useSelector((state) => state.auth.userInfo);

  useEffect(() => {
    if (!selectedDate) return;

    const fetchDoctors = async () => {
      setLoadingDoctors(true);
      try {
        const response = await ApiBooking.getDoctorsByDate(selectedDate);
        const data = Array.isArray(response) ? response : response?.data || [];
        setDoctors(data);
      } catch (err) {
        console.error("Error fetching doctors:", err);
        setDoctors([]);
        setErrorMessage("Không thể tải danh sách bác sĩ. Vui lòng thử lại sau.");
        setShowErrorModal(true);
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchDoctors();
  }, [selectedDate]);

  const onSubmit = useCallback(async () => {
    if (!user?.uid) {
      setErrorMessage("Vui lòng đăng nhập để đặt lịch.");
      setShowErrorModal(true);
      return;
    }
    
    if (!selectedDoctor || !selectedDate || !selectedTime || !reason.trim()) {
      setErrorMessage("Vui lòng điền đầy đủ thông tin bắt buộc.");
      setShowErrorModal(true);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    if (selected < today) {
      setErrorMessage("Không thể chọn ngày trong quá khứ.");
      setShowErrorModal(true);
      return;
    }

    setLoadingSubmit(true);
    try {
      const selectedDoctorData = doctors.find(d => (d.id || d._id || d.doctorId) === selectedDoctor);
      
      const payload = {
        firebaseUid: user.uid,
        doctorId: selectedDoctor,
        date: selectedDate,
        time: selectedTime,
        type: appointmentType,
        reason: reason.trim(),
        notes: notes.trim(),
        createdAt: new Date().toISOString()
      };

      const response = await ApiBooking.bookAppointment(payload);

      const newAppointment = {
        _id: response._id || response.id || Date.now().toString(),
        doctorId: {
          _id: selectedDoctor,
          name: selectedDoctorData.name,
          specialty: selectedDoctorData.specialty || "Chuyên khoa Nội tiết",
          image: selectedDoctorData.avatar || "https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face"
        },
        date: selectedDate,
        time: selectedTime,
        status: response.status || "pending"
      };

      const successMsg = `Đặt lịch khám thành công với bác sĩ ${selectedDoctorData.name} vào ${selectedTime} ngày ${new Date(selectedDate).toLocaleDateString("vi-VN")}!`;
      setSuccessMessage(successMsg);
      setShowSuccessModal(true);

      // Reset form
      setSelectedDoctor(null);
      setSelectedTime("");
      setReason("");
      setNotes("");
      setAppointmentType("onsite");

      handleSubmit(newAppointment);

    } catch (err) {
      console.error("Error booking appointment:", err);
      const errorMsg = err.response?.data?.message || err.message || "Không thể đặt lịch. Vui lòng kiểm tra kết nối và thử lại.";
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
    } finally {
      setLoadingSubmit(false);
    }
  }, [user, selectedDoctor, selectedDate, selectedTime, reason, notes, appointmentType, doctors, handleSubmit]);

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      setSelectedDate(`${year}-${month}-${day}`);
    }
  };

  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00"
  ];

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.cardHeaderSection}>
          <Text style={styles.cardTitle}>🩺 Đặt lịch khám mới</Text>
          <Text style={styles.cardSubtitle}>Vui lòng điền đầy đủ thông tin để đặt lịch</Text>
        </View>

        <ScrollView style={styles.formContainer}>
          {/* Appointment Type */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Loại hình khám</Text>
            <View style={styles.appointmentTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.appointmentTypeButton,
                  appointmentType === "onsite" && styles.appointmentTypeButtonActive
                ]}
                onPress={() => setAppointmentType("onsite")}
              >
                <Ionicons 
                  name="business" 
                  size={20} 
                  color={appointmentType === "onsite" ? "#fff" : "#007bff"} 
                />
                <Text style={[
                  styles.appointmentTypeText,
                  appointmentType === "onsite" && styles.appointmentTypeTextActive
                ]}>
                  Tại phòng khám
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.appointmentTypeButton,
                  appointmentType === "online" && styles.appointmentTypeButtonActive
                ]}
                onPress={() => setAppointmentType("online")}
              >
                <Ionicons 
                  name="videocam" 
                  size={20} 
                  color={appointmentType === "online" ? "#fff" : "#007bff"} 
                />
                <Text style={[
                  styles.appointmentTypeText,
                  appointmentType === "online" && styles.appointmentTypeTextActive
                ]}>
                  Trực tuyến
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Date Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Chọn ngày khám *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar" size={20} color="#007bff" />
              <Text style={styles.dateButtonText}>
                {new Date(selectedDate).toLocaleDateString("vi-VN")}
              </Text>
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={new Date(selectedDate)}
                mode="date"
                display="default"
                onChange={onDateChange}
                minimumDate={new Date()}
              />
            )}
          </View>

          {/* Doctor Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Chọn bác sĩ *</Text>
            {loadingDoctors ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007bff" />
                <Text style={styles.loadingText}>Đang tải danh sách bác sĩ...</Text>
              </View>
            ) : doctors.length === 0 ? (
              <Text style={styles.noDoctorsText}>Không có bác sĩ nào trong ngày này</Text>
            ) : (
              <ScrollView style={styles.doctorsList}>
                {doctors.map((doctor) => (
                  <TouchableOpacity
                    key={doctor.id || doctor._id}
                    style={[
                      styles.doctorCard,
                      selectedDoctor === (doctor.id || doctor._id) && styles.doctorCardSelected
                    ]}
                    onPress={() => setSelectedDoctor(doctor.id || doctor._id)}
                  >
                    <Image
                      source={{ uri: doctor.avatar || "https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face" }}
                      style={styles.doctorCardImage}
                    />
                    <View style={styles.doctorCardInfo}>
                      <Text style={styles.doctorCardName}>{doctor.name}</Text>
                      <Text style={styles.doctorCardSpecialty}>{doctor.specialty || "Chuyên khoa"}</Text>
                      <Text style={styles.doctorCardTime}>
                        {doctor.shift?.start || "08:00"} - {doctor.shift?.end || "17:00"}
                      </Text>
                    </View>
                    {selectedDoctor === (doctor.id || doctor._id) && (
                      <Ionicons name="checkmark-circle" size={24} color="#28a745" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Time Selection */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Chọn giờ khám *</Text>
            <View style={styles.timeSlotContainer}>
              {timeSlots.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeSlot,
                    selectedTime === time && styles.timeSlotSelected
                  ]}
                  onPress={() => setSelectedTime(time)}
                >
                  <Text style={[
                    styles.timeSlotText,
                    selectedTime === time && styles.timeSlotTextSelected
                  ]}>
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Reason */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Lý do khám *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Nhập lý do khám bệnh..."
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Notes */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Ghi chú thêm</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Thông tin bổ sung (không bắt buộc)..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* Submit Button */}
          <CustomButton
            title="Đặt lịch khám"
            variant="primary"
            size="large"
            onPress={onSubmit}
            loading={loadingSubmit}
            style={styles.submitButton}
          />
        </ScrollView>

        {/* Success Modal */}
        <CustomModal
          visible={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title="Đặt lịch thành công"
        >
          <Text style={styles.modalText}>{successMessage}</Text>
          <CustomButton
            title="Đóng"
            variant="primary"
            onPress={() => setShowSuccessModal(false)}
          />
        </CustomModal>

        {/* Error Modal */}
        <CustomModal
          visible={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          title="Lỗi"
        >
          <Text style={styles.modalText}>{errorMessage}</Text>
          <CustomButton
            title="Đóng"
            variant="primary"
            onPress={() => setShowErrorModal(false)}
          />
        </CustomModal>
      </View>
    </View>
  );
};

// Main BookingTabs Component
const BookingTabs = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleNewAppointment = (newAppointment) => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.leftColumn}>
        <UpcomingAppointment refreshTrigger={refreshTrigger} />
      </View>
      <View style={styles.rightColumn}>
        <BookingNew handleSubmit={handleNewAppointment} />
      </View>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  leftColumn: {
    flex: 1,
    marginRight: 8,
  },
  rightColumn: {
    flex: 2,
    marginLeft: 8,
  },
  container: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeaderSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  refreshButton: {
    padding: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 8,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  appointmentsList: {
    maxHeight: 400,
  },
  appointmentCard: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  doctorImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  doctorSpecialty: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  pendingStatus: {
    backgroundColor: '#fff3cd',
  },
  confirmedStatus: {
    backgroundColor: '#d1ecf1',
  },
  completedStatus: {
    backgroundColor: '#d4edda',
  },
  canceledStatus: {
    backgroundColor: '#f8d7da',
  },
  appointmentDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007bff',
  },
  chatButtonText: {
    marginLeft: 4,
    color: '#007bff',
    fontSize: 14,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  cancelButtonText: {
    marginLeft: 4,
    color: '#dc3545',
    fontSize: 14,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  pageButton: {
    padding: 8,
    marginHorizontal: 8,
  },
  disabledPageButton: {
    opacity: 0.5,
  },
  pageInfo: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 16,
  },
  // Chat Modal Styles
  chatModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatModal: {
    width: width * 0.9,
    height: '70%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  chatHeader: {
    backgroundColor: '#007bff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  chatHeaderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chatMessages: {
    flex: 1,
    padding: 16,
  },
  emptyChatContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  emptyChatText: {
    color: '#666',
    fontSize: 16,
  },
  emptyChatSubtext: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
  messageContainer: {
    marginBottom: 12,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  patientMessage: {
    backgroundColor: '#007bff',
    alignSelf: 'flex-end',
  },
  doctorMessage: {
    backgroundColor: '#f1f1f1',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 14,
  },
  patientMessageText: {
    color: '#fff',
  },
  doctorMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
  },
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 80,
  },
  sendButton: {
    backgroundColor: '#007bff',
    borderRadius: 20,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Button Styles
  button: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#007bff',
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
  },
  dangerButton: {
    backgroundColor: '#dc3545',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  primaryButtonText: {
    color: '#fff',
  },
  secondaryButtonText: {
    color: '#fff',
  },
  disabledButtonText: {
    color: '#999',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 16,
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  // Form Styles for BookingNew
  formContainer: {
    maxHeight: 500,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  appointmentTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  appointmentTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#007bff',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  appointmentTypeButtonActive: {
    backgroundColor: '#007bff',
  },
  appointmentTypeText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#007bff',
  },
  appointmentTypeTextActive: {
    color: '#fff',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  dateButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  noDoctorsText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    padding: 20,
  },
  doctorsList: {
    maxHeight: 200,
  },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  doctorCardSelected: {
    borderColor: '#28a745',
    backgroundColor: '#f8fff9',
  },
  doctorCardImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  doctorCardInfo: {
    flex: 1,
  },
  doctorCardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  doctorCardSpecialty: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  doctorCardTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  timeSlotContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  timeSlot: {
    width: '30%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  timeSlotSelected: {
    borderColor: '#007bff',
    backgroundColor: '#e7f3ff',
  },
  timeSlotText: {
    fontSize: 14,
    color: '#333',
  },
  timeSlotTextSelected: {
    color: '#007bff',
    fontWeight: 'bold',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 20,
    marginBottom: 20,
  },
  largeButton: {
    paddingVertical: 16,
  },
});

export default BookingTabs;
