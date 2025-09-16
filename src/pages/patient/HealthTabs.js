import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Button, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { LineChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { suggestFoodsByAi, GetCaloFood } from '../../redux/foodAiSlice'
import { setWithExpiry, getWithExpiry } from '../../components/customizeStorage'
import { fetchBloodSugar, saveBloodSugar } from '../../redux/patientSlice'
import ApiBooking from '../../apis/ApiBooking'

const screenWidth = Dimensions.get("window").width;

const HealthTabs = () => {
  const [messageInput, setMessageInput] = useState([]);
  const dispatch = useDispatch();
  const [aiPlan, setAiPlan] = useState({});
  let user = useSelector((state) => state.auth.user);
  const [measurementType, setMeasurementType] = useState("before");
  const [bloodSugar, setBloodSugar] = useState([]);
  const [nearestAppointment, setNearestAppointment] = useState(null);

  // get bloodSugar
  useEffect(() => {
    if (!user?.userId) {
      console.log('No userId, skipping fetchBloodSugarData');
      return;
    }

    let fetchBloodSugarData = async () => {
      try {
        // Lấy cả dữ liệu lúc đói và sau ăn
        const [postMealRes, fastingRes] = await Promise.all([
          dispatch(fetchBloodSugar({ userId: user.userId, type: "postMeal", days: 7 })),
          dispatch(fetchBloodSugar({ userId: user.userId, type: "fasting", days: 7 }))
        ]);

        // Gộp dữ liệu từ cả hai API calls
        const allData = [];

        // Kiểm tra response structure - thử nhiều format khác nhau
        let postMealData = null;
        let fastingData = null;

        // Thử format 1: payload.DT.bloodSugarData
        if (postMealRes?.payload?.DT?.bloodSugarData) {
          postMealData = postMealRes.payload.DT.bloodSugarData;
        }
        // Thử format 2: payload.DT
        else if (postMealRes?.payload?.DT && Array.isArray(postMealRes.payload.DT)) {
          postMealData = postMealRes.payload.DT;
        }
        // Thử format 3: payload trực tiếp
        else if (postMealRes?.payload && Array.isArray(postMealRes.payload)) {
          postMealData = postMealRes.payload;
        }

        if (fastingRes?.payload?.DT?.bloodSugarData) {
          fastingData = fastingRes.payload.DT.bloodSugarData;
        }
        else if (fastingRes?.payload?.DT && Array.isArray(fastingRes.payload.DT)) {
          fastingData = fastingRes.payload.DT;
        }
        else if (fastingRes?.payload && Array.isArray(fastingRes.payload)) {
          fastingData = fastingRes.payload;
        }

        // Thêm data vào allData nếu có
        if (postMealData && Array.isArray(postMealData)) {
          console.log('Adding postMeal data:', postMealData);
          allData.push(...postMealData);
        } else {
          console.log('No postMeal data found in response');
        }

        if (fastingData && Array.isArray(fastingData)) {
          allData.push(...fastingData);
        } else {
          console.log('No fasting data found in response');
        }

        setBloodSugar(allData);
      } catch (error) {
        console.error('Error fetching blood sugar data:', error);
      }
    }

    fetchBloodSugarData()
  }, [dispatch, user?.userId])

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

  const handleAiAgent = async () => {
    if (messageInput.trim() === "") return;

    // Lưu giá trị input trước khi clear
    const inputValue = messageInput.trim();
    const inputType = measurementType;

    // xử lý dữ liệu
    let result = '';

    if (inputType === "before") {
      if (inputValue < 3.9) {
        result = '<3,9';
      } else if (inputValue >= 3.9 && inputValue <= 5.6) {
        result = '3,9 – 5,6';
      } else if (inputValue > 5.6 && inputValue <= 6.9) {
        result = '5,7 – 6,9';
      } else if (inputValue >= 7) {
        result = '>=7';
      } else {
        result = 'Giá trị không hợp lệ';
      }
    } else if (inputType === "after") {
      if (inputValue < 3.9) {
        result = '<3,9';
      } else if (inputValue >= 3.9 && inputValue <= 7.7) {
        result = '3,9 – 7,7';
      } else if (inputValue > 7.8 && inputValue <= 11) {
        result = '7,8 - 11';
      } else if (inputValue > 11) {
        result = '>11';
      } else {
        result = 'Giá trị không hợp lệ';
      }
    }

    // Clear input sau khi xử lý xong
    setMessageInput("");

    try {
      // Lưu chỉ số đường huyết vào BE
      const saveResult = await dispatch(saveBloodSugar({
        userId: user.userId,
        value: parseFloat(inputValue),
        type: inputType === "before" ? "fasting" : "postMeal"
      }));

      // Gọi AI để lấy lời khuyên
      const res = await axios.post(
        "http://localhost:5678/webhook/mess-fb-new", // Thay bằng webhook thực tế của bạn
        {
          message: {
            input: inputValue,
            measurementType: inputType,
            type: result
          }
        },
      );

      const botResponse = res.data;
      setAiPlan(botResponse);

      // Thêm thông báo thành công
      alert('Đã lưu chỉ số đường huyết thành công!');

      // Refresh blood sugar data để hiển thị trên chart
      dispatch(fetchBloodSugar({ userId: user.userId, type: "postMeal", days: 7 }));
      dispatch(fetchBloodSugar({ userId: user.userId, type: "fasting", days: 7 }));

    } catch (err) {
      console.error('API error:', err);
      // Khôi phục input nếu API fail
      setMessageInput(inputValue);
      alert('Có lỗi xảy ra khi lưu dữ liệu. Vui lòng thử lại!');
    }
  }

  const [bloodSugarInput, setBloodSugarInput] = useState("");
  const dummyBloodSugarData = {
    labels: ["13/09"],
    datasets: [
      {
        data: [5, 6, 7],
        color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`, // lúc đói
        strokeWidth: 2,
      },
      {
        data: [6, 7, 8],
        color: (opacity = 1) => `rgba(255, 165, 0, ${opacity})`, // sau ăn
        strokeWidth: 2,
      },
    ],
  };

  const handleSaveBloodSugar = () => {
    alert(`Đã lưu chỉ số ${bloodSugarInput} mmol/L (${measurementType === "before" ? "Trước ăn" : "Sau ăn"})`);
    setBloodSugarInput("");
  };

  return (
    <ScrollView style={styles.container}>
      {/* Biểu đồ theo dõi */}
      <Text style={styles.sectionTitle}>Biểu đồ theo dõi</Text>
      <LineChart
        data={dummyBloodSugarData}
        width={screenWidth - 40}
        height={220}
        chartConfig={{
          backgroundColor: "#fff",
          backgroundGradientFrom: "#fff",
          backgroundGradientTo: "#fff",
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          propsForDots: {
            r: "4",
            strokeWidth: "2",
            stroke: "#2196F3",
          },
        }}
        style={{
          marginVertical: 8,
          borderRadius: 16,
        }}
      />

      {/* Nhập chỉ số mới */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Nhập chỉ số mới</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.buttonToggle, measurementType === "before" && styles.buttonActive]}
            onPress={() => setMeasurementType("before")}
          >
            <Text style={styles.buttonText}>Trước ăn</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.buttonToggle, measurementType === "after" && styles.buttonActive]}
            onPress={() => setMeasurementType("after")}
          >
            <Text style={styles.buttonText}>Sau ăn</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Nhập chỉ số đường huyết (mmol/L)"
          keyboardType="numeric"
          value={bloodSugarInput}
          onChangeText={setBloodSugarInput}
        />
        <Button title="Lưu" onPress={handleSaveBloodSugar} />
      </View>

      {/* Kế hoạch dùng thuốc */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Kế hoạch dùng thuốc</Text>
        <Text>Sáng: Không dùng</Text>
        <Text>Trưa: Không dùng</Text>
        <Text>Tối: Không dùng</Text>
        <Button title="Chuẩn đoán" onPress={() => alert("Chuẩn đoán")} />
      </View>

      {/* Kế hoạch dinh dưỡng */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Kế hoạch dinh dưỡng</Text>
        <Text>Calo/ngày: 1504 calo</Text>
        <Text>Bánh mì nguyên cám: 100g (79 calo)</Text>
        <Text>Yến mạch: 100g (153 calo)</Text>
        <Text>Hạt diêm mạch: 100g (120 calo)</Text>
        <Text>Gạo lứt: 100g (216 calo)</Text>
        <Text>Khoai lang: 100g (86 calo)</Text>
        <Button title="Xem thêm (18 món)" onPress={() => alert("Xem thêm thực đơn")} />
      </View>

      {/* Thông tin thêm */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Thông tin thêm</Text>
        <Text style={styles.infoTitle}>Chỉ số bình thường</Text>
        <Text>Đường huyết lúc đói: 3.9 – 5.5 mmol/L</Text>
        <Text>Đường huyết sau ăn 2h: {"< 7.8 mmol/L"}</Text>

        <Text style={styles.infoTitle}>Chỉ số tiền tiểu đường</Text>
        <Text>Đường huyết lúc đói: 5.6 – 6.9 mmol/L</Text>
        <Text>Đường huyết sau ăn 2h: 7.8 – 11.0 mmol/L</Text>

        <Text style={styles.infoTitle}>Chỉ số tiểu đường</Text>
        <Text>Đường huyết lúc đói: ≥ 7.0 mmol/L</Text>
        <Text>Đường huyết sau ăn 2h: {"> 11.1 mmol/L"}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    margin: 10,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 10,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    marginBottom: 10,
  },
  buttonToggle: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2196F3",
    marginRight: 5,
  },
  buttonActive: {
    backgroundColor: "#2196F3",
  },
  buttonText: {
    textAlign: "center",
    color: "#fff",
  },
  infoTitle: {
    fontWeight: "bold",
    marginTop: 8,
  },
});

export default HealthTabs;
