import React, { useEffect, useRef, useState } from "react";
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { useSelector, useDispatch } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { suggestFoodsByAi, GetCaloFood } from '../../redux/foodAiSlice'
import { setWithExpiry, getWithExpiry } from '../../components/customizeStorage'
import { fetchBloodSugar, saveBloodSugar } from '../../redux/patientSlice'
import ApiBooking from '../../apis/ApiBooking'

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chào mừng đến với HealthTabs!</Text>
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
