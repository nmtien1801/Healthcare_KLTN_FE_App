import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useDispatch, useSelector } from "react-redux";
import { api } from "../../../apis/assistant";

const FormPatient = () => {
  const currentYear = new Date().getFullYear();
  const dispatch = useDispatch();
  let user = useSelector((state) => state.auth.userInfo);

  const [formData, setFormData] = useState({
    year: currentYear,
    gender: "female",
    age: 45,
    location: "Việt Nam",
    race_AfricanAmerican: 0,
    race_Asian: 0,
    race_Caucasian: 1,
    race_Hispanic: 0,
    race_Other: 0,
    hypertension: 0,
    heart_disease: 0,
    smoking_history: "current",
    bmi: 28.4,
    hbA1c_level: 6.2,
    blood_glucose_level: 125,
  });

 
  const [loading, setLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);

  const handleInputChange = (name, value) => {
    const formattedValue = value
      .replace(/[^0-9.]/g, "") // chỉ giữ số và dấu chấm
      .replace(/(\..*)\./g, "$1"); // ngăn nhập nhiều dấu chấm

    setFormData((prev) => ({
      ...prev,
      [name]:
        typeof formattedValue === "string" && !isNaN(formattedValue)
          ? Number(formattedValue)
          : formattedValue,
    }));
  };

  const handleSwitchChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value ? 1 : 0,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);

    const dataToSend = {
      ...formData,
      bmi: parseFloat(formData.bmi),
      hbA1c_level: parseFloat(formData.hbA1c_level),
      blood_glucose_level: parseFloat(formData.blood_glucose_level),
    };

    // Chuẩn bị phần mô tả hồ sơ bệnh nhân giống bản web
    const infoText = `
Hồ sơ bệnh nhân:    
▸ Tuổi: ${formData.age}
▸ Giới tính: ${formData.gender === "female" ? "Nữ" : "Nam"}
▸ Khu vực: ${formData.location}
▸ Huyết áp cao: ${formData.hypertension ? "Có" : "Không"}
▸ Bệnh tim: ${formData.heart_disease ? "Có" : "Không"}
▸ Hút thuốc: ${formData.smoking_history === "never" ? "Không" : "Có"}
▸ BMI: ${formData.bmi}
▸ HbA1c: ${formData.hbA1c_level}%
▸ Đường huyết: ${formData.blood_glucose_level} mg/dL
`;

    try {
      const res = await api.post("/predict", dataToSend);
      const prediction =
        res.data.prediction === 1
          ? "Có nguy cơ tiểu đường"
          : "Không có nguy cơ tiểu đường";
      const probability = res.data.probability.toFixed(2);
      const diagnosis = res.data.diagnosis || "Không có thông tin";

      const botMsg = `
🔍 Kết quả: ${prediction}
📊 Xác suất: ${probability}%
🩺 Chẩn đoán: ${diagnosis}
────────────────────────────
👉 Lưu ý: Kết quả chỉ mang tính hỗ trợ tham khảo. 
Vui lòng trao đổi thêm với bác sĩ để được tư vấn và chẩn đoán chính xác.
`;

      // Gộp hiển thị cả hồ sơ và kết quả vào Alert
      Alert.alert("Kết quả Dự đoán", `${infoText}\n${botMsg}`);
    } catch (err) {
      console.error(err);
      Alert.alert("Lỗi", "⚠️ Có lỗi xảy ra. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏥 Thông tin bệnh nhân</Text>
      </View>

      <View style={styles.formContainer}>
        {/* Age and Gender Row */}
        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Text style={styles.label}>Tuổi</Text>
            <TextInput
              style={styles.input}
              value={formData.age.toString()}
              onChangeText={(value) => handleInputChange("age", value)}
              keyboardType="numeric"
              placeholder="Nhập tuổi"
            />
          </View>
          <View style={styles.halfWidth}>
            <Text style={styles.label}>Giới tính</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.gender}
                style={styles.picker}
                onValueChange={(value) => handleInputChange("gender", value)}
              >
                <Picker.Item label="Nữ" value="female" />
                <Picker.Item label="Nam" value="male" />
              </Picker>
            </View>
          </View>
        </View>

        {/* BMI, HbA1c, Blood Glucose Row */}
        <View style={styles.row}>
          <View style={styles.thirdWidth}>
            <Text style={styles.label}>BMI</Text>
            <TextInput
              style={styles.input}
              value={formData.bmi.toString()}
              onChangeText={(value) => handleInputChange("bmi", value)}
              keyboardType="decimal-pad"
              inputMode="decimal"
              placeholder="BMI"
            />
          </View>
          <View style={styles.thirdWidth}>
            <Text style={styles.label}>HbA1c (%)</Text>
            <TextInput
              style={styles.input}
              value={formData.hbA1c_level.toString()}
              onChangeText={(value) => handleInputChange("hbA1c_level", value)}
              keyboardType="decimal-pad"
              inputMode="decimal"
              placeholder="HbA1c"
            />
          </View>
          <View style={styles.thirdWidth}>
            <Text style={styles.label}>Đường huyết</Text>
            <TextInput
              style={styles.input}
              value={formData.blood_glucose_level.toString()}
              onChangeText={(value) =>
                handleInputChange("blood_glucose_level", value)
              }
              keyboardType="numeric"
              inputMode="decimal"
              placeholder="mg/dL"
            />
          </View>
        </View>

        {/* Medical History Switches */}
        <View style={styles.switchContainer}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Huyết áp cao</Text>
            <Switch
              value={formData.hypertension === 1}
              onValueChange={(value) =>
                handleSwitchChange("hypertension", value)
              }
              trackColor={{ false: "#E5E7EB", true: "#60A5FA" }}
              thumbColor={formData.hypertension === 1 ? "#2563EB" : "#9CA3AF"}
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Bệnh tim</Text>
            <Switch
              value={formData.heart_disease === 1}
              onValueChange={(value) =>
                handleSwitchChange("heart_disease", value)
              }
              trackColor={{ false: "#E5E7EB", true: "#60A5FA" }}
              thumbColor={formData.heart_disease === 1 ? "#2563EB" : "#9CA3AF"}
            />
          </View>
        </View>

        {/* Smoking History */}
        <View style={styles.fullWidth}>
          <Text style={styles.label}>Lịch sử hút thuốc</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.smoking_history}
              style={styles.picker}
              onValueChange={(value) =>
                handleInputChange("smoking_history", value)
              }
            >
              <Picker.Item label="Không bao giờ" value="never" />
              <Picker.Item label="Từng hút" value="ever" />
              <Picker.Item label="Hiện tại" value="current" />
            </Picker>
          </View>
        </View>

        {/* Prediction Result */}
        {predictionResult && (
          <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>📊 Kết quả dự đoán</Text>
            <Text style={styles.resultText}>{predictionResult.prediction}</Text>
            <Text style={styles.resultProbability}>
              Xác suất: {predictionResult.probability}%
            </Text>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.submitButtonText}>🔍 Dự đoán nguy cơ</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
  },
  formContainer: {
    padding: 20,
    paddingTop: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  halfWidth: {
    width: "48%",
  },
  thirdWidth: {
    width: "32%",
  },
  fullWidth: {
    width: "100%",
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: "white",
    color: "#1F2937",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    backgroundColor: "white",
    overflow: "hidden",
  },
  picker: {
    height: 50,
    color: "#1F2937",
  },
  switchContainer: {
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  switchLabel: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
  medicineContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  medicineTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  medicineSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 12,
    lineHeight: 20,
  },
  medicineList: {
    marginBottom: 16,
  },
  medicineTime: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 6,
    lineHeight: 20,
  },
  bold: {
    fontWeight: "bold",
  },
  medicineButtons: {
    alignItems: "flex-end",
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  warningButton: {
    backgroundColor: "#F59E0B",
  },
  successButton: {
    backgroundColor: "#10B981",
  },
  disabledButton: {
    backgroundColor: "#9CA3AF",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  disabledText: {
    color: "#D1D5DB",
  },
  resultContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#3B82F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  resultText: {
    fontSize: 16,
    color: "#374151",
    marginBottom: 4,
    fontWeight: "600",
  },
  resultProbability: {
    fontSize: 14,
    color: "#6B7280",
  },
  submitButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 20,
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default FormPatient;
