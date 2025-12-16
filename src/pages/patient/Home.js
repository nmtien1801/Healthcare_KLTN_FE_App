import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { Check, MessageCircle } from "lucide-react-native";
import ApiBooking from "../../apis/ApiBooking";
import {
  fetchMedicines,
  updateStatusMedicine,
} from "../../redux/medicineAiSlice";
import moment from "moment";
import { useFocusEffect } from "@react-navigation/native"; // mỗi lần vào thì tự useEffect lại

const Home = () => {
  const navigation = useNavigation();
  const user = useSelector((state) => state.auth.user);
  const bloodSugar = useSelector((state) => state.patient.bloodSugar);
  const [nearestAppointment, setNearestAppointment] = useState(null);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();

  const calculateAge = (user) => {
    if (!user?.dob) return "";
    const dob = new Date(user.dob);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  // lấy lịch hẹn gần nhất
  useEffect(() => {
    const fetchNearestAppointment = async () => {
      try {
        setLoading(true);
        const appointments = await ApiBooking.getUpcomingAppointments();
        if (appointments && appointments.length > 0) {
          const sortedAppointments = appointments.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
              return 0;
            }
            if (dateA.getTime() === dateB.getTime()) {
              return a.time.localeCompare(b.time);
            }
            return dateA - dateB;
          });
          setNearestAppointment(sortedAppointments[0]);
        }
      } catch (error) {
        console.error("Lỗi khi lấy lịch hẹn:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNearestAppointment();
  }, []);

  useEffect(() => {
    if (!bloodSugar || !bloodSugar.DT) {
      console.log("Đang fetch lại dữ liệu đường huyết...");
    }
  }, [dispatch, bloodSugar, user.userId]);

  // Hàm tìm dữ liệu đường huyết mới nhất
  const getLatestBloodSugarData = (bloodSugar) => {
    const bloodSugarData = bloodSugar?.DT?.bloodSugarData;
    if (!bloodSugarData) return null;

    // Chuyển đối tượng { key: { value: X, time: Y } } thành mảng các item
    const dataArray = Object.values(bloodSugarData);

    if (dataArray.length === 0) return null;

    // Tìm item có time (thời gian) lớn nhất
    const latestItem = dataArray.reduce((latest, current) => {
      // Chuyển chuỗi thời gian thành đối tượng Date để so sánh
      const timeLatest = new Date(latest.time).getTime();
      const timeCurrent = new Date(current.time).getTime();

      return timeCurrent > timeLatest ? current : latest;
    });

    return latestItem;
  };
  const latestBloodSugar = getLatestBloodSugarData(bloodSugar);

  // Handle user data with fallback values
  const userData = {
    name: user?.username || "Khách",
    age: user ? calculateAge(user) : "",
    gender: user?.gender || "N/A",
    condition: "Tiểu đường type 2",
    doctor: nearestAppointment?.doctorId?.userId?.username || "Chưa có",
    nextAppointment: nearestAppointment?.date
      ? new Date(nearestAppointment.date).toLocaleDateString("vi-VN")
      : "13/09/2025",
    latestValue: latestBloodSugar?.value,
    latestTime: latestBloodSugar?.time,
  };

  const handleMedicationToggle = async (index) => {
    const updated = [...medications];
    updated[index].status = !updated[index].status;
    setMedications(updated);

    await dispatch(
      updateStatusMedicine({
        id: updated[index]._id,
        status: updated[index].status,
      })
    );
  };

  useFocusEffect(
    React.useCallback(() => {
      const fetchMedicine = async () => {
        try {
          let res = await dispatch(
            fetchMedicines({
              userId: user.userId,
              date: new Date().toISOString(),
            })
          );
          setMedications(res.payload.DT);
        } catch (error) {
          console.error("Lỗi khi lấy lịch hẹn:", error);
        }
      };

      if (user && user.userId) {
        fetchMedicine();
      }

      // Hàm này sẽ chạy khi màn hình bị Unfocus (chuyển tab khác)
      return () => {};
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chăm sóc sức khỏe - Tiểu đường</Text>
        <Text style={styles.headerSubtitle}>Xin chào, {userData.name}</Text>
      </View>

      {/* Patient Info */}
      <View style={styles.card}>
        <View style={styles.patientHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {userData.name ? userData.name.charAt(0) : "K"}
            </Text>
          </View>
          <View>
            <Text style={styles.patientName}>{userData.name}</Text>
            <Text style={styles.patientCondition}>{userData.condition}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.patientInfo}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Tuổi</Text>
            <Text style={styles.infoValue}>{userData.age || "N/A"}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Giới tính</Text>
            <Text style={styles.infoValue}>{userData.gender}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Bác sĩ</Text>
            <Text style={styles.infoValue}>{userData.doctor}</Text>
          </View>
        </View>
        <Text style={styles.nextAppointment}>
          Lịch hẹn tiếp theo: {userData.nextAppointment}
        </Text>
      </View>

      {/* Blood Sugar */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Đường huyết hôm nay</Text>
          <TouchableOpacity
            style={styles.detailButton}
            onPress={() => navigation.navigate("Sức khỏe")}
          >
            <Text style={styles.detailButtonText}>Xem Chi tiết</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.bloodSugarCard}>
          <Text style={styles.bloodSugarValue}>
            {userData.latestValue ?? "--"} mmol/L
          </Text>
          <Text style={styles.bloodSugarDate}>
            {userData.latestTime
              ? moment(userData.latestTime).format("HH:mm - DD/MM/YYYY")
              : "Không có dữ liệu"}
          </Text>
        </View>
      </View>

      {/* Medications */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Lịch uống thuốc</Text>
        {medications.length > 0 ? (
          medications.map((med, idx) => (
            <View key={idx} style={styles.medicationItem}>
              <View>
                <Text style={styles.medicationName}>
                  {med.name} {med.dosage}
                </Text>
                <Text style={styles.medicationTime}>
                  {moment(med.time).utc().format("HH:mm:ss")}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.medicationButton,
                  med.status ? styles.takenButton : styles.untakenButton,
                ]}
                onPress={() => handleMedicationToggle(idx)}
              >
                <Text style={styles.medicationButtonText}>
                  {med.status ? "" : "Đánh dấu"}
                </Text>
                {med.status && <Check size={16} color="#FFF" strokeWidth={3} />}
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.noMedications}>Chưa có thuốc được thêm.</Text>
        )}
      </View>

      {/* Chatbot Support */}
      <View style={styles.chatCard}>
        <View>
          <Text style={styles.chatTitle}>Trợ lý sức khỏe AI</Text>
          <Text style={styles.chatSubtitle}>Tư vấn lịch uống thuốc</Text>
        </View>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => navigation.navigate("Trợ lý AI")}
        >
          <MessageCircle size={16} color="#3B82F6" />
          <Text style={styles.chatButtonText}>Chat ngay</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: "#3B82F6",
  },
  header: {
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3B82F6",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  patientHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
    color: "#FFF",
    fontWeight: "bold",
  },
  patientName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E3A8A",
  },
  patientCondition: {
    fontSize: 14,
    color: "#6B7280",
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 12,
  },
  patientInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  infoItem: {
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 12,
    color: "#6B7280",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1E3A8A",
  },
  nextAppointment: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E3A8A",
  },
  detailButton: {
    borderWidth: 1,
    borderColor: "#3B82F6",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  detailButtonText: {
    fontSize: 12,
    color: "#3B82F6",
  },
  bloodSugarCard: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  bloodSugarValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3B82F6",
    marginBottom: 4,
  },
  bloodSugarDate: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 8,
  },
  badge: {
    backgroundColor: "#F59E0B",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  badgeText: {
    fontSize: 12,
    color: "#1F2937",
  },
  medicationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  medicationName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E3A8A",
  },
  medicationTime: {
    fontSize: 12,
    color: "#6B7280",
  },
  medicationButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  takenButton: {
    backgroundColor: "#2E7D32",
  },
  untakenButton: {
    borderWidth: 1,
    borderColor: "#3B82F6",
  },
  medicationButtonText: {
    fontSize: 12,
    color: "#3B82F6",
    marginRight: 4,
  },
  noMedications: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  chatCard: {
    backgroundColor: "#6366F1",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  chatSubtitle: {
    fontSize: 12,
    color: "#E5E7EB",
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chatButtonText: {
    fontSize: 12,
    color: "#3B82F6",
    marginLeft: 4,
  },
});

export default Home;
