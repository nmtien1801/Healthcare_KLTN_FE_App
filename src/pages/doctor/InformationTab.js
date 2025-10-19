import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform
} from "react-native";
import { Edit } from "lucide-react-native";
import { useSelector } from "react-redux";
import ApiDoctor from "../../apis/ApiDoctor";
import DateTimePicker from '@react-native-community/datetimepicker';
import { listenStatusByReceiver, sendStatus } from "../../utils/SetupSignFireBase";

// Hàm format ngày (cải tiến)
const formatDate = (date) => {
  if (!date) return "";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString("vi-VN");
  } catch (error) {
    console.error("Error in formatDate:", error);
    return "";
  }
};

// ProfileHeader
const ProfileHeader = ({ doctor }) => {
  console.log("Rendering ProfileHeader with:", doctor); // Debug
  return (
    <View style={styles.card}>
      <Image
        source={{ uri: doctor.avatar }}
        style={styles.avatar}
        resizeMode="cover"
      />
      <Text style={styles.name}>{doctor.name}</Text>
      <Text style={styles.textMuted}>{doctor.specialty}</Text>
      <Text style={styles.textMuted}>{doctor.hospital}</Text>
    </View>
  );
};

// InfoSection
const InfoSection = ({ doctor, isEditing, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    fullName: doctor.basicInfo.fullName,
    email: doctor.basicInfo.email,
    phone: doctor.basicInfo.phone,
    dob: doctor.basicInfo.dob,
    specialty: doctor.professionalInfo.specialty,
    hospital: doctor.professionalInfo.hospital,
    experienceYears: doctor.professionalInfo.experienceYears,
    license: doctor.professionalInfo.license,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    formData.dob ? new Date(formData.dob.split("/").reverse().join("-")) : new Date()
  );

  // Đồng bộ formData khi doctor props thay đổi
  useEffect(() => {
    console.log("Updating formData with new doctor props:", doctor);
    setFormData({
      fullName: doctor.basicInfo.fullName,
      email: doctor.basicInfo.email,
      phone: doctor.basicInfo.phone,
      dob: doctor.basicInfo.dob,
      specialty: doctor.professionalInfo.specialty,
      hospital: doctor.professionalInfo.hospital,
      experienceYears: doctor.professionalInfo.experienceYears,
      license: doctor.professionalInfo.license,
    });
    setSelectedDate(
      doctor.basicInfo.dob
        ? new Date(doctor.basicInfo.dob.split("/").reverse().join("-"))
        : new Date()
    );
  }, [doctor]);

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleDateChange = (event, date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (event?.type === 'set' && date) {
      const formattedDate = date.toLocaleDateString("vi-VN");
      handleChange("dob", formattedDate);
      setSelectedDate(date);
    }
    if (Platform.OS === 'ios' && (event?.type === 'set' || event?.type === 'dismissed')) {
      setShowDatePicker(false);
    }
  };

  const handleWebDateChange = (event) => {
    const dateString = event.target.value;
    if (dateString) {
      const newDate = new Date(dateString);
      if (!isNaN(newDate)) {
        const formattedDate = newDate.toLocaleDateString("vi-VN");
        handleChange("dob", formattedDate);
        setSelectedDate(newDate);
      } else {
        console.error('Invalid web date input:', dateString);
      }
    }
  };

  const toggleDatePicker = () => {
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      setShowDatePicker(!showDatePicker);
    }
  };

  const handleSubmit = () => {
    const today = new Date();
    if (selectedDate > today) {
      Alert.alert("Lỗi", "Ngày sinh không thể ở tương lai.");
      return;
    }
    onSave(formData);
  };

  const fields = [
    { label: "Họ và tên", name: "fullName", keyboardType: "default" },
    { label: "Email", name: "email", keyboardType: "email-address" },
    { label: "Số điện thoại", name: "phone", keyboardType: "phone-pad" },
    { label: "Chuyên khoa", name: "specialty", keyboardType: "default" },
    { label: "Bệnh viện", name: "hospital", keyboardType: "default" },
    { label: "Số năm kinh nghiệm", name: "experienceYears", keyboardType: "numeric" },
    { label: "Số giấy phép", name: "license", keyboardType: "default" },
  ];

  console.log("Rendering InfoSection with:", doctor); // Debug
  return (
    <View style={styles.infoCard}>
      <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
      {isEditing ? (
        <>
          {fields.map((field, index) => (
            <View style={styles.formGroup} key={index}>
              <Text style={styles.label}>{field.label}</Text>
              <TextInput
                style={styles.input}
                value={formData[field.name]}
                onChangeText={(text) => handleChange(field.name, text)}
                keyboardType={field.keyboardType}
                placeholder={field.label}
                placeholderTextColor="#999"
              />
            </View>
          ))}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Ngày sinh</Text>
            <TouchableOpacity
              style={styles.datePickerContainer}
              onPress={Platform.OS === 'web' ? undefined : toggleDatePicker}
            >
              <Text style={styles.datePickerText}>
                {formData.dob || "Chọn ngày sinh"}
              </Text>
            </TouchableOpacity>
            {Platform.OS === 'web' ? (
              <input
                type="date"
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: 14,
                  backgroundColor: 'transparent',
                }}
                value={formData.dob ? new Date(formData.dob.split("/").reverse().join("-")).toISOString().split('T')[0] : ''}
                onChange={handleWebDateChange}
              />
            ) : (
              showDatePicker && (
                <DateTimePicker
                  testID="dateTimePicker"
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  locale="vi-VN"
                  style={{ backgroundColor: '#ffffff' }}
                />
              )
            )}
          </View>
          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.buttonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Lưu</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <View style={styles.infoContainer}>
          {fields.map((field, index) => (
            <View style={styles.infoRow} key={index}>
              <Text style={styles.infoLabel}>{field.label}:</Text>
              <Text style={styles.infoValue}>{formData[field.name]}</Text>
            </View>
          ))}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ngày sinh:</Text>
            <Text style={styles.infoValue}>{formData.dob}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

// SummaryCards
const SummaryCards = ({ doctor }) => {
  console.log("Rendering SummaryCards with:", doctor); // Debug
  const cards = [
    { title: "Chuyên khoa", value: doctor.professionalInfo.specialty, color: "#007bff" },
    { title: "Kinh nghiệm", value: doctor.professionalInfo.experienceYears, color: "#ffc107" },
    { title: "Bệnh viện", value: doctor.professionalInfo.hospital, color: "#28a745" },
  ];

  return (
    <View style={styles.summaryContainer}>
      {cards.map((item, index) => (
        <View key={index} style={styles.summaryCard}>
          <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
            <Text style={[styles.icon, { color: item.color }]}>📋</Text>
          </View>
          <View>
            <Text style={styles.summaryTitle}>{item.title}</Text>
            <Text style={styles.summaryValue}>{item.value}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

// Main Component
export default function DoctorProfile() {
  const [doctorData, setDoctorData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const user = useSelector((state) => state.auth.userInfo);
  const doctorUid = user?.uid;
  const patientUid = user.uid;
  const roomChats = doctorUid ? [doctorUid, patientUid].sort().join("_") : null;

  const fetchDoctorInfo = async () => {
    try {
      console.log("Fetching doctor info...");
      const res = await ApiDoctor.getDoctorInfo();
      console.log("API response:", res);
      const data = res;
      const mappedData = {
        avatar: data.userId.avatar || "",
        name: data.userId.username || "Unknown",
        specialty: `Bác sĩ chuyên khoa ${data.specialty || "Nội tiết"}`,
        hospital: data.hospital || "",
        basicInfo: {
          fullName: data.userId.username || "",
          email: data.userId.email || "",
          phone: data.userId.phone || "",
          dob: formatDate(data.userId.dob) || "",
        },
        professionalInfo: {
          specialty: data.specialty || "Nội tiết",
          hospital: data.hospital || "",
          experienceYears: `${data.exp || 0} năm`,
          license: data.giay_phep || "",
        },
        _timestamp: Date.now(), // Buộc re-render
      };
      console.log("Mapped data:", mappedData);
      setDoctorData(mappedData);
    } catch (error) {
      console.error("Lỗi khi fetch doctor info:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedData) => {
    try {
      console.log("Saving updated data:", updatedData);
      await ApiDoctor.updateDoctor({
        username: updatedData.fullName,
        email: updatedData.email,
        phone: updatedData.phone,
        dob: updatedData.dob.split("/").reverse().join("-"),
        hospital: updatedData.hospital,
        exp: parseInt(updatedData.experienceYears, 10) || 0,
        giay_phep: updatedData.license,
      });

      if (doctorUid) {
        console.log("Sending status to room:", roomChats);
        sendStatus(doctorUid, patientUid, "update_info");
      } else {
        console.error("Cannot send status: doctorUid is undefined");
      }

      setDoctorData((prevData) => {
        const newData = {
          ...prevData,
          basicInfo: {
            ...prevData.basicInfo,
            fullName: updatedData.fullName,
            email: updatedData.email,
            phone: updatedData.phone,
            dob: updatedData.dob,
          },
          professionalInfo: {
            ...prevData.professionalInfo,
            specialty: updatedData.specialty,
            hospital: updatedData.hospital,
            experienceYears: updatedData.experienceYears,
            license: updatedData.license,
          },
          name: updatedData.fullName,
          specialty: `Bác sĩ chuyên khoa ${updatedData.specialty}`,
          hospital: updatedData.hospital,
          _timestamp: Date.now(), // Buộc re-render
        };
        console.log("Updated doctorData:", newData);
        return newData;
      });

      setIsEditing(false);
    } catch (error) {
      console.error("Lỗi khi cập nhật doctor info:", error);
      Alert.alert("Lỗi", "Cập nhật thông tin thất bại!");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  // Lắng nghe tín hiệu realtime từ Firebase
  useEffect(() => {
    if (!doctorUid || !roomChats) {
      setLoading(false);
      return;
    }
    fetchDoctorInfo();
    const unsub = listenStatusByReceiver(doctorUid, async (signal) => {
      const statusCode = [
        "update_info",
      ];

      if (statusCode.includes(signal?.status)) {
        await fetchDoctorInfo();
      }
    });

    return () => unsub();
  }, [doctorUid]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!doctorData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không có dữ liệu bác sĩ.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <ProfileHeader doctor={doctorData} />
      <InfoSection
        doctor={doctorData}
        isEditing={isEditing}
        onSave={handleSave}
        onCancel={handleCancel}
      />
      {!isEditing && (
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => setIsEditing(true)}
        >
          <Edit color="#fff" size={18} />
          <Text style={styles.buttonText}>Chỉnh sửa thông tin</Text>
        </TouchableOpacity>
      )}
      <SummaryCards doctor={doctorData} />
    </ScrollView>
  );
}

// Styles giữ nguyên
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    marginTop: 12,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    alignItems: "center",
    marginTop: 46,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#e9ecef",
  },
  name: {
    fontSize: 22,
    fontWeight: "700",
    color: "#212529",
  },
  textMuted: {
    fontSize: 16,
    color: "#6c757d",
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
  },
  cancelButton: {
    backgroundColor: "#6c757d",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  infoContainer: {
    flexDirection: "column",
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: "#212529",
    flex: 2,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 16,
  },
  summaryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    flex: 1,
    minWidth: 150,
    marginBottom: 12,
  },
  iconContainer: {
    padding: 12,
    borderRadius: 12,
    marginRight: 16,
  },
  icon: {
    fontSize: 24,
  },
  summaryTitle: {
    fontSize: 14,
    color: "#6c757d",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    flexWrap: "wrap",
    flexShrink: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: "#495057",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  errorText: {
    fontSize: 16,
    color: "#dc3545",
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  datePickerText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
});