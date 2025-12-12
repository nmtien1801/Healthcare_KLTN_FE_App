import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  Dimensions,
  Alert,
  Modal,
  ActivityIndicator,
  FlatList,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../../firebase";
import { useSelector } from "react-redux";
import ApiBooking from "../../apis/ApiBooking";
import DateTimePicker from "@react-native-community/datetimepicker";
import { sendStatus } from "../../utils/SetupSignFireBase";
import { listenStatusByReceiver } from "../../utils/SetupSignFireBase";
import {
  getBalanceService,
  withdrawService,
  depositService,
} from "../../apis/paymentService";
import { useNavigation } from "@react-navigation/native";
import ApiNotification from "../../apis/ApiNotification";
import { EXPO_PUBLIC_BOOKING_FEE} from '@env';

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f8f9fa",
    padding: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 8,
  },
  appointmentCard: {
    backgroundColor: "#f0f2ff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  doctorInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  doctorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  doctorSpecialty: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: "#28a745",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  warningButton: {
    backgroundColor: "#ffc107",
  },
  appointmentDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 13,
    color: "#333",
    marginLeft: 8,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#dc3545",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cancelButtonText: {
    color: "#dc3545",
    fontSize: 12,
    fontWeight: "500",
  },
  featureRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
  },
  featureItem: {
    alignItems: "center",
    flex: 1,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#333",
    textAlign: "center",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
  },
  paginationButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#007bff",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  paginationButtonText: {
    color: "#007bff",
    fontSize: 14,
    fontWeight: "500",
  },
  pageIndicator: {
    backgroundColor: "#007bff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 5,
  },
  pageIndicatorText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  chatModal: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 320,
    height: 450,
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chatHeader: {
    backgroundColor: "#007bff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  chatHeaderText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  chatMessages: {
    flex: 1,
    padding: 12,
  },
  messageContainer: {
    marginBottom: 12,
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    maxWidth: "80%",
  },
  patientMessage: {
    backgroundColor: "#007bff",
    alignSelf: "flex-end",
  },
  doctorMessage: {
    backgroundColor: "#f1f1f1",
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: 14,
  },
  patientMessageText: {
    color: "#fff",
  },
  doctorMessageText: {
    color: "#333",
  },
  messageTime: {
    fontSize: 11,
    color: "#666",
    marginTop: 4,
  },
  chatInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  chatInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: "#007bff",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  // Fixed modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  modalBody: {
    marginBottom: 20,
  },
  modalText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#007bff",
  },
  secondaryButton: {
    backgroundColor: "#6c757d",
  },
  dangerButton: {
    backgroundColor: "#dc3545",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  secondaryButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  // Booking form styles
  bookingContainer: {
    backgroundColor: "#f8f9fa",
    padding: 16,
  },
  bookingCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bookingHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  bookingTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  bookingSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  appointmentTypeRow: {
    flexDirection: "row",
    gap: 8,
  },
  appointmentTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  appointmentTypeButtonActive: {
    backgroundColor: "#007bff",
    borderColor: "#007bff",
  },
  appointmentTypeButtonInactive: {
    backgroundColor: "transparent",
    borderColor: "#007bff",
  },
  appointmentTypeTextActive: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  appointmentTypeTextInactive: {
    color: "#007bff",
    fontSize: 14,
    fontWeight: "500",
  },
  datePickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
  },
  datePickerText: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  timeSlotContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  timeSlot: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 100,
    alignItems: "center",
  },
  timeSlotActive: {
    backgroundColor: "#007bff",
    borderColor: "#007bff",
  },
  timeSlotInactive: {
    backgroundColor: "#f8f9fa",
    borderColor: "#e0e0e0",
  },
  timeSlotDisabled: {
    backgroundColor: "#f0f0f0",
    borderColor: "#e0e0e0",
    opacity: 0.5,
  },
  timeSlotTextActive: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  timeSlotTextInactive: {
    color: "#333",
    fontSize: 12,
    fontWeight: "500",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: "#fff",
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#007bff",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
});

