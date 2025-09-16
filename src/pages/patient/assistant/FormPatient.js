import React, { useState, useEffect } from "react";
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import ChatBox from "./ChatBox";
import { useDispatch, useSelector } from "react-redux";
import { fetchTrendMedicine, selectMedicineLoading, selectTrendMedicine, selectMedicineError, applyMedicines, fetchMedicines } from "../../../redux/medicineAiSlice";
import { api, apply_medicine } from "../../../apis/assistant";

const HealthTabs = () => {
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
    <View style={styles.container}>
      <Text style={styles.title}>Chào mừng đến với FormPatient!</Text>
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

export default HealthTabs;
