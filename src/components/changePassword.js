import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Modal,
  Pressable,
  Animated,
} from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { changePassword } from "../redux/authSlice";
import {
  Eye,
  EyeOff,
  Lock,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react-native";

const ChangePassword = ({ toggleModalChangePassword }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [slideAnim] = useState(new Animated.Value(500));
  const user = useSelector((state) => state.auth.userInfo);

  React.useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, []);

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
    if (serverError) {
      setServerError("");
    }
  };

  const validateForm = () => {
    let tempErrors = {};
    if (!formData.currentPassword) {
      tempErrors.currentPassword = "Vui lòng nhập mật khẩu hiện tại";
    }
    if (!formData.newPassword) {
      tempErrors.newPassword = "Vui lòng nhập mật khẩu mới";
    } else if (formData.newPassword.length < 6) {
      tempErrors.newPassword = "Mật khẩu mới phải có ít nhất 6 ký tự";
    }
    if (formData.newPassword !== formData.confirmPassword) {
      tempErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }
    if (
      formData.newPassword === formData.currentPassword &&
      formData.currentPassword
    ) {
      tempErrors.newPassword = "Mật khẩu mới không được trùng với mật khẩu cũ";
    }
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      setIsLoading(true);
      try {
        let res = await dispatch(
          changePassword({
            email: user.email,
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword,
          })
        );
        if (res.payload.EC !== 0) {
          setServerError(res.payload.EM);
        } else {
          Alert.alert("Thành công", "Đổi mật khẩu thành công");
          handleClose();
        }
      } catch (error) {
        console.error("Error changing password:", error);
        setServerError("Đã xảy ra lỗi khi đổi mật khẩu");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: 500,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      toggleModalChangePassword();
    });
  };

  return (
    <Modal
      visible={true}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <Animated.View
          style={[
            styles.panel,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconContainer}>
                <Lock size={20} color="#007bff" />
              </View>
              <Text style={styles.headerTitle}>Đổi mật khẩu</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              disabled={isLoading}
            >
              <X size={20} color="#6c757d" />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Info Alert */}
            <View style={styles.infoAlert}>
              <CheckCircle2 size={14} color="#0d6efd" />
              <Text style={styles.infoText}>
                Mật khẩu mới phải có ít nhất 6 ký tự và khác với mật khẩu hiện
                tại
              </Text>
            </View>

            {/* Server Error */}
            {serverError ? (
              <View style={styles.errorAlert}>
                <X size={14} color="#dc3545" />
                <Text style={styles.errorText}>{serverError}</Text>
              </View>
            ) : null}

            {/* Mật khẩu hiện tại */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Mật khẩu hiện tại <Text style={styles.required}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  errors.currentPassword && styles.inputError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  secureTextEntry={!showPasswords.current}
                  value={formData.currentPassword}
                  onChangeText={(value) =>
                    handleChange("currentPassword", value)
                  }
                  placeholder="Nhập mật khẩu hiện tại"
                  placeholderTextColor="#adb5bd"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => togglePasswordVisibility("current")}
                  style={styles.eyeButton}
                  disabled={isLoading}
                >
                  {showPasswords.current ? (
                    <EyeOff size={18} color="#6c757d" />
                  ) : (
                    <Eye size={18} color="#6c757d" />
                  )}
                </TouchableOpacity>
              </View>
              {errors.currentPassword ? (
                <Text style={styles.errorMessage}>
                  {errors.currentPassword}
                </Text>
              ) : null}
            </View>

            {/* Mật khẩu mới */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Mật khẩu mới <Text style={styles.required}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  errors.newPassword && styles.inputError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  secureTextEntry={!showPasswords.new}
                  value={formData.newPassword}
                  onChangeText={(value) => handleChange("newPassword", value)}
                  placeholder="Nhập mật khẩu mới"
                  placeholderTextColor="#adb5bd"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => togglePasswordVisibility("new")}
                  style={styles.eyeButton}
                  disabled={isLoading}
                >
                  {showPasswords.new ? (
                    <EyeOff size={18} color="#6c757d" />
                  ) : (
                    <Eye size={18} color="#6c757d" />
                  )}
                </TouchableOpacity>
              </View>
              {errors.newPassword ? (
                <Text style={styles.errorMessage}>{errors.newPassword}</Text>
              ) : null}
              {formData.newPassword && !errors.newPassword ? (
                <View style={styles.successMessage}>
                  <CheckCircle2 size={12} color="#198754" />
                  <Text style={styles.successText}>Mật khẩu hợp lệ</Text>
                </View>
              ) : null}
            </View>

            {/* Xác nhận mật khẩu */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Xác nhận mật khẩu mới <Text style={styles.required}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  errors.confirmPassword && styles.inputError,
                ]}
              >
                <TextInput
                  style={styles.input}
                  secureTextEntry={!showPasswords.confirm}
                  value={formData.confirmPassword}
                  onChangeText={(value) =>
                    handleChange("confirmPassword", value)
                  }
                  placeholder="Nhập lại mật khẩu mới"
                  placeholderTextColor="#adb5bd"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => togglePasswordVisibility("confirm")}
                  style={styles.eyeButton}
                  disabled={isLoading}
                >
                  {showPasswords.confirm ? (
                    <EyeOff size={18} color="#6c757d" />
                  ) : (
                    <Eye size={18} color="#6c757d" />
                  )}
                </TouchableOpacity>
              </View>
              {errors.confirmPassword ? (
                <Text style={styles.errorMessage}>
                  {errors.confirmPassword}
                </Text>
              ) : null}
              {formData.confirmPassword &&
              formData.newPassword === formData.confirmPassword ? (
                <View style={styles.successMessage}>
                  <CheckCircle2 size={12} color="#198754" />
                  <Text style={styles.successText}>Mật khẩu khớp</Text>
                </View>
              ) : null}
            </View>

            {/* Buttons */}
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleClose}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.submitButton,
                  isLoading && styles.buttonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={styles.submitButtonText}>Đang xử lý...</Text>
                  </View>
                ) : (
                  <View style={styles.loadingContainer}>
                    <CheckCircle2 size={16} color="#fff" />
                    <Text style={styles.submitButtonText}>Lưu thay đổi</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  panel: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "90%",
    maxWidth: 450,
    height: "100%",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#dee2e6",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    backgroundColor: "rgba(13, 110, 253, 0.1)",
    borderRadius: 20,
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212529",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e9ecef",
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
  },
  infoAlert: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#e7f3ff",
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#084298",
    lineHeight: 18,
  },
  errorAlert: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f8d7da",
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: "#842029",
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
    color: "#212529",
  },
  required: {
    color: "#dc3545",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 6,
    backgroundColor: "#fff",
    height: 45,
    paddingHorizontal: 16,
  },
  inputError: {
    borderColor: "#dc3545",
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#212529",
    paddingRight: 8,
  },
  eyeButton: {
    padding: 8,
    marginLeft: 4,
  },
  errorMessage: {
    fontSize: 13,
    color: "#dc3545",
    marginTop: 4,
  },
  successMessage: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  successText: {
    fontSize: 13,
    color: "#198754",
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 8,
    marginTop: 24,
  },
  button: {
    flex: 1,
    height: 45,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#6c757d",
  },
  cancelButtonText: {
    color: "#6c757d",
    fontSize: 15,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#0d6efd",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});

export default ChangePassword;
