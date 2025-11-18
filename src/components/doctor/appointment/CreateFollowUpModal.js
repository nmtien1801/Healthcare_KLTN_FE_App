import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import ApiBooking from "../../../apis/ApiBooking";
import { book_appointment } from "../../../apis/assistant";
import { sendStatus } from "../../../utils/SetupSignFireBase";
import ApiNotification from "../../../apis/ApiNotification";
import {
  getBalanceService,
  withdrawService,
} from "../../../apis/paymentService";
import { EXPO_PUBLIC_BOOKING_FEE} from '@env';

const CreateFollowUpModal = ({ visible, onClose, patient, onSave }) => {
  const user = useSelector((state) => state.auth.userInfo);

  const [formData, setFormData] = useState({
    date: null,
    time: "",
    type: "onsite",
    reason: "",
    notes: "",
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimeList, setShowTimeList] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Trạng thái modal thông báo
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Lưu response để gọi lại onSave sau khi người dùng bấm Đóng
  const [successResponse, setSuccessResponse] = useState(null);

  const toggleDatePicker = () => setShowDatePicker((prev) => !prev);

  const getDateString = (date) => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  const handleWebDateChange = (e) => {
    const selectedDate = new Date(e.target.value);
    setFormData((prev) => ({ ...prev, date: selectedDate }));
  };

  // Danh sách giờ
  const availableTimes = [];
  for (let hour = 8; hour <= 16; hour++) {
    const h = hour.toString().padStart(2, "0");
    if (hour === 12) {
      availableTimes.push(`${h}:00`);
      continue;
    }
    availableTimes.push(`${h}:00`);
    availableTimes.push(`${h}:30`);
  }

  const handleSubmit = async () => {
    if (!formData.date || !formData.time) {
      setError("Vui lòng chọn ngày và giờ tái khám.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const formattedDate = formData.date.toISOString().split("T")[0];
      const formattedTime = formData.time;
      const fullDateTime = `${formattedDate}T${formattedTime}`;

      const response = await ApiBooking.createFollowUpAppointment({
        firebaseUid: user.uid,
        patientId: patient.id,
        date: formattedDate,
        time: formattedTime,
        type: formData.type,
        reason: formData.reason,
        notes: formData.notes,
      });

      await ApiNotification.createNotification({
        receiverId: patient.uid,
        title: "Bác sĩ đặt lịch tái khám",
        content: `Bác sĩ ${
          user.username || ""
        } đã đặt lịch tái khám vào ${formattedDate} lúc ${formattedTime}.`,
        type: "system",
        avatar: user.avatar || "",
      });

      await sendStatus(user?.uid, patient.uid, "Đặt lịch");

      await book_appointment.post("/create-calendar-schedule", {
        email_Patient: patient.email,
        email_Docter: user.email,
        period: 30,
        time: fullDateTime,
        location: formData.type,
      });

      // trừ phí đặt lịch
      await withdrawService(patient.userId, BOOKING_FEE);
      
      setSuccessMessage(
        `Đặt lịch tái khám thành công với bệnh nhân ${patient.name} vào ${formattedDate} lúc ${formattedTime}!`
      );
      setSuccessResponse(response);
      setShowSuccessModal(true);
    } catch (err) {
      const msg = err.message || "Không thể tạo lịch, vui lòng thử lại.";
      setErrorMessage(msg);
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView>
            <Text style={styles.title}>Tạo Lịch Hẹn Tái Khám</Text>

            {/* Bệnh nhân */}
            <Text style={styles.label}>Bệnh nhân</Text>
            <TextInput
              value={patient?.name || ""}
              editable={false}
              style={[styles.input, { backgroundColor: "#eee" }]}
            />

            {/* Ngày tái khám */}
            <Text style={styles.label}>Ngày tái khám</Text>
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
                  value={getDateString(formData.date)}
                  onChange={handleWebDateChange}
                  min={getDateString(new Date())}
                  max={getDateString(
                    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                  )}
                />
              ) : (
                <Text style={styles.datePickerText}>
                  {formData.date
                    ? formData.date.toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                    : "Chọn ngày"}
                </Text>
              )}
            </TouchableOpacity>

            {showDatePicker && Platform.OS !== "web" && (
              <DateTimePicker
                mode="date"
                value={formData.date || new Date()}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (event.type === "set") {
                    setFormData((prev) => ({
                      ...prev,
                      date: selectedDate,
                    }));
                  }
                }}
                minimumDate={new Date()}
                maximumDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
              />
            )}

            {/* Giờ tái khám */}
            <Text style={styles.label}>Giờ tái khám</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowTimeList(!showTimeList)}
            >
              <Text>{formData.time || "-- Chọn giờ --"}</Text>
            </TouchableOpacity>

            {showTimeList && (
              <View style={styles.timeList}>
                <ScrollView nestedScrollEnabled>
                  {availableTimes.map((time) => (
                    <TouchableOpacity
                      key={time}
                      onPress={() => {
                        setFormData((prev) => ({
                          ...prev,
                          time,
                        }));
                        setShowTimeList(false);
                      }}
                      style={[
                        styles.timeItem,
                        formData.time === time && {
                          backgroundColor: "#e9ecef",
                        },
                      ]}
                    >
                      <Text>{time}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Loại lịch hẹn */}
            <Text style={styles.label}>Loại lịch hẹn</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  formData.type === "onsite" && styles.typeActive,
                ]}
                onPress={() =>
                  setFormData((prev) => ({ ...prev, type: "onsite" }))
                }
              >
                <Text>Tại phòng khám</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  formData.type === "online" && styles.typeActive,
                ]}
                onPress={() =>
                  setFormData((prev) => ({ ...prev, type: "online" }))
                }
              >
                <Text>Trực tuyến</Text>
              </TouchableOpacity>
            </View>

            {/* Lý do */}
            <Text style={styles.label}>Lý do tái khám</Text>
            <TextInput
              multiline
              value={formData.reason}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, reason: text }))
              }
              style={[styles.input, { height: 80 }]}
              placeholder="Nhập lý do tái khám..."
            />

            {/* Ghi chú */}
            <Text style={styles.label}>Ghi chú</Text>
            <TextInput
              multiline
              value={formData.notes}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, notes: text }))
              }
              style={[styles.input, { height: 80 }]}
              placeholder="Nhập ghi chú (nếu có)..."
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.button, { backgroundColor: "#ccc" }]}
              >
                <Text>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isSubmitting}
                style={[styles.button, styles.buttonPrimary]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={{ color: "#fff" }}>Tạo lịch</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* 🎉 Modal Thành công */}
          <Modal transparent visible={showSuccessModal} animationType="fade">
            <View style={styles.centeredView}>
              <View style={styles.alertBoxSuccess}>
                <Text style={styles.alertTitle}>🎉 Thành công!</Text>
                <Text style={styles.alertMessage}>{successMessage}</Text>
                <TouchableOpacity
                  style={[styles.alertButton, { backgroundColor: "#28a745" }]}
                  onPress={() => {
                    setShowSuccessModal(false);
                    if (successResponse) onSave(successResponse);
                    onClose();
                  }}
                >
                  <Text style={styles.alertButtonText}>Đóng</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* ⚠️ Modal Lỗi */}
          <Modal transparent visible={showErrorModal} animationType="fade">
            <View style={styles.centeredView}>
              <View style={styles.alertBoxError}>
                <Text style={styles.alertTitle}>⚠️ Lỗi</Text>
                <Text style={styles.alertMessage}>{errorMessage}</Text>
                <TouchableOpacity
                  style={[styles.alertButton, { backgroundColor: "#dc3545" }]}
                  onPress={() => setShowErrorModal(false)}
                >
                  <Text style={styles.alertButtonText}>Đóng</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxHeight: "90%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 12,
  },
  label: { fontWeight: "500", marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    marginTop: 5,
  },
  datePickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
  },
  datePickerText: { flex: 1, fontSize: 14 },
  pickerButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
  },
  timeList: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    maxHeight: 200,
    marginTop: 5,
    overflow: "hidden",
  },

  timeItem: { padding: 8 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  typeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    margin: 3,
  },
  typeActive: { backgroundColor: "#e0f0ff", borderColor: "#007bff" },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 20,
  },
  button: {
    padding: 10,
    borderRadius: 8,
    marginLeft: 10,
    minWidth: 90,
    alignItems: "center",
  },
  buttonPrimary: { backgroundColor: "#007bff" },
  errorText: { color: "red", marginTop: 10 },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  alertBoxSuccess: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  alertBoxError: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "80%",
    alignItems: "center",
  },
  alertTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  alertMessage: { fontSize: 14, textAlign: "center", marginBottom: 15 },
  alertButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 6 },
  alertButtonText: { color: "#fff", fontWeight: "600" },
});

export default CreateFollowUpModal;
