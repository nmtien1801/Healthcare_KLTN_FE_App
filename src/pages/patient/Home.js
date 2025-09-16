import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
} from "react-native";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import ApiBooking from "../../apis/ApiBooking";

const { width } = Dimensions.get("window");

const Home = () => {
  const navigation = useNavigation();
  let user = useSelector((state) => state.auth.user);
  let bloodSugar = useSelector((state) => state.patient.bloodSugar);
  const [nearestAppointment, setNearestAppointment] = useState(null);

  let calculateAge = (user) => {
    if (!user.dob) return "";
    const dob = new Date(user.dob);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }

  // Lấy lịch hẹn gần nhất
  useEffect(() => {
    const fetchNearestAppointment = async () => {
      try {
        const appointments = await ApiBooking.getUpcomingAppointments();

        if (appointments && appointments.length > 0) {
          // Sắp xếp theo thời gian: kết hợp date và time
          const sortedAppointments = appointments.sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);

            // Kiểm tra xem date có hợp lệ không
            if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
              return 0;
            }

            // Nếu cùng ngày, so sánh theo giờ
            if (dateA.getTime() === dateB.getTime()) {
              return a.time.localeCompare(b.time);
            }

            return dateA - dateB;
          });

          // Lấy lịch hẹn gần nhất (phần tử đầu tiên)
          setNearestAppointment(sortedAppointments[0]);
        }
      } catch (error) {
        console.error('Lỗi khi lấy lịch hẹn:', error);
      }
    };

    fetchNearestAppointment();
  }, []);

  const userData = {
    name: user?.username,
    age: calculateAge(user),
    gender: user?.gender,
    condition: "Tiểu đường type 2",
    doctor: nearestAppointment?.doctorId?.userId?.username ?? "",
    nextAppointment: nearestAppointment?.date ? new Date(nearestAppointment.date).toLocaleDateString('vi-VN') : "13/09/2025",
    bloodSugar: bloodSugar?.DT?.bloodSugarData
      ? Object.values(bloodSugar.DT.bloodSugarData).map(item => item.value)
      : [],
  };

  // thuốc
  const [medications, setMedications] = useState([]);

  const handleMedicationToggle = (index) => {
    const updated = [...medications];
    updated[index].taken = !updated[index].taken;
    setMedications(updated);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.row}>
        {/* Thông tin bệnh nhân */}
        <View style={styles.card}>
          <View style={styles.userRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userData.name}</Text>
            </View>
            <View>
              <Text style={styles.userName}>{userData.name}</Text>
              <Text style={styles.condition}>{userData.condition}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={styles.label}>Tuổi</Text>
              <Text style={styles.value}>{userData.age}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.label}>Giới tính</Text>
              <Text style={styles.value}>{userData.gender}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.label}>Bác sĩ</Text>
              <Text style={styles.value}>{userData.doctor}</Text>
            </View>
          </View>

          <Text style={styles.nextAppointment}>
            Lịch hẹn tiếp theo: {userData.nextAppointment}
          </Text>
        </View>

        {/* Chỉ số đường huyết */}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Đường huyết hôm nay</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("HealthTabs")}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Xem chi tiết</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sugarBox}>
            <Text style={styles.sugarValue}>
              {userData.bloodSugar.slice(-1)[0]} mmol/L
            </Text>
            <Text style={styles.date}>23/06/2025</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Cao hơn bình thường</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Medication Schedule */}
      <View style={styles.medicationCard}>
        <Text style={styles.medicationTitle}>Lịch uống thuốc hôm nay</Text>
        {medications.map((med) => (
          <View key={med.id} style={styles.medicationItem}>
            <View style={styles.medicationInfo}>
              <Text style={styles.medicationName}>
                {med.name} {med.dosage}
              </Text>
              <Text style={styles.medicationTime}>{med.time}</Text>
            </View>
            <TouchableOpacity
              style={[
                styles.medicationButton,
                med.taken && styles.medicationButtonTaken,
              ]}
              onPress={() => handleMedicationToggle(med.id)}
            >
              <Ionicons
                name={med.taken ? "checkmark-circle" : "ellipse-outline"}
                size={20}
                color={med.taken ? "#fff" : "#6366F1"}
              />
              <Text
                style={[
                  styles.medicationButtonText,
                  med.taken && styles.medicationButtonTextTaken,
                ]}
              >
                {med.taken ? "Đã uống" : "Đánh dấu"}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* AI Assistant Banner */}
      <TouchableOpacity
        style={styles.aiAssistantBanner}
        onPress={() => navigation.navigate("Assistant")}
      >
        <View style={styles.aiAssistantContent}>
          <View style={styles.aiAssistantIcon}>
            <Ionicons name="sparkles" size={24} color="#fff" />
          </View>
          <View style={styles.aiAssistantText}>
            <Text style={styles.aiAssistantTitle}>Trợ lý sức khỏe AI</Text>
            <Text style={styles.aiAssistantSubtitle}>
              Đặt câu hỏi về sức khỏe và nhận tư vấn ngay lập tức
            </Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={20} color="#fff" />
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default Home;

const styles = StyleSheet.create({
  row: {
    flexDirection: "column", // mobile hiển thị theo cột
    gap: 16,
    padding: 12,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#4F46E5",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
  },
  condition: {
    fontSize: 12,
    color: "#6b7280",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoCol: { alignItems: "center", flex: 1 },
  label: { color: "#6b7280", fontSize: 12 },
  value: { fontWeight: "500", fontSize: 14 },
  nextAppointment: {
    textAlign: "center",
    color: "#6b7280",
    fontSize: 12,
    marginTop: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontWeight: "600", fontSize: 14 },
  button: {
    borderWidth: 1,
    borderColor: "#4F46E5",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  buttonText: { fontSize: 12, color: "#4F46E5" },
  sugarBox: {
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
  },
  sugarValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2563eb",
  },
  date: { fontSize: 12, color: "#6b7280", marginBottom: 6 },
  badge: {
    backgroundColor: "#facc15",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 12, fontWeight: "500", color: "#111827" },

  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  chart: {
    borderRadius: 16,
  },
  medicationCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  medicationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  medicationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    marginBottom: 8,
  },
  medicationInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  medicationTime: {
    fontSize: 12,
    color: "#6B7280",
  },
  medicationButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#6366F1",
    gap: 6,
  },
  medicationButtonTaken: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  medicationButtonText: {
    fontSize: 12,
    color: "#6366F1",
    fontWeight: "500",
  },
  medicationButtonTextTaken: {
    color: "#fff",
  },
  quickActionsCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickActionButton: {
    width: (width - 64) / 2,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
    marginTop: 8,
    textAlign: "center",
  },
  aiAssistantBanner: {
    backgroundColor: "#6366F1",
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    overflow: "hidden",
  },
  aiAssistantContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },
  aiAssistantIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  aiAssistantText: {
    flex: 1,
  },
  aiAssistantTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  aiAssistantSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 18,
  },
});