const Button = ({
  children,
  variant = "primary",
  size = "md",
  onPress,
  disabled,
  style,
  ...props
}) => {
  const getButtonStyle = () => {
    const baseStyle = {
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
    };

    const variants = {
      primary: { backgroundColor: "#007bff", borderColor: "#007bff" },
      secondary: { backgroundColor: "#6c757d", borderColor: "#6c757d" },
      success: { backgroundColor: "#28a745", borderColor: "#28a745" },
      danger: { backgroundColor: "#dc3545", borderColor: "#dc3545" },
      warning: { backgroundColor: "#ffc107", borderColor: "#ffc107" },
      info: { backgroundColor: "#17a2b8", borderColor: "#17a2b8" },
      light: { backgroundColor: "#f8f9fa", borderColor: "#f8f9fa" },
      dark: { backgroundColor: "#343a40", borderColor: "#343a40" },
      outline: {
        backgroundColor: "transparent",
        borderColor: "#007bff",
        borderWidth: 1,
      },
      ghost: { backgroundColor: "transparent", borderColor: "transparent" },
    };

    const sizes = {
      sm: { paddingHorizontal: 8, paddingVertical: 4, minHeight: 32 },
      md: { paddingHorizontal: 12, paddingVertical: 8, minHeight: 40 },
      lg: { paddingHorizontal: 16, paddingVertical: 12, minHeight: 48 },
    };

    return {
      ...baseStyle,
      ...variants[variant],
      ...sizes[size],
      opacity: disabled ? 0.6 : 1,
      ...style,
    };
  };

  const getTextStyle = () => {
    const textColors = {
      primary: "#ffffff",
      secondary: "#ffffff",
      success: "#ffffff",
      danger: "#ffffff",
      warning: "#212529",
      info: "#ffffff",
      light: "#212529",
      dark: "#ffffff",
      outline: "#007bff",
      ghost: "#6c757d",
    };

    return {
      color: textColors[variant],
      fontWeight: "500",
      fontSize: size === "sm" ? 12 : size === "lg" ? 16 : 14,
    };
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled}
      {...props}
    >
      {typeof children === "string" ? (
        <Text style={getTextStyle()}>{children}</Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
};

// Modal Component
const CustomModal = ({ visible, onClose, title, children, type = "info" }) => {
  const getIcon = () => {
    const iconProps = { size: 48, style: { marginBottom: 12 } };
    switch (type) {
      case "success":
        return (
          <Ionicons name="checkmark-circle" color="#28a745" {...iconProps} />
        );
      case "danger":
        return <Ionicons name="trash" color="#dc3545" {...iconProps} />;
      case "warning":
        return <Ionicons name="time" color="#ffc107" {...iconProps} />;
      default:
        return <Ionicons name="calendar" color="#007bff" {...iconProps} />;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <View style={{ alignItems: "center", paddingVertical: 20 }}>
            {getIcon()}
            {children}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const UpcomingAppointment = ({
  handleStartCall,
  refreshTrigger,
  onNewAppointment,
}) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCanceling, setIsCanceling] = useState(false); // Fixed variable name
  const user = useSelector((state) => state.auth.user);
  const [currentPage, setCurrentPage] = useState(0);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCancelErrorModal, setShowCancelErrorModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [cancelErrorMessage, setCancelErrorMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [receiverId, setReceiverId] = useState("");
  const senderId = user?.uid;

  // Fetch appointments from API
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await ApiBooking.getUpcomingAppointments();

      const data = Array.isArray(response)
        ? response
        : response?.appointments || response?.data || [];

      setAppointments(data);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setErrorMessage("Không thể tải lịch hẹn. Vui lòng thử lại sau.");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [refreshTrigger]);

  useEffect(() => {
    if (onNewAppointment) {
      setAppointments((prev) => {
        const exists = prev.some((appt) => appt._id === onNewAppointment._id);
        if (!exists) {
          return [...prev, onNewAppointment];
        }
        return prev;
      });
    }
  }, [onNewAppointment]);

  // Pagination functions
  const itemsPerPage = 1;
  const totalPages = Math.ceil(appointments.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAppointments = appointments.slice(startIndex, endIndex);

  const handlePrev = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : 0));
  };

  const handleCancelBooking = (appointment) => {
    setReceiverId(appointment.doctorId.userId.uid);

    setAppointmentToCancel(appointment._id);
    setShowCancelModal(true);
  };

  const handleCancelAppointment = async () => {
    // Fixed function name
    if (!appointmentToCancel) return;

    try {
      setIsCanceling(true);
      await ApiBooking.cancelBooking(appointmentToCancel);
      await depositService(user.userId || user.uid, EXPO_PUBLIC_BOOKING_FEE);

      setAppointments((prev) =>
        prev.filter((appt) => appt._id !== appointmentToCancel)
      );

      const remainingAppointments = appointments.filter(
        (appt) => appt._id !== appointmentToCancel
      );
      const newTotalPages = Math.ceil(
        remainingAppointments.length / itemsPerPage
      );
      if (currentPage >= newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages - 1);
      }
      await ApiNotification.createNotification({
        receiverId: receiverId,
        title: "Bệnh nhân hủy lịch khám",
        content: `Bệnh nhân ${user.username || ""} đã hủy lịch khám.`,
        type: "system",
        metadata: {
          link: `/patient/appointments/${appointmentToCancel}`, // đường dẫn chi tiết lịch hẹn (nếu có)
        },
        avatar: user.avatar || "", // avatar người gửi (nếu có)
      });
      // gửi tín hiệu trạng thái hủy lịch tới bác sĩ qua Firestore
      await sendStatus(user?.uid, receiverId, "Hủy lịch");

      setShowCancelModal(false);
      setAppointmentToCancel(null);
    } catch (err) {
      console.error("Lỗi khi hủy lịch:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Không thể hủy lịch. Vui lòng thử lại sau.";
      setCancelErrorMessage(errorMsg);
      setShowCancelErrorModal(true);
    } finally {
      setIsCanceling(false);
    }
  };

  // Chat với bác sĩ
  const [showChatbot, setShowChatbot] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      id: "welcome",
      text: "Xin chào! Tôi là bác sĩ tư vấn của bạn. Bạn cần hỗ trợ gì?",
      sender: "doctor",
      timestamp: new Date(),
      isWelcome: true,
    },
  ]);

  const roomChats = useMemo(() => {
    if (!senderId) return "";
    return [senderId, receiverId].sort().join("_");
  }, [senderId, receiverId]);

  // nhận tín hiệu tin nhắn
  useEffect(() => {
    if (!senderId || !roomChats) return;

    const q = query(
      collection(db, "chats", roomChats, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const firebaseMessages = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            text: data.message || data.text || data.status || "",
            sender: data.senderId === senderId ? "patient" : "doctor",
            timestamp: data.timestamp ? data.timestamp.toDate() : new Date(),
            originalData: data,
          };
        });

        // Giữ lại tin nhắn chào mừng nếu không có tin nhắn từ Firebase
        if (firebaseMessages.length === 0) {
          setChatMessages((prev) => prev.filter((msg) => msg.isWelcome));
        } else {
          setChatMessages(firebaseMessages);
        }
      },
      (error) => {
        console.error("Firebase listener error:", error);
      }
    );

    return () => unsub();
  }, [senderId, roomChats]);

  const sendMessage = async () => {
    if (!messageInput.trim() || !senderId || !roomChats) return;

    setIsSending(true);
    const userMessage = messageInput.trim();
    setMessageInput("");

    const tempMessage = {
      id: Date.now().toString(),
      text: userMessage,
      sender: "patient",
      timestamp: new Date(),
      isTemp: true,
    };

    setChatMessages((prev) => [...prev, tempMessage]);

    try {
      const docRef = await addDoc(
        collection(db, "chats", roomChats, "messages"),
        {
          senderId,
          receiverId,
          message: userMessage,
          timestamp: serverTimestamp(),
        }
      );

      setChatMessages((prev) =>
        prev.map((msg) =>
          msg.isTemp && msg.text === userMessage
            ? { ...msg, id: docRef.id, isTemp: false }
            : msg
        )
      );
    } catch (err) {
      console.error("Error sending message:", err);
      setChatMessages((prev) =>
        prev.filter((msg) => !msg.isTemp || msg.text !== userMessage)
      );
      Alert.alert("Lỗi", "Không thể gửi tin nhắn. Vui lòng thử lại.");
    } finally {
      setIsSending(false);
    }
  };

  // nhận tín hiệu firebase
  useEffect(() => {
    const unsub = listenStatusByReceiver(senderId, async (signal) => {
      const appointmentStatuses = [
        "Đặt lịch",
        "Hủy lịch",
        "Xác nhận",
        "Hủy bởi bác sĩ",
        "Hoàn thành",
        "Đang chờ",
      ];

      if (appointmentStatuses.includes(signal?.status)) {
        await fetchAppointments();
      }
    });

    return () => unsub();
  }, [senderId]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Ionicons name="calendar" size={24} color="#007bff" />
          <Text style={styles.headerText}>Lịch hẹn sắp tới</Text>
        </View>

        {loading && (
          <View style={{ alignItems: "center", paddingVertical: 20 }}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={{ color: "#666", marginTop: 8 }}>Đang tải...</Text>
          </View>
        )}

        {!loading && appointments.length === 0 && (
          <View style={{ alignItems: "center", paddingVertical: 20 }}>
            <Text style={{ color: "#666", textAlign: "center" }}>
              Không có lịch hẹn sắp tới.
            </Text>
          </View>
        )}

        {!loading && currentAppointments && currentAppointments.length > 0 && (
          <View>
            {currentAppointments.map((appointment, index) => (
              <View
                key={appointment._id || appointment.id || index}
                style={styles.appointmentCard}
              >
                <View style={styles.statusRow}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Image
                      source={{
                        uri:
                          appointment.doctorId?.userId?.avatar ||
                          "https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face",
                      }}
                      style={styles.doctorAvatar}
                    />
                    <View style={{ marginLeft: 16 }}>
                      <Text style={styles.doctorName}>
                        {appointment.doctorId?.userId?.username ||
                          appointment.doctorId?.name ||
                          "Bác sĩ Trần Thị B"}
                      </Text>
                      <Text style={styles.doctorSpecialty}>
                        {appointment.doctorId?.hospital ||
                          "Chuyên khoa Nội tiết"}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={{
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>● Online</Text>
                    </View>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.primaryButton]}
                        onPress={() => setShowChatbot(appointment)}
                      >
                        <Ionicons name="chatbubble" size={12} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.warningButton]}
                        onPress={() =>
                          handleStartCall(
                            user,
                            {
                              uid: "1HwseYsBwxby5YnsLUWYzvRtCw53",
                              name:
                                appointment.doctorId?.name ||
                                "Bác sĩ Trần Thị B",
                              role: "doctor",
                            },
                            "patient"
                          )
                        }
                      >
                        <Ionicons name="call" size={12} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={styles.appointmentDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar" size={20} color="#007bff" />
                    <Text style={styles.detailText}>
                      {new Date(appointment.date).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="time" size={20} color="#007bff" />
                    <Text style={styles.detailText}>{appointment.time}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="location" size={20} color="#007bff" />
                    <Text style={styles.detailText}>
                      {appointment.isFollowUp === true
                        ? "Tái khám"
                        : "Khám mới"}
                    </Text>
                  </View>
                </View>

                <View style={styles.statusRow}>
                  <View style={styles.bottomRow}>
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color={
                        appointment.status === "pending" ? "#ffc107" : "#28a745"
                      }
                    />
                    <Text
                      style={{
                        color:
                          appointment.status === "pending"
                            ? "#ffc107"
                            : "#28a745",
                        fontSize: 12,
                        fontWeight: "500",
                        marginLeft: 4,
                        marginRight: 12,
                      }}
                    >
                      {appointment.status === "pending"
                        ? "Chờ xác nhận"
                        : "Đã xác nhận"}
                    </Text>
                  </View>
                  <View>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => handleCancelBooking(appointment)}
                      disabled={isCanceling}
                    >
                      <Text style={styles.cancelButtonText}>
                        {isCanceling ? "Đang hủy..." : "Hủy"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.featureRow}>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: "#e8f5e8" }]}>
              <Ionicons name="shield-checkmark" size={20} color="#28a745" />
            </View>
            <Text style={styles.featureText}>Bảo mật 100%</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: "#fff3cd" }]}>
              <Ionicons name="medal" size={20} color="#ffc107" />
            </View>
            <Text style={styles.featureText}>Bác sĩ chuyên nghiệp</Text>
          </View>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: "#cce7ff" }]}>
              <Ionicons name="time" size={20} color="#007bff" />
            </View>
            <Text style={styles.featureText}>Hỗ trợ 24/7</Text>
          </View>
        </View>

        {/* Pagination */}
        {!loading && appointments.length > 2 && (
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              style={styles.paginationButton}
              onPress={handlePrev}
              disabled={appointments.length <= 2}
            >
              <Text style={styles.paginationButtonText}>← Trước</Text>
            </TouchableOpacity>

            <View style={styles.pageIndicator}>
              <Text style={styles.pageIndicatorText}>
                {currentPage + 1} / {totalPages}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.paginationButton}
              onPress={handleNext}
              disabled={appointments.length <= 2}
            >
              <Text style={styles.paginationButtonText}>Sau →</Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && appointments.length > 0 && appointments.length <= 2 && (
          <View style={{ alignItems: "center", marginTop: 12 }}>
            <Text style={{ color: "#666", fontSize: 12 }}>
              Hiển thị {appointments.length} lịch hẹn sắp tới
            </Text>
          </View>
        )}

        {/* Chat Modal */}
        <Modal
          visible={showChatbot}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowChatbot(false)}
        >
          <View style={{ flex: 1, backgroundColor: "#fff" }}>
            <View style={styles.chatHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons
                  name="chatbubbles"
                  size={18}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.chatHeaderText}>Chat với bác sĩ</Text>
              </View>
              <TouchableOpacity onPress={() => setShowChatbot(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.chatMessages}
              ref={(scrollViewRef) => {
                this.scrollView = scrollViewRef;
              }}
              onContentSizeChange={() =>
                this.scrollView?.scrollToEnd({ animated: true })
              }
            >
              {chatMessages.length === 0 ? (
                <View style={{ alignItems: "center", marginTop: 40 }}>
                  <Ionicons
                    name="chatbubbles"
                    size={24}
                    color="#666"
                    style={{ marginBottom: 8 }}
                  />
                  <Text style={{ color: "#666", textAlign: "center" }}>
                    Chưa có tin nhắn nào
                  </Text>
                  <Text
                    style={{ color: "#999", fontSize: 12, textAlign: "center" }}
                  >
                    Bắt đầu cuộc trò chuyện với bác sĩ
                  </Text>
                </View>
              ) : (
                chatMessages.map((msg) => (
                  <View key={msg.id} style={styles.messageContainer}>
                    <View
                      style={[
                        styles.messageBubble,
                        msg.sender === "patient"
                          ? styles.patientMessage
                          : styles.doctorMessage,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          msg.sender === "patient"
                            ? styles.patientMessageText
                            : styles.doctorMessageText,
                        ]}
                      >
                        {msg.text}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.messageTime,
                        {
                          textAlign:
                            msg.sender === "patient" ? "right" : "left",
                        },
                      ]}
                    >
                      {msg.timestamp && msg.timestamp instanceof Date
                        ? msg.timestamp.toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : msg.timestamp
                        ? new Date(msg.timestamp).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
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
        </Modal>

        {/* Cancel Confirmation Modal */}
        <Modal
          visible={showCancelModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowCancelModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Xác nhận hủy lịch hẹn</Text>
                <TouchableOpacity onPress={() => setShowCancelModal(false)}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <View style={styles.modalBody}>
                <Text style={styles.modalText}>
                  Bạn có chắc chắn muốn hủy lịch hẹn này không?
                </Text>
              </View>
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={() => setShowCancelModal(false)}
                  disabled={isCanceling}
                >
                  <Text style={styles.secondaryButtonText}>Không</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.dangerButton]}
                  onPress={handleCancelAppointment}
                  disabled={isCanceling}
                >
                  {isCanceling ? (
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <ActivityIndicator
                        size="small"
                        color="#fff"
                        style={{ marginRight: 8 }}
                      />
                      <Text style={styles.buttonText}>Đang hủy...</Text>
                    </View>
                  ) : (
                    <Text style={styles.buttonText}>Có, hủy lịch hẹn</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Cancel Error Modal */}
        <CustomModal
          visible={showCancelErrorModal}
          onClose={() => setShowCancelErrorModal(false)}
          title="Lỗi hủy lịch hẹn"
          type="danger"
        >
          <Text style={{ textAlign: "center", marginBottom: 16 }}>
            {cancelErrorMessage}
          </Text>
          <Button
            variant="danger"
            onPress={() => setShowCancelErrorModal(false)}
          >
            Đóng
          </Button>
        </CustomModal>

        {/* Error Modal */}
        <CustomModal
          visible={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          title="Lỗi"
          type="danger"
        >
          <Text style={{ textAlign: "center", marginBottom: 16 }}>
            {errorMessage}
          </Text>
          <Button variant="primary" onPress={() => setShowErrorModal(false)}>
            Đóng
          </Button>
        </CustomModal>
      </View>
    </View>
  );
};

const BookingNew = ({ handleSubmit }) => {
  const [appointmentType, setAppointmentType] = useState("onsite");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
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
  const user = useSelector((state) => state.auth.user);
  const [receiverId, setReceiverId] = useState();
  const [showInsufficientBalanceModal, setShowInsufficientBalanceModal] =
    useState(false);
  const navigation = useNavigation();

  // Fetch doctors by date
  useEffect(() => {
    if (!selectedDate) return;

    const fetchDoctors = async () => {
      setLoadingDoctors(true);
      setSelectedDoctor(null);
      try {
        const dateString = getDateString(selectedDate);
        const response = await ApiBooking.getDoctorsByDate(dateString);
        const data = Array.isArray(response) ? response : response?.data || [];
        const normalizedDoctors = data.map((doctor, index) => ({
          ...doctor,
          id: doctor.id || doctor._id || doctor.doctorId || `doctor-${index}`, // Tạo ID duy nhất
        }));
        setDoctors(normalizedDoctors);
      } catch (err) {
        console.error("Lỗi khi tải danh sách bác sĩ:", err);
        setDoctors([]);
        setErrorMessage(
          "Không thể tải danh sách bác sĩ. Vui lòng thử lại sau."
        );
        setShowErrorModal(true);
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchDoctors();
  }, [selectedDate]);

  // Format ngày thành chuỗi YYYY-MM-DD
  const getDateString = (date) => {
    if (!(date instanceof Date) || isNaN(date)) {
      console.error("Invalid date:", date);
      return new Date().toISOString().split("T")[0];
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (event, date) => {
    // Đóng date picker trên Android ngay lập tức
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    // Chỉ cập nhật date khi user chọn (không phải khi dismiss)
    if (event?.type === "set" && date) {
      setSelectedDate(date);
      setSelectedTime(""); // Reset time khi đổi ngày
    }

    // Đóng date picker trên iOS khi chọn xong
    if (
      Platform.OS === "ios" &&
      (event?.type === "set" || event?.type === "dismissed")
    ) {
      setShowDatePicker(false);
    }
  };

  // Xử lý thay đổi ngày trên web
  const handleWebDateChange = (event) => {
    const dateString = event.target.value;
    if (dateString) {
      const newDate = new Date(dateString);
      if (!isNaN(newDate)) {
        setSelectedDate(newDate);
        setSelectedTime(""); // Reset time khi đổi ngày
      } else {
        console.error("Invalid web date input:", dateString);
      }
    }
  };

  // SỬA LẠI: Toggle date picker
  const toggleDatePicker = () => {
    if (Platform.OS === "android" || Platform.OS === "ios") {
      setShowDatePicker(!showDatePicker);
    }
  };

  const onSubmit = useCallback(async () => {
    // Validation
    if (!user?.uid) {
      setErrorMessage("Vui lòng đăng nhập để đặt lịch.");
      setShowErrorModal(true);
      return;
    }

    if (!selectedDoctor || !selectedDate || !selectedTime) {
      setErrorMessage(
        "Vui lòng chọn bác sĩ, ngày, giờ khám và nhập lý do khám."
      );
      setShowErrorModal(true);
      return;
    }

    // Date validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    if (selected < today) {
      setErrorMessage("Không thể chọn ngày trong quá khứ.");
      setShowErrorModal(true);
      return;
    }

    // Doctor working hours validation
    const selectedDoctorData = doctors.find((d) => d.id === selectedDoctor);
    if (!selectedDoctorData) {
      setErrorMessage("Bác sĩ không hợp lệ. Vui lòng chọn lại.");
      setShowErrorModal(true);
      return;
    }

    const doctorStartTime = selectedDoctorData?.shift?.start || "08:00";
    const doctorEndTime = selectedDoctorData?.shift?.end || "17:00";
    if (selectedTime < doctorStartTime || selectedTime > doctorEndTime) {
      setErrorMessage(
        "Thời gian chọn không nằm trong khung giờ làm việc của bác sĩ."
      );
      setShowErrorModal(true);
      return;
    }

    try {
      setLoadingSubmit(true);

      const balanceResponse = await getBalanceService(user.userId || user.uid);
      const balance = balanceResponse?.DT?.balance || 0;

      if (balance < EXPO_PUBLIC_BOOKING_FEE) {
        setShowInsufficientBalanceModal(true);
        return;
      }

      const payload = {
        firebaseUid: user.uid,
        doctorId: selectedDoctor,
        date: selectedDate,
        time: selectedTime,
        type: appointmentType,
        reason: reason.trim(),
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
      };

      const response = await ApiBooking.bookAppointment(payload);
      await withdrawService(user.userId || user.uid, EXPO_PUBLIC_BOOKING_FEE);

      const newAppointment = {
        _id: response._id || response.id || Date.now().toString(),
        doctorId: {
          _id: selectedDoctor,
          name: selectedDoctorData.name,
          userId: {
            username: selectedDoctorData.name,
            avatar:
              selectedDoctorData.avatar ||
              "https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face",
          },
          hospital: selectedDoctorData.hospital || "Chuyên khoa Nội tiết",
        },
        date: selectedDate,
        time: selectedTime,
        status: response.status || "pending",
      };

      const successMsg = `Đặt lịch khám thành công với bác sĩ ${
        selectedDoctorData.name
      } vào ${selectedTime} ngày ${new Date(selectedDate).toLocaleDateString(
        "vi-VN"
      )}!`;

      await ApiNotification.createNotification({
        receiverId: selectedDoctorData.uid,
        title: "Bệnh nhân mới đặt lịch khám",
        content: `Bệnh nhân ${
          user.username || ""
        } đã đặt lịch khám vào lúc ${selectedTime} ngày ${new Date(
          selectedDate
        ).toLocaleDateString("vi-VN")}.`,
        type: "system",
        metadata: {
          link: `/appointments/${response._id}`, // đường dẫn chi tiết lịch hẹn (nếu có)
        },
        avatar: user.avatar || "", // avatar người gửi (nếu có)
      });
      // gửi tín hiệu trạng thái đặt lịch tới bác sĩ qua Firestore
      await sendStatus(user?.uid, selectedDoctorData?.uid, "Đặt lịch");
      setSuccessMessage(successMsg);
      setShowSuccessModal(true);

      // Reset form
      setSelectedDoctor(null);
      setSelectedTime("");
      setReason("");
      setNotes("");
      setAppointmentType("onsite");

      // Call handleSubmit from props
      handleSubmit(newAppointment);
    } catch (err) {
      console.error("Lỗi khi đặt lịch:", err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        "Không thể đặt lịch. Vui lòng kiểm tra kết nối và thử lại.";
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
    } finally {
      setLoadingSubmit(false);
    }
  }, [
    user,
    selectedDoctor,
    selectedDate,
    selectedTime,
    reason,
    notes,
    appointmentType,
    doctors,
    handleSubmit,
  ]);

  const generateTimeSlots = () => {
    const allTimeSlots = [];
    for (let hour = 8; hour <= 16; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 16 && minute > 30) break;
        const timeString = `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`;
        allTimeSlots.push(timeString);
      }
    }
    return allTimeSlots;
  };

  const isTimeInWorkingHours = (time) => {
    if (!selectedDoctor) return false;
    const selectedDoctorData = doctors.find(
      (d) => (d.id || d._id || d.doctorId) === selectedDoctor
    );
    if (!selectedDoctorData) return false;

    const doctorStartTime = selectedDoctorData?.shift?.start || "08:00";
    const doctorEndTime = selectedDoctorData?.shift?.end || "17:00";
    return time >= doctorStartTime && time <= doctorEndTime;
  };

  return (
    <ScrollView style={styles.bookingContainer}>
      <View style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <Text style={styles.bookingTitle}>🩺 Đặt lịch khám mới</Text>
          <Text style={styles.bookingSubtitle}>
            Vui lòng điền đầy đủ thông tin để đặt lịch
          </Text>
        </View>

        {/* Appointment Type */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Loại hình khám</Text>
          <View style={styles.appointmentTypeRow}>
            <TouchableOpacity
              style={[
                styles.appointmentTypeButton,
                appointmentType === "onsite"
                  ? styles.appointmentTypeButtonActive
                  : styles.appointmentTypeButtonInactive,
              ]}
              onPress={() => setAppointmentType("onsite")}
            >
              <Ionicons
                name="location"
                size={16}
                color={appointmentType === "onsite" ? "#fff" : "#007bff"}
                style={{ marginRight: 8 }}
              />
              <Text
                style={
                  appointmentType === "onsite"
                    ? styles.appointmentTypeTextActive
                    : styles.appointmentTypeTextInactive
                }
              >
                Tại phòng khám
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.appointmentTypeButton,
                appointmentType === "online"
                  ? styles.appointmentTypeButtonActive
                  : styles.appointmentTypeButtonInactive,
              ]}
              onPress={() => setAppointmentType("online")}
            >
              <Ionicons
                name="videocam"
                size={16}
                color={appointmentType === "online" ? "#fff" : "#007bff"}
                style={{ marginRight: 8 }}
              />
              <Text
                style={
                  appointmentType === "online"
                    ? styles.appointmentTypeTextActive
                    : styles.appointmentTypeTextInactive
                }
              >
                Khám trực tuyến
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Chọn ngày khám</Text>
          <TouchableOpacity
            style={styles.datePickerContainer}
            onPress={Platform.OS === "web" ? undefined : toggleDatePicker}
          >
            <Ionicons
              name="calendar"
              size={20}
              color="#007bff"
              style={{ marginRight: 8 }}
            />

            {Platform.OS === "web" ? (
              <input
                type="date"
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  backgroundColor: "transparent",
                }}
                value={getDateString(selectedDate)}
                onChange={handleWebDateChange}
                min={getDateString(new Date())} // Không cho chọn ngày quá khứ
                max={getDateString(
                  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                )} // Tối đa 30 ngày
              />
            ) : (
              <Text style={styles.datePickerText}>
                {selectedDate && !isNaN(selectedDate)
                  ? selectedDate.toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  : "Chọn ngày"}
              </Text>
            )}

            {Platform.OS !== "web" && (
              <Ionicons
                name={showDatePicker ? "chevron-up" : "chevron-down"}
                size={16}
                color="#666"
              />
            )}
          </TouchableOpacity>

          {/* DateTimePicker cho mobile */}
          {Platform.OS !== "web" && showDatePicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={
                selectedDate && !isNaN(selectedDate) ? selectedDate : new Date()
              }
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleDateChange}
              minimumDate={new Date()}
              maximumDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
              locale="vi-VN"
              style={{ backgroundColor: "#ffffff" }}
            />
          )}
        </View>

        {/* Doctor Selection */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Chọn bác sĩ</Text>
          {loadingDoctors ? (
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <ActivityIndicator size="large" color="#007bff" />
              <Text style={{ color: "#666", marginTop: 8 }}>
                Đang tải danh sách bác sĩ...
              </Text>
            </View>
          ) : doctors.length === 0 && selectedDate ? (
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <Text style={{ color: "#666", textAlign: "center" }}>
                Không có bác sĩ làm việc thời gian này.
              </Text>
            </View>
          ) : (
            <View>
              {doctors.map((doctor) => (
                <TouchableOpacity
                  key={doctor.id || doctor._id}
                  style={[
                    styles.datePickerContainer,
                    { marginBottom: 8 },
                    selectedDoctor ===
                      (doctor.doctorId || doctor.id || doctor._id) && {
                      borderColor: "#007bff",
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() =>
                    setSelectedDoctor(
                      doctor.doctorId || doctor.id || doctor._id
                    )
                  }
                >
                  <Image
                    source={{
                      uri:
                        doctor.avatar ||
                        "https://png.pngtree.com/png-clipart/20210310/original/pngtree-hospital-hotline-avatar-female-doctor-png-image_5951490.jpg",
                    }}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      marginRight: 12,
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "bold",
                        color: "#333",
                      }}
                    >
                      {doctor.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: "#666" }}>
                      {doctor.hospital || "Bệnh viện chưa cập nhật"}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: 2,
                      }}
                    >
                      <Ionicons name="star" size={12} color="#ffc107" />
                      <Text
                        style={{ fontSize: 10, color: "#666", marginLeft: 4 }}
                      >
                        4.9 • {doctor.exp || "10"} năm KN
                      </Text>
                    </View>
                  </View>
                  {selectedDoctor ===
                    (doctor.doctorId || doctor.id || doctor._id) && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color="#007bff"
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Time Selection */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Chọn giờ khám
            {!selectedDoctor && (
              <Text style={{ fontSize: 12, color: "#666" }}>
                {" "}
                (Vui lòng chọn bác sĩ trước)
              </Text>
            )}
          </Text>
          <View style={styles.timeSlotContainer}>
            {generateTimeSlots().map((time) => {
              const canSelect = selectedDoctor && isTimeInWorkingHours(time);
              const isSelected = selectedTime === time;

              return (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeSlot,
                    isSelected
                      ? styles.timeSlotActive
                      : canSelect
                      ? styles.timeSlotInactive
                      : styles.timeSlotDisabled,
                  ]}
                  onPress={() => canSelect && setSelectedTime(time)}
                  disabled={!canSelect}
                >
                  <Text
                    style={
                      isSelected
                        ? styles.timeSlotTextActive
                        : styles.timeSlotTextInactive
                    }
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Reason */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Lý do khám *</Text>
          <TextInput
            style={[styles.textArea, { height: 80 }]}
            multiline
            numberOfLines={4}
            value={reason}
            onChangeText={setReason}
            placeholder="Mô tả ngắn gọn lý do bạn muốn khám..."
          />
        </View>

        {/* Notes */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Ghi chú thêm</Text>
          <TextInput
            style={[styles.textArea, { height: 60 }]}
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
            placeholder="Thêm thông tin bổ sung nếu có..."
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={onSubmit}
          disabled={loadingSubmit}
        >
          {loadingSubmit ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="checkmark-circle" size={16} color="#fff" />
          )}
          <Text style={styles.submitButtonText}>
            {loadingSubmit ? "Đang đặt lịch..." : "Xác nhận đặt lịch khám"}
          </Text>
        </TouchableOpacity>

        {/* Success Modal */}
        <CustomModal
          visible={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title="Đặt lịch thành công!"
          type="success"
        >
          <Text style={{ textAlign: "center", marginBottom: 16 }}>
            {successMessage}
          </Text>
          <Button variant="success" onPress={() => setShowSuccessModal(false)}>
            Đóng
          </Button>
        </CustomModal>

        {/* Error Modal */}
        <CustomModal
          visible={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          title="Lỗi đặt lịch hẹn"
          type="danger"
        >
          <Text style={{ textAlign: "center", marginBottom: 16 }}>
            {errorMessage}
          </Text>
          <Button variant="danger" onPress={() => setShowErrorModal(false)}>
            Đóng
          </Button>
        </CustomModal>
        {/* Insufficient Balance Modal */}
        <CustomModal
          visible={showInsufficientBalanceModal}
          onClose={() => setShowInsufficientBalanceModal(false)}
          title="Số dư không đủ"
          type="warning"
        >
          <Text style={{ textAlign: "center", marginBottom: 16 }}>
            Số dư tài khoản của bạn không đủ để đặt lịch khám. Vui lòng nạp thêm
            tiền.
          </Text>
          <Button
            variant="warning"
            onPress={() => {
              setShowInsufficientBalanceModal(false);
              navigation.navigate("payment"); // Điều hướng
            }}
          >
            Nạp tiền ngay
          </Button>
        </CustomModal>
      </View>
    </ScrollView>
  );
};

const BookingTabs = ({ handleStartCall }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [newAppointment, setNewAppointment] = useState(null);

  const handleSubmit = useCallback((appointment) => {
    setRefreshTrigger((prev) => prev + 1);
    setNewAppointment(appointment);
  }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
      {/* Lịch hẹn sắp tới - ở trên */}
      <View>
        <UpcomingAppointment
          handleStartCall={handleStartCall}
          refreshTrigger={refreshTrigger}
          onNewAppointment={newAppointment}
        />
      </View>

      {/* Đặt lịch khám mới - ở dưới */}
      <View>
        <BookingNew handleSubmit={handleSubmit} />
      </View>
    </ScrollView>
  );
};

export default BookingTabs;
