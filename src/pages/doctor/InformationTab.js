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
} from "react-native";
import { Edit } from "lucide-react-native";
import ApiDoctor from "../../apis/ApiDoctor";

// Hàm format ngày
const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return d.toLocaleDateString("vi-VN"); // DD/MM/YYYY
};

// Component ProfileHeader
const ProfileHeader = ({ doctor }) => (
  <View style={styles.card}>
    <Image
      source={{ uri: doctor.avatar }}
      style={styles.avatar}
    />
    <Text style={styles.name}>{doctor.name}</Text>
    <Text style={styles.textMuted}>{doctor.specialty}</Text>
    <Text style={styles.textMuted}>{doctor.hospital}</Text>
  </View>
);

// Component InfoSection
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

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <View>
      <Text style={styles.sectionTitle}>Thông tin cá nhân và chuyên môn</Text>
      {isEditing ? (
        <View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Họ và tên</Text>
            <TextInput
              style={styles.input}
              value={formData.fullName}
              onChangeText={(text) => handleChange("fullName", text)}
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => handleChange("email", text)}
              keyboardType="email-address"
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Số điện thoại</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text) => handleChange("phone", text)}
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Ngày sinh (DD/MM/YYYY)</Text>
            <TextInput
              style={styles.input}
              value={formData.dob}
              onChangeText={(text) => handleChange("dob", text)}
              placeholder="DD/MM/YYYY"
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Chuyên khoa</Text>
            <TextInput
              style={styles.input}
              value={formData.specialty}
              onChangeText={(text) => handleChange("specialty", text)}
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Bệnh viện</Text>
            <TextInput
              style={styles.input}
              value={formData.hospital}
              onChangeText={(text) => handleChange("hospital", text)}
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Số năm kinh nghiệm</Text>
            <TextInput
              style={styles.input}
              value={formData.experienceYears}
              onChangeText={(text) => handleChange("experienceYears", text)}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Số giấy phép</Text>
            <TextInput
              style={styles.input}
              value={formData.license}
              onChangeText={(text) => handleChange("license", text)}
            />
          </View>
          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.buttonText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
              <Text style={styles.buttonText}>Lưu</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.infoContainer}>
          <View style={styles.infoColumn}>
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Họ và tên: </Text>
              {doctor.basicInfo.fullName}
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Email: </Text>
              {doctor.basicInfo.email}
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Số điện thoại: </Text>
              {doctor.basicInfo.phone}
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Ngày sinh: </Text>
              {doctor.basicInfo.dob}
            </Text>
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Chuyên khoa: </Text>
              {doctor.professionalInfo.specialty}
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Bệnh viện: </Text>
              {doctor.professionalInfo.hospital}
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Số năm kinh nghiệm: </Text>
              {doctor.professionalInfo.experienceYears}
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.infoLabel}>Số giấy phép: </Text>
              {doctor.professionalInfo.license}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

// Component SummaryCards
const SummaryCards = ({ doctor }) => {
  const cards = [
    { title: "Chuyên khoa", value: doctor.professionalInfo.specialty, color: "#007bff" },
    { title: "Bệnh viện", value: doctor.professionalInfo.hospital, color: "#28a745" },
    { title: "Kinh nghiệm", value: doctor.professionalInfo.experienceYears, color: "#ffc107" },
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

// Component chính DoctorProfile
export default function DoctorProfile() {
  const [doctorData, setDoctorData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctorInfo = async () => {
      try {
        const res = await ApiDoctor.getDoctorInfo();
        const data = res;

        const mappedData = {
          avatar: data.userId.avatar,
          name: data.userId.username,
          specialty: `Bác sĩ chuyên khoa ${data.specialty || "Nội tiết"}`,
          hospital: data.hospital,
          basicInfo: {
            fullName: data.userId.username,
            email: data.userId.email,
            phone: data.userId.phone,
            dob: formatDate(data.userId.dob),
          },
          professionalInfo: {
            specialty: data.specialty || "Nội tiết",
            hospital: data.hospital,
            experienceYears: `${data.exp} năm`,
            license: data.giay_phep,
          },
        };

        setDoctorData(mappedData);
      } catch (error) {
        console.error("Lỗi khi fetch doctor info:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorInfo();
  }, []);

  const handleSave = async (updatedData) => {
    try {
      await ApiDoctor.updateDoctor({
        username: updatedData.fullName,
        email: updatedData.email,
        phone: updatedData.phone,
        dob: updatedData.dob.split("/").reverse().join("-"),
        hospital: updatedData.hospital,
        exp: parseInt(updatedData.experienceYears, 10),
        giay_phep: updatedData.license,
      });

      setDoctorData((prevData) => ({
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
      }));

      setIsEditing(false);
    } catch (error) {
      console.error("Lỗi khi cập nhật doctor info:", error);
      Alert.alert("Lỗi", "Cập nhật thông tin thất bại!");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
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
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Thông tin cá nhân</Text>
      <ProfileHeader doctor={doctorData} />
      <View style={styles.card}>
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
            <Edit color="#fff" size={16} />
            <Text style={styles.buttonText}>Chỉnh sửa thông tin</Text>
          </TouchableOpacity>
        )}
      </View>
      <SummaryCards doctor={doctorData} />
    </ScrollView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
  },
  textMuted: {
    fontSize: 16,
    color: "#6c757d",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  formGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 4,
    padding: 8,
    fontSize: 16,
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
  },
  cancelButton: {
    backgroundColor: "#6c757d",
    padding: 10,
    borderRadius: 4,
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  infoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoColumn: {
    flex: 1,
    paddingHorizontal: 8,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 8,
  },
  infoLabel: {
    fontWeight: "600",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 4,
    marginTop: 16,
  },
  summaryContainer: {
    flexDirection: "column",
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    padding: 12,
    borderRadius: 50,
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  summaryTitle: {
    fontSize: 14,
    color: "#6c757d",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#dc3545",
  },
});