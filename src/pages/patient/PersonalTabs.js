import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform
} from "react-native";
import { Camera, ChevronDown } from "lucide-react-native";
import { useSelector, useDispatch } from "react-redux";
import { getPatientById } from '../../redux/patientSlice';

const PersonalTabs = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.userInfo);
  const patient = useSelector((state) => state.patient.patient);
  const loading = useSelector((state) => state.patient.loading);

  const [formData, setFormData] = useState({
    username: user?.username || "",
    dob: user?.dob || "",
    gender: user?.gender || "Nam",
    phone: user?.phone || "",
    email: user?.email || "",
    address: user?.address || "",
  });

  const [showGenderPicker, setShowGenderPicker] = useState(false);

  useEffect(() => {
    const fetchPatient = async () => {
      if (user?.userId) {
        await dispatch(getPatientById(user.userId));
      }
    };

    fetchPatient();
  }, [dispatch, user?.userId]);

  // Update formData when user data changes
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        dob: user.dob || "",
        gender: user.gender || "Nam",
        phone: user.phone || "",
        email: user.email || "",
        address: user.address || "",
      });
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateInfo = () => {
    console.log("Cập nhật thông tin:", formData);
    // Dispatch action to update user info
    // dispatch(updateUserInfo(formData));
  };

  // Format date for display (DD/MM/YYYY)
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const selectGender = (gender) => {
    handleInputChange('gender', gender);
    setShowGenderPicker(false);
  };

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        
        {/* Hồ sơ cá nhân */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hồ sơ cá nhân</Text>
          <View style={styles.profileCard}>
            <Image
              source={{ 
                uri: user?.avatar || "https://images.pexels.com/photos/5452293/pexels-photo-5452293.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face" 
              }}
              style={styles.avatar}
            />
            <Text style={styles.username}>{user?.username || "Tên người dùng"}</Text>
            <TouchableOpacity style={styles.changePhotoButton}>
              <Camera size={16} color="#4F46E5" />
              <Text style={styles.changePhotoText}>Thay đổi ảnh</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Thông tin cá nhân */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin cá nhân</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Họ và tên</Text>
            <TextInput
              style={styles.input}
              value={formData.username}
              onChangeText={(value) => handleInputChange('username', value)}
              placeholder="Nhập họ và tên"
            />
          </View>

          <View style={styles.row}>
            <View style={styles.halfWidth}>
              <Text style={styles.label}>Ngày sinh</Text>
              <TextInput
                style={styles.input}
                value={formatDateForDisplay(formData.dob)}
                placeholder="DD/MM/YYYY"
                editable={false}
              />
            </View>

            <View style={styles.halfWidth}>
              <Text style={styles.label}>Giới tính</Text>
              <TouchableOpacity 
                style={styles.pickerButton}
                onPress={() => setShowGenderPicker(!showGenderPicker)}
              >
                <Text style={styles.pickerText}>{formData.gender}</Text>
                <ChevronDown size={16} color="#94A3B8" />
              </TouchableOpacity>
              
              {showGenderPicker && (
                <View style={styles.pickerOptions}>
                  {['Nam', 'Nữ', 'Khác'].map((gender) => (
                    <TouchableOpacity
                      key={gender}
                      style={styles.pickerOption}
                      onPress={() => selectGender(gender)}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        formData.gender === gender && styles.pickerOptionTextActive
                      ]}>
                        {gender}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Số điện thoại</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              placeholder="Nhập số điện thoại"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="Nhập email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Địa chỉ</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.address}
              onChangeText={(value) => handleInputChange('address', value)}
              placeholder="Nhập địa chỉ"
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity 
            style={styles.updateButton}
            onPress={handleUpdateInfo}
            activeOpacity={0.8}
          >
            <Text style={styles.updateButtonText}>Cập nhật thông tin</Text>
          </TouchableOpacity>
        </View>

        {/* Thông tin bệnh án */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Thông tin bệnh án</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4F46E5" />
            </View>
          ) : patient ? (
            <View style={styles.medicalInfo}>
              
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Chẩn đoán</Text>
                  <Text style={styles.infoValue}>
                    {patient.disease || "Chưa có thông tin"}
                  </Text>
                </View>
                <View style={styles.infoItemRight}>
                  <Text style={styles.infoLabel}>Cập nhật</Text>
                  <Text style={styles.infoValue}>
                    {formatDateForDisplay(patient.updatedAt)}
                  </Text>
                </View>
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Dị ứng</Text>
                <Text style={styles.infoValue}>
                  {patient.allergies || "Không có"}
                </Text>
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Ghi chú</Text>
                <Text style={styles.infoValue}>
                  {patient.notes || "Không có ghi chú"}
                </Text>
              </View>

            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Chưa có thông tin bệnh án</Text>
            </View>
          )}
        </View>

      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  content: {
    padding: 20,
    gap: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: "#4F46E5",
    marginBottom: 8,
  },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    color: "#1F2937",
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  changePhotoText: {
    color: "#4F46E5",
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: "#4F46E5",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#1F2937",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
  },
  pickerButton: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  pickerText: {
    fontSize: 14,
    color: "#1F2937",
  },
  pickerOptions: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pickerOption: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  pickerOptionText: {
    fontSize: 14,
    color: "#6B7280",
  },
  pickerOptionTextActive: {
    color: "#4F46E5",
    fontWeight: '600',
  },
  updateButton: {
    backgroundColor: "#4F46E5",
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  updateButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  medicalInfo: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 12,
  },
  infoItem: {
    flex: 1,
  },
  infoItemRight: {
    alignItems: 'flex-end',
  },
  infoBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: "#94A3B8",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: "#1F2937",
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 14,
  },
});

export default PersonalTabs;