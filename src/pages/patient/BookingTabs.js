import React, { useState, useEffect, useCallback } from "react";
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { collection, onSnapshot, orderBy, query, addDoc, serverTimestamp } from 'firebase/firestore';
import { useSelector } from "react-redux";
import { db } from "../../../firebase";
import ApiBooking from "../../apis/ApiBooking";
// import DateTimePicker from "@react-native-community/datetimepicker";

const UpcomingAppointment = ({ handleStartCall, refreshTrigger, onNewAppointment }) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const user = useSelector((state) => state.auth.userInfo);
  const [currentPage, setCurrentPage] = useState(0);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCancelErrorModal, setShowCancelErrorModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);
  const [cancelErrorMessage, setCancelErrorMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch appointments từ API
  useEffect(() => {
    const fetchAppointments = async () => {
      console.log("Fetching appointments...");
      try {
        setLoading(true);
        const response = await ApiBooking.getUpcomingAppointments();
        console.log("Appointments fetched:", response);

        // đảm bảo appointments luôn là array
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

    fetchAppointments();
  }, [refreshTrigger]);

  useEffect(() => {
    if (onNewAppointment) {
      setAppointments((prev) => {
        // Kiểm tra tránh trùng lặp
        const exists = prev.some(appt => appt._id === onNewAppointment._id);
        if (!exists) {
          return [...prev, onNewAppointment];
        }
        return prev;
      });
    }
  }, [onNewAppointment]);

  // Pagination functions
  const itemsPerPage = 2;
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

  // Hủy lịch hẹn
  const handleCancelBooking = (appointmentId) => {
    setAppointmentToCancel(appointmentId);
    setShowCancelModal(true);
  };

  const confirmCancelBooking = async () => {
    if (!appointmentToCancel) return;

    try {
      setCancelling(true);
      await ApiBooking.cancelBooking(appointmentToCancel);

      setAppointments((prev) =>
        prev.filter((appt) => appt._id !== appointmentToCancel)
      );

      // Reset page nếu trang hiện tại không còn lịch hẹn nào
      const remainingAppointments = appointments.filter((appt) => appt._id !== appointmentToCancel);
      const newTotalPages = Math.ceil(remainingAppointments.length / itemsPerPage);
      if (currentPage >= newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages - 1);
      }

      setShowCancelModal(false);
      setAppointmentToCancel(null);
    } catch (err) {
      console.error("Lỗi khi hủy lịch:", err);
      const errorMsg = err.response?.data?.message || err.message || "Không thể hủy lịch. Vui lòng thử lại sau.";
      setCancelErrorMessage(errorMsg);
      setShowCancelErrorModal(true);
    } finally {
      setCancelling(false);
    }
  };

  // chat với bác sĩ
  const [showChatbot, setShowChatbot] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const senderId = user?.uid;
  const receiverId = "weHP9TWfdrZo5L9rmY81BRYxNXr2";
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'welcome',
      text: "Xin chào! Tôi là bác sĩ tư vấn của bạn. Bạn cần hỗ trợ gì?",
      sender: "doctor",
      timestamp: new Date(),
      isWelcome: true
    },
  ]);

  const roomChats = [senderId, receiverId].sort().join('_');

  useEffect(() => {
    if (!senderId) return;

    const q = query(
      collection(db, 'chats', roomChats, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsub = onSnapshot(q, (snapshot) => {

      const firebaseMessages = snapshot.docs.map(doc => {
        const data = doc.data();

        return {
          id: doc.id,
          text: data.message || data.text || '', // Hỗ trợ cả 'message' và 'text'
          sender: data.senderId === senderId ? "patient" : "doctor",
          timestamp: data.timestamp ? data.timestamp.toDate() : new Date(), // Chuyển đổi Firestore timestamp
          originalData: data // Lưu trữ dữ liệu gốc để debug
        };
      });

      // Giữ lại tin nhắn chào mừng nếu không có tin nhắn từ Firebase
      if (firebaseMessages.length === 0) {
        setChatMessages(prev => prev.filter(msg => msg.isWelcome));
      } else {
        setChatMessages(firebaseMessages);
      }
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
      sender: "patient",
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chào mừng đến với BookingTabs!</Text>
      <Text style={styles.text}>Đây là màn hình React Native cơ bản.</Text>
    </View>
  );
};

const BookingNew = ({ handleSubmit }) => {
  const [appointmentType, setAppointmentType] = useState("onsite");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    // Mặc định chọn ngày hiện tại
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
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const user = useSelector((state) => state.auth.userInfo);


  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Lấy bác sĩ theo ngày
  useEffect(() => {
    if (!selectedDate) return;

    const fetchDoctors = async () => {
      setLoadingDoctors(true);
      try {
        const response = await ApiBooking.getDoctorsByDate(selectedDate);
        // Chuẩn hóa data
        const data = Array.isArray(response)
          ? response
          : response?.data || [];
        setDoctors(data);
      } catch (err) {
        console.error("Lỗi khi tải danh sách bác sĩ:", err);
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
    console.log("onSubmit called");

    // Kiểm tra các trường bắt buộc
    if (!user?.uid) {
      console.log("Error: User not logged in", user); // Log thông tin user
      setErrorMessage("Vui lòng đăng nhập để đặt lịch.");
      setShowErrorModal(true);
      return;
    }
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      console.log("Error: Missing required fields", {
        selectedDoctor,
        selectedDate,
        selectedTime,
        reason
      }); // Log các trường bắt buộc
      setErrorMessage("Vui lòng chọn bác sĩ, ngày, giờ khám và nhập lý do khám.");
      setShowErrorModal(true);
      return;
    }

    // Kiểm tra ngày hợp lệ (cho phép chọn ngày hiện tại)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selected = new Date(selectedDate);
    if (selected < today) {
      console.log("Error: Invalid date", { selectedDate, today }); // Log ngày
      setErrorMessage("Không thể chọn ngày trong quá khứ.");
      setShowErrorModal(true);
      return;
    }

    // Kiểm tra thời gian trong khung giờ làm việc của bác sĩ
    const selectedDoctorData = doctors.find(d => (d.id || d._id || d.doctorId) === selectedDoctor);
    if (!selectedDoctorData) {
      console.log("Error: Invalid doctor", { selectedDoctor, doctors }); // Log bác sĩ
      setErrorMessage("Bác sĩ không hợp lệ. Vui lòng chọn lại.");
      setShowErrorModal(true);
      return;
    }
    const doctorStartTime = selectedDoctorData?.shift?.start || "08:00";
    const doctorEndTime = selectedDoctorData?.shift?.end || "17:00";
    if (selectedTime < doctorStartTime || selectedTime > doctorEndTime) {
      console.log("Error: Invalid time", { selectedTime, doctorStartTime, doctorEndTime }); // Log thời gian
      setErrorMessage("Thời gian chọn không nằm trong khung giờ làm việc của bác sĩ.");
      setShowErrorModal(true);
      return;
    }

    try {
      const payload = {
        firebaseUid: user.uid,
        doctorId: selectedDoctor,
        date: selectedDate,
        time: selectedTime,
        type: appointmentType,
        reason: reason.trim(),
        notes: notes.trim(),
        createdAt: new Date().toISOString() // Thêm thời gian tạo để theo dõi
      };

      const response = await ApiBooking.bookAppointment(payload);

      console.log("Booking response:", response);
      const newAppointment = {
        _id: response._id || response.id || Date.now().toString(), // Đảm bảo có _id
        doctorId: {
          _id: selectedDoctor,
          name: selectedDoctorData.name,
          specialty: selectedDoctorData.specialty || "Chuyên khoa Nội tiết",
          image: selectedDoctorData.avatar || "https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face"
        },
        date: selectedDate,
        time: selectedTime,
        status: response.status || "pending" // Mặc định là pending nếu API không trả về status
      };

      const successMsg = `Đặt lịch khám thành công với bác sĩ ${selectedDoctorData.name} vào ${selectedTime} ngày ${new Date(selectedDate).toLocaleDateString("vi-VN")}!`;
      setSuccessMessage(successMsg);
      setShowSuccessModal(true);

      // Reset form (giữ nguyên ngày hiện tại)
      setSelectedDoctor(null);
      // Giữ nguyên ngày hiện tại, không reset
      setSelectedTime("");
      setReason("");
      setNotes("");
      setAppointmentType("onsite");

      // Gọi handleSubmit từ props
      handleSubmit(newAppointment);

    } catch (err) {
      console.error("Lỗi khi đặt lịch:", err);
      // SỬA: Thông báo lỗi chi tiết hơn bằng modal
      const errorMsg = err.response?.data?.message || err.message || "Không thể đặt lịch. Vui lòng kiểm tra kết nối và thử lại.";
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
    } finally {
      setLoadingSubmit(false);
    }
  }, [user, selectedDoctor, selectedDate, selectedTime, reason, notes, appointmentType, doctors, handleSubmit]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chào mừng đến với BookingTabs!</Text>
      <Text style={styles.text}>Đây là màn hình React Native cơ bản.</Text>
    </View>
  );
};

const BookingTabs = ({ handleStartCall }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [newAppointment, setNewAppointment] = useState(null);

  const handleSubmit = (appointment) => {
    setRefreshTrigger((prev) => prev + 1);
    setNewAppointment(appointment);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chào mừng đến với BookingTabs!</Text>
      <Text style={styles.text}>Đây là màn hình React Native cơ bản.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    color: '#2196F3',
    marginBottom: 12,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 16,
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
});

export default BookingTabs;
