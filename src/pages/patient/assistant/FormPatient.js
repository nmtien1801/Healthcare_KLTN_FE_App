import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { fetchTrendMedicine, selectMedicineLoading, selectTrendMedicine, selectMedicineError, applyMedicines, fetchMedicines } from "../../../redux/medicineAiSlice";
import { api, apply_medicine } from "../../../apis/assistant";
import { Picker } from "@react-native-picker/picker";

const FormPatient = () => {
  const currentYear = new Date().getFullYear();
  const dispatch = useDispatch();
  let user = useSelector((state) => state.auth.user);
  const medicineLoading = useSelector(selectMedicineLoading);
  const trendMedicine = useSelector(selectTrendMedicine);
  const medicineError = useSelector(selectMedicineError);

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

  const [medicines, setMedicines] = useState({
    sang: [],
    trua: [],
    toi: [],
  });

  // Đơn thuốc: not_created | created | applied
  const [prescriptionStatus, setPrescriptionStatus] = useState("not_created");

  const [loading, setLoading] = useState(false);
  const [loadingAsk, setLoadingAsk] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "💉 Xin chào! Vui lòng nhập thông tin bệnh nhân để dự đoán hoặc đặt câu hỏi.",
    },
  ]);

  // Monitor medicine data changes
  useEffect(() => {
    if (trendMedicine && prescriptionStatus === "created") {
      let medicineText = "💊 Đã nhận được khuyến nghị thuốc từ AI:\n";
      if (trendMedicine.data) {
        medicineText += `📋 ${trendMedicine.data}`;
      } else {
        medicineText += `📋 ${JSON.stringify(trendMedicine)}`;
      }
      setMessages((prev) => [...prev, {
        sender: "bot",
        text: medicineText
      }]);
    }
  }, [trendMedicine, prescriptionStatus]);

  // Monitor medicine errors
  useEffect(() => {
    if (medicineError) {
      setMessages((prev) => [...prev, {
        sender: "bot",
        text: `❌ Lỗi khi lấy dữ liệu thuốc: ${medicineError}`
      }]);
    }
  }, [medicineError]);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (checked ? 1 : 0) : isNaN(value) ? value : Number(value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: "📤 Đã gửi thông tin bệnh nhân" },
    ]);

    try {
      const res = await api.post("/predict", formData);
      const botMsg = `🔍 Kết quả: ${res.data.prediction === 1 ? "Có nguy cơ tiểu đường" : "Không nguy cơ tiểu đường"
        }\n📊 Xác suất: ${(res.data.probability * 100).toFixed(2)}%`;
      setMessages((prev) => [...prev, { sender: "bot", text: botMsg }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "⚠️ Có lỗi xảy ra. Vui lòng thử lại!" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) return;
    setLoadingAsk(true);
    setMessages((prev) => [...prev, { sender: "user", text: question }]);
    setQuestion("");

    try {
      const res = await api.post("/ask", { query: question });
      setMessages((prev) => [...prev, { sender: "bot", text: res.data.answer }]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "🤖 Xin lỗi, tôi không thể trả lời câu hỏi này." },
      ]);
    } finally {
      setLoadingAsk(false);
    }
  };

  // Cập nhật trạng thái đơn thuốc theo dữ liệu hiện có
  React.useEffect(() => {
    const hasAny = (arr) => Array.isArray(arr) && arr.length > 0;
    const anyMedicines = hasAny(medicines.sang) || hasAny(medicines.trua) || hasAny(medicines.toi);
    if (prescriptionStatus !== "applied") {
      if (anyMedicines) {
        setPrescriptionStatus("created");
      } else {
        setPrescriptionStatus("not_created");
      }
    }
  }, [medicines, prescriptionStatus]);


  // lấy thuốc 
  const categorizeMedicines = (list) => {
    const sang = [];
    const trua = [];
    const toi = [];

    const instructions = {
      sang: "uống sau ăn",
      trua: "uống trước ăn",
      toi: "tiêm trước khi đi ngủ",
    };

    list.forEach((m) => {
      const hour = m.time.split("T")[1].split(":")[0];
      const hourNum = parseInt(hour, 10);

      if (hourNum >= 5 && hourNum < 11) {
        sang.push(`${m.name} ${m.lieu_luong} - ${instructions.sang}`);
      } else if (hourNum >= 11 && hourNum < 17) {
        trua.push(`${m.name} ${m.lieu_luong} - ${instructions.trua}`);
      } else if (hourNum >= 17 && hourNum <= 22) {
        toi.push(`${m.name} ${m.lieu_luong} - ${instructions.toi}`);
      }
    });

    return { sang, trua, toi };
  };

  useEffect(() => {
    const fetchMedicine = async () => {
      const today = new Date();
      const res = await dispatch(fetchMedicines({ userId: user.userID, date: today }));

      if (res?.payload?.DT) {
        const categorized = categorizeMedicines(res.payload.DT);
        setMedicines(categorized);
        const hasAny = (arr) => Array.isArray(arr) && arr.length > 0;
        if (prescriptionStatus !== "applied") {
          if (hasAny(categorized.sang) || hasAny(categorized.trua) || hasAny(categorized.toi)) {
            setPrescriptionStatus("created");
          } else {
            setPrescriptionStatus("not_created");
          }
        }
      }
    };

    fetchMedicine();
  }, [dispatch, user.userId]);

  const createPrescription = async () => {
    try {
      const medicineData = {
        age: formData.age,
        gender: formData.gender === "female" ? "female" : "male",
        BMI: formData.bmi,
        HbA1c: formData.hbA1c_level,
        bloodSugar: formData.blood_glucose_level
      };

      let res = await dispatch(fetchTrendMedicine(medicineData)).unwrap();

      // 🚀 cập nhật medicines
      setMedicines(res);

      setPrescriptionStatus("created");
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "📝 Đã tạo đơn thuốc dựa trên thông tin bệnh nhân và AI phân tích." }
      ]);
    } catch (error) {
      console.error("Lỗi khi tạo đơn thuốc:", error);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "⚠️ Có lỗi xảy ra khi tạo đơn thuốc. Vui lòng thử lại!" }
      ]);
    }
  };

  function parseMedicine(item, time, userId) {
    const [thuocLieu, cachDung] = item.split(" - ");
    const parts = thuocLieu?.trim().split(" ") || [];
    const idx = parts.findIndex(p => /\d/.test(p));

    let thuoc = thuocLieu || "";
    let lieuluong = "";

    if (idx !== -1) {
      thuoc = parts.slice(0, idx).join(" ");
      lieuluong = parts.slice(idx).join(" ");
    }

    return {
      userId,
      name: thuoc.trim(),
      lieu_luong: lieuluong.trim(),
      Cachdung: cachDung?.trim(),
      time: time,
      status: "chưa uống"
    };
  }

  const applyPrescriptionOneWeek = async () => {
    if (prescriptionStatus !== "created") return;

    let data = {
      email: user.email,
      medicinePlan: medicines,
    }

    try {
      const res = await apply_medicine.post(
        "/apply-medicine", // Thay bằng webhook thực tế của bạn
        {
          message: {
            text: data,
          }
        },
      );

      const botResponse = res.data.myField;
    } catch (err) {
      console.error(err);
    }

    Object.entries(medicines).forEach(([time, arr]) => {
      arr.forEach(item => {
        const parsed = parseMedicine(item, time, user?.userId);
        console.log("=> parse:", parsed);
        dispatch(applyMedicines(parsed));
      });
    });

    setPrescriptionStatus("applied");
    setMessages((prev) => [...prev, { sender: "bot", text: "✅ Đã áp dụng đơn thuốc trong 1 tuần. Hãy theo dõi chỉ số thường xuyên." }]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>🩺 Thông tin bệnh nhân</Text>
      </View>

      {/* Tuổi + Giới tính */}
      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1, marginRight: 8 }]}
          placeholder="Tuổi"
          keyboardType="numeric"
          value={formData.age}
          onChangeText={(value) => handleChange("age", value)}
        />
        <View style={[styles.pickerContainer, { flex: 1 }]}>
          <Picker
            selectedValue={formData.gender}
            onValueChange={(value) => handleChange("gender", value)}
          >
            <Picker.Item label="Chọn giới tính" value="" />
            <Picker.Item label="Nữ" value="female" />
            <Picker.Item label="Nam" value="male" />
          </Picker>
        </View>
      </View>

      {/* BMI + HbA1c + Đường huyết */}
      <View style={styles.row}>
        <TextInput
          style={[styles.input, { flex: 1, marginRight: 8 }]}
          placeholder="BMI"
          keyboardType="numeric"
          value={formData.bmi}
          onChangeText={(value) => handleChange("bmi", value)}
        />
        <TextInput
          style={[styles.input, { flex: 1, marginRight: 8 }]}
          placeholder="HbA1c (%)"
          keyboardType="numeric"
          value={formData.hbA1c_level}
          onChangeText={(value) => handleChange("hbA1c_level", value)}
        />
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholder="Đường huyết (mg/dL)"
          keyboardType="numeric"
          value={formData.blood_glucose_level}
          onChangeText={(value) => handleChange("blood_glucose_level", value)}
        />
      </View>

      {/* Huyết áp + Bệnh tim */}
      <View style={styles.row}>
        <View style={styles.switchContainer}>
          <Switch
            value={formData.hypertension}
            onValueChange={(value) => handleChange("hypertension", value)}
          />
          <Text style={styles.switchLabel}>Huyết áp cao</Text>
        </View>
        <View style={styles.switchContainer}>
          <Switch
            value={formData.heart_disease}
            onValueChange={(value) => handleChange("heart_disease", value)}
          />
          <Text style={styles.switchLabel}>Bệnh tim</Text>
        </View>
      </View>

      {/* Lịch sử hút thuốc */}
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.smoking_history}
          onValueChange={(value) => handleChange("smoking_history", value)}
        >
          <Picker.Item label="Chọn lịch sử hút thuốc" value="" />
          <Picker.Item label="Không bao giờ" value="never" />
          <Picker.Item label="Từng hút" value="ever" />
          <Picker.Item label="Hiện tại" value="current" />
        </Picker>
      </View>

      {/* Kế hoạch dùng thuốc */}
      <View
        style={[
          styles.medicineBox,
          prescriptionStatus === "not_created"
            ? { backgroundColor: "#fff4e5" }
            : { backgroundColor: "#e6f4ea" },
        ]}
      >
        <View style={styles.medicineHeaderRow}>
          <Text style={styles.medicineHeader}>📋 Kế hoạch dùng thuốc</Text>
          {prescriptionStatus === "not_created" && (
            <TouchableOpacity style={styles.createButton}>
              <Text style={styles.createButtonText}>Tạo đơn thuốc</Text>
            </TouchableOpacity>
          )}
        </View>
        {prescriptionStatus === "not_created" && (
          <Text style={styles.medicineNote}>
            Chưa có đơn thuốc. Vui lòng khởi tạo để có thể áp dụng theo dõi.
          </Text>
        )}
        <Text>• Sáng: {medicines?.sang?.length ? medicines.sang.join(", ") : "Không dùng"}</Text>
        <Text>• Trưa: {medicines?.trua?.length ? medicines.trua.join(", ") : "Không dùng"}</Text>
        <Text>• Tối: {medicines?.toi?.length ? medicines.toi.join(", ") : "Không dùng"}</Text>
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitButton} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Dự đoán nguy cơ ➤</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#fff" },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  sectionHeaderText: { fontSize: 18, fontWeight: "bold", color: "#4f46e5" },
  row: { flexDirection: "row", marginBottom: 12 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 16, },
  pickerContainer: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, marginBottom: 12, overflow: "hidden", },
  switchContainer: { flexDirection: "row", alignItems: "center", flex: 1, },
  switchLabel: { marginLeft: 8 },
  medicineBox: { borderRadius: 8, padding: 12, marginBottom: 16, },
  medicineHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  medicineHeader: { fontWeight: "bold" }, medicineNote: { marginBottom: 8, color: "#555" },
  createButton: { backgroundColor: "#f97316", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  createButtonText: { color: "#fff", fontWeight: "bold" },
  submitButton: { backgroundColor: "#4f46e5", padding: 14, borderRadius: 8, alignItems: "center", marginBottom: 32, },
  submitText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});

export default FormPatient;
