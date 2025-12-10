import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
  TouchableWithoutFeedback,
} from "react-native";
import {
  Heart,
  User,
  AlertTriangle,
  CalendarCheck,
  Clock,
  LineChart,
  ChevronDown,
  Info,
} from "lucide-react-native";
import { api, get_advice } from "../../apis/assistant";
import { useSelector, useDispatch } from "react-redux";
import { suggestFoodsByAi, GetCaloFood } from "../../redux/foodAiSlice";
import { fetchBloodSugar, saveBloodSugar } from "../../redux/patientSlice";
import { useNavigation } from "@react-navigation/native";
import ApiBooking from "../../apis/ApiBooking";
import { ECharts } from "react-native-echarts-wrapper";
import { InsertFoods, GetListFood } from "../../redux/foodSlice";
import ApiNotification from "../../apis/ApiNotification";
import { sendStatus } from "../../utils/SetupSignFireBase";

const { width: screenWidth } = Dimensions.get("window");

const Following = ({ user, nearestAppointment, warning }) => {
  const bloodSugar = useSelector((state) => state.patient.bloodSugar);
  const latestReading =
    Array.isArray(bloodSugar?.DT?.bloodSugarData) &&
    bloodSugar.DT.bloodSugarData.length > 0
      ? bloodSugar.DT.bloodSugarData[0].value
      : 0;
  const safeWarning = Array.isArray(warning) ? warning : [];
  const warningCount = safeWarning.length;

  const readingStatus = {
    status: warningCount > 1 ? "#dc3545" : "#28a745",
    color: warningCount > 1 ? "#dc3545" : "#28a745",
    bgColor: warningCount > 1 ? "#f8d7da" : "#d4edda",
    content:
      warningCount > 1
        ? safeWarning.join("\n\n")
        : "Chỉ số đường huyết trong mức bình thường",
  };

  useEffect(() => {
    if (warningCount > 1) {
      const fetchWarning = async () => {
        try {
          let a = await ApiNotification.createNotification({
            receiverId: user.uid,
            title: "Cảnh báo vượt mức nguy hiểm đường huyết",
            content: safeWarning.join("\n"),
            type: "system",
            metadata: {
              link: `/patient/appointments/${user.uid}`,
            },
            avatar: user.avatar || "",
          });
          await sendStatus(user?.uid, user?.uid, "warning");
        } catch (err) {
          console.error("Lỗi khi gửi cảnh báo:", err);
        }
      };

      fetchWarning();
    }
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Theo dõi sức khỏe</Text>
            <Text style={styles.headerSubtitle}>
              Quản lý chỉ số đường huyết của bạn
            </Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.readingInfo}>
              <Text style={styles.readingLabel}>Lần đo gần nhất</Text>
              <Text
                style={[styles.readingValue, { color: readingStatus.color }]}
              >
                {latestReading ? `${latestReading} mmol/L` : "N/A"}
              </Text>
            </View>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: readingStatus.bgColor },
              ]}
            >
              <Heart size={20} color={readingStatus.color} />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.cardsRow}>
        {/* User Info */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <User name="person" size={18} color="#007bff" />
            </View>
            <Text style={styles.cardTitle}>Thông tin cá nhân</Text>
          </View>
          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Họ tên:</Text>
              <Text style={styles.infoValue}>{user?.username || "N/A"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tuổi:</Text>
              <Text style={styles.infoValue}>
                {(() => {
                  if (!user?.dob) return "N/A";
                  const dob = new Date(user.dob);
                  const today = new Date();
                  let age = today.getFullYear() - dob.getFullYear();
                  const m = today.getMonth() - dob.getMonth();
                  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
                    age--;
                  }
                  return age.toString();
                })()}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Giới tính:</Text>
              <Text style={styles.infoValue}>{user?.gender || "N/A"}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tình trạng:</Text>
              <Text style={[styles.infoValue, { color: "#dc3545" }]}>
                Tiểu đường type 2
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Bác sĩ:</Text>
              <Text style={styles.infoValue}>
                {nearestAppointment?.doctorId?.userId?.username ?? "Chưa có"}
              </Text>
            </View>
          </View>
        </View>

        {/* Cảnh báo */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <AlertTriangle size={18} color="#007bff" />
            </View>
            <Text style={styles.cardTitle}>Tình trạng hiện tại</Text>
          </View>
          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoValue, { color: readingStatus.status }]}>
                {readingStatus.content}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.cardsRow}>
        {/* Appointment */}
        <View style={styles.appointmentCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <CalendarCheck size={18} color="#34c759" />
            </View>
            <Text style={styles.cardTitle}>Lịch hẹn tiếp theo</Text>
          </View>
          {nearestAppointment ? (
            <View style={styles.appointmentContent}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <Text style={styles.appointmentDate}>
                  {new Date(nearestAppointment.date).toLocaleDateString(
                    "vi-VN"
                  )}
                </Text>
                <Text style={styles.appointmentTime}>
                  {nearestAppointment.time}
                </Text>
              </View>
              <Text style={styles.appointmentInfo}>
                <Text style={styles.boldText}>Bác sĩ:</Text>{" "}
                {nearestAppointment.doctorId?.userId?.username ?? "N/A"}
              </Text>
              <Text style={styles.appointmentInfo}>
                <Text style={styles.boldText}>Địa điểm:</Text>{" "}
                {nearestAppointment.type === "onsite"
                  ? "Tại phòng khám"
                  : "Trực tuyến"}
              </Text>
              <View style={styles.reminderContainer}>
                <Clock size={14} color="#dc3545" />
                <Text style={styles.reminderText}>
                  Nhớ chuẩn bị trước 30 phút
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.noAppointment}>
              <Text style={styles.noAppointmentText}>
                Chưa có lịch hẹn sắp tới
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const bloodSugarDaily = ({ bloodSugar }) => {
  const dailyData = {};

  bloodSugar?.forEach((item) => {
    const date = new Date(item.time);
    const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD

    if (!dailyData[dateKey]) {
      dailyData[dateKey] = { fasting: [], postMeal: [] };
    }

    if (item.type === "fasting") {
      dailyData[dateKey].fasting.push(item.value);
    } else if (item.type === "postMeal") {
      dailyData[dateKey].postMeal.push(item.value);
    }
  });

  const sortedDates = Object.keys(dailyData).sort();
  const dates = sortedDates.map((date) => {
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, "0")}`;
  });

  const fastingData = sortedDates.map((date) => {
    const values = dailyData[date].fasting;
    return values.length > 0
      ? values.reduce((a, b) => a + b, 0) / values.length
      : null;
  });

  const postMealData = sortedDates.map((date) => {
    const values = dailyData[date].postMeal;
    return values.length > 0
      ? values.reduce((a, b) => a + b, 0) / values.length
      : null;
  });

  return { dates, fastingData, postMealData };
};

const getYesterdayAvg = ({ dailyBloodSugar }) => {
  const len = dailyBloodSugar.dates.length;
  if (len < 1) return null;

  const fasting = dailyBloodSugar.fastingData[len - 1];
  const postMeal = dailyBloodSugar.postMealData[len - 1];

  const avg =
    [fasting, postMeal].filter((v) => v !== null).reduce((a, b) => a + b, 0) /
    ([fasting, postMeal].filter((v) => v !== null).length || 1);

  return { fasting, postMeal, avg };
};

// ✅ Kiểm tra ngưỡng cao và hiển thị alert
const checkHighThreshold = (dailyBloodSugar, setWarning) => {
  const todayIndex = dailyBloodSugar.dates.length - 1;
  const todayDate = dailyBloodSugar.dates[todayIndex];
  const todayFastingValue = dailyBloodSugar.fastingData[todayIndex];
  const todayPostMealValue = dailyBloodSugar.postMealData[todayIndex];

  const warnings = [];
  warnings.push(`Ngày ${todayDate}: `);
  // 2. Kiểm tra chỉ số lúc đói của ngày hôm nay (ngưỡng >= 7.0)
  if (todayFastingValue !== null && todayFastingValue >= 7.0) {
    warnings.push(
      ` - Đường huyết lúc đói cao (${todayFastingValue.toFixed(3)} mmol/L).`
    );
  }

  // 3. Kiểm tra chỉ số sau ăn của ngày hôm nay (ngưỡng >= 11.1)
  if (todayPostMealValue !== null && todayPostMealValue >= 11.1) {
    warnings.push(
      ` - Đường huyết sau ăn cao (${todayPostMealValue.toFixed(3)} mmol/L).`
    );
  }

  // 4. Hiển thị alert nếu có cảnh báo
  if (warnings.length > 1) {
    // Sử dụng > 1 vì warnings.push(Ngày...) đã có 1 phần tử
    setWarning(warnings);
  } else {
    setWarning([]);
  }
};

const Chart = ({ bloodSugar, setWarning }) => {
  const [dailyBloodSugar, setDailyBloodSugar] = useState({
    dates: [],
    fastingData: [],
    postMealData: [],
  });

  useEffect(() => {
    if (bloodSugar?.length > 0) {
      try {
        const processed = bloodSugarDaily({ bloodSugar });
        setDailyBloodSugar(processed);

        // Gọi hàm cảnh báo sau khi đã process xong
        checkHighThreshold(processed, setWarning);
      } catch (error) {
        console.error("Error processing bloodSugar data:", error);
      }
    } else {
      setDailyBloodSugar({ dates: [], fastingData: [], postMealData: [] });
      setWarning([]);
    }
  }, [bloodSugar, setWarning]);

  // Build last 7 days view to match subtitle
  const last7Labels = dailyBloodSugar.dates.slice(-7);
  const last7Fasting = dailyBloodSugar.fastingData.slice(-7);
  const last7Post = dailyBloodSugar.postMealData.slice(-7);

  // Dynamic Y axis based on available values
  const yVals = [...last7Fasting, ...last7Post].filter(
    (v) => typeof v === "number" && !isNaN(v)
  );
  const yMin = yVals.length
    ? Math.max(0, Math.floor((Math.min(...yVals) - 0.6) * 10) / 10)
    : 3.5;
  const yMax = 13;

  const option = {
    tooltip: {
      trigger: "axis",
      formatter: function (params) {
        let result = params[0].axisValue + "<br/>";
        params.forEach((param) => {
          if (param.value !== null) {
            result +=
              param.marker +
              " " +
              param.seriesName +
              ": " +
              Number(param.value?.toFixed(1)) +
              " mmol/L<br/>";
          }
        });
        return result;
      },
    },
    legend: {
      top: 8,
      icon: "circle",
      data: ["Lúc đói", "Sau ăn"],
      textStyle: { color: "#6b7280" },
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: last7Labels,
      axisLine: { lineStyle: { color: "#e5e7eb" } },
      axisLabel: { color: "#6b7280", fontSize: 10 },
    },
    yAxis: {
      type: "value",
      min: yMin,
      max: yMax,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: "#e5e7eb", type: "dashed" } },
      axisLabel: {
        color: "#6b7280",
        fontSize: 13,
        formatter: "{value} mmol/L",
      },
    },
    series: [
      {
        name: "Lúc đói",
        data: last7Fasting,
        type: "line",
        smooth: true,
        showSymbol: true,
        symbolSize: 3,
        lineStyle: { color: "#3b82f6", width: 2 },
        itemStyle: { color: "#3b82f6" },
        areaStyle: { opacity: 0.06 },
        connectNulls: true,
        markLine: {
          data: [
            {
              yAxis: 5.6,
              lineStyle: { color: "#10b981" },
              label: { formatter: "Trước ăn" },
            },
            {
              yAxis: 7.0,
              lineStyle: { color: "#ef4444" },
              label: { formatter: "Ngưỡng cao (đói)" },
            },
          ],
        },
      },
      {
        name: "Sau ăn",
        data: last7Post,
        type: "line",
        smooth: true,
        showSymbol: true,
        symbolSize: 6,
        lineStyle: { color: "#f59e0b", width: 2 },
        itemStyle: { color: "#f59e0b" },
        areaStyle: { opacity: 0.06 },
        connectNulls: true,
        markLine: {
          data: [
            {
              yAxis: 7.8,
              lineStyle: { color: "#10b981" },
              label: { formatter: "Sau ăn" },
            },
            {
              yAxis: 10,
              lineStyle: { color: "#ef4444" },
              label: { formatter: "Ngưỡng cao (sau ăn)" },
            },
          ],
        },
      },
    ],
    grid: { left: 28, right: 16, top: 40, bottom: 28, containLabel: true },
  };

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <View style={styles.chartIconContainer}>
          <LineChart size={20} color="#6366f1" />
        </View>
        <Text style={styles.chartTitle}>Biểu đồ theo dõi</Text>
      </View>
      <View style={styles.chartContainer}>
        <Text style={styles.chartSubtitle}>
          Chỉ số đường huyết (mmol/L) - 7 ngày gần nhất
        </Text>
        {dailyBloodSugar.dates.length > 0 ? (
          <View style={{ width: screenWidth, height: 260 }}>
            <ECharts
              key={last7Labels.join("|")}
              option={option}
              backgroundColor="transparent"
              style={{ width: "100%", height: "100%", borderRadius: 16 }}
            />
          </View>
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>Chưa có dữ liệu để hiển thị</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const Plan = ({ aiPlan, user, bloodSugar }) => {
  const foods = useSelector((state) => state.food.foods || []);
  const totalCalo = useSelector((state) => state.food.totalCalo);
  const [showAllFood, setShowAllFood] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigation = useNavigation();

  // render món ăn
  useEffect(() => {
    const fetchFood = async () => {
      setLoading(true);
      try {
        // Fetch food
        const cached = await dispatch(GetListFood(user.userId));
        if (cached && cached?.payload?.DT && cached?.payload?.DT.length > 0) {
          setLoading(false);
          return;
        }

        const dailyBloodSugar = bloodSugarDaily({ bloodSugar });
        const yesterday = getYesterdayAvg({ dailyBloodSugar });

        const res = await dispatch(GetCaloFood(user?.userId)).unwrap();
        const data = res?.DT?.menuFood;

        if (data && yesterday) {
          const response = await dispatch(
            suggestFoodsByAi({
              min: data.caloMin,
              max: data.caloMax,
              mean: yesterday.avg,
              currentCalo: data.caloCurrent,
              menuFoodId: data._id,
            })
          ).unwrap();

          if (response.result) {
            await dispatch(
              InsertFoods({
                userId: user.userId,
                data: response?.result.chosen,
              })
            );
            // foods will be available through the `foods` selector after InsertFoods
          }
        }
      } catch (error) {
        console.error("Error fetchFood data:", error);
        Alert.alert("Lỗi", "Không thể tải kế hoạch. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    if (user?.userId && bloodSugar?.length > 0) {
      fetchFood();
    }
  }, [user?.userId, bloodSugar, dispatch]);

  return (
    <View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Đang tải kế hoạch...</Text>
        </View>
      ) : (
        <>
          {/* Lời khuyên */}
          <View style={styles.adviceCard}>
            <Text style={styles.adviceTitle}>👉 Lời Khuyên</Text>
            <Text style={styles.adviceText}>
              {aiPlan?.advice || "Chưa có lời khuyên"}
            </Text>
            <Text style={styles.adviceAuthor}>
              — {aiPlan?.assistant_name || "AI Assistant"}
            </Text>
          </View>

          {/* KẾ HOẠCH DINH DƯỠNG */}
          <View style={styles.nutritionCard}>
            <Text style={styles.nutritionTitle}>🥗 Kế hoạch dinh dưỡng</Text>
            {foods?.length > 0 ? (
              <View>
                <Text style={styles.calorieInfo}>
                  <Text style={styles.boldText}>Calo/ngày:</Text> {totalCalo}{" "}
                  calo
                </Text>
                <View style={styles.foodList}>
                  {foods
                    .slice(0, showAllFood ? undefined : 5)
                    .map((item, idx) => (
                      <Text key={idx} style={styles.foodItem}>
                        <Text style={styles.boldText}>{item.name}:</Text> (
                        {item.calo} calo) - {item.weight}g
                      </Text>
                    ))}
                </View>
                {foods.length > 5 && (
                  <View style={styles.expandButtonContainer}>
                    <TouchableOpacity
                      style={styles.expandButton}
                      onPress={() => setShowAllFood(!showAllFood)}
                      accessibilityLabel={
                        showAllFood
                          ? "Thu gọn danh sách thực phẩm"
                          : "Xem thêm thực phẩm"
                      }
                      accessibilityRole="button"
                    >
                      <Text style={styles.expandButtonText}>
                        {showAllFood
                          ? "Thu gọn"
                          : `Xem thêm (${foods.length - 5} món)`}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              <TouchableOpacity
                style={styles.exploreButton}
                onPress={() => navigation.navigate("Dinh dưỡng")}
                accessibilityLabel="Khám phá thực đơn"
                accessibilityRole="button"
              >
                <Text style={styles.exploreButtonText}>Khám phá thực đơn</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </View>
  );
};

const HealthTabs = () => {
  const [messageInput, setMessageInput] = useState("");
  const [aiPlan, setAiPlan] = useState({});
  const [measurementType, setMeasurementType] = useState("before");
  const [bloodSugar, setBloodSugar] = useState([]);
  const [nearestAppointment, setNearestAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const user = useSelector((state) => state.auth.user);
  const [warning, setWarning] = useState([]); // chỉ số cảnh báo

  const fetchData = async () => {
    if (!user?.userId) {
      console.log("No userId, skipping data fetch");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch blood sugar data
      const [postMealRes, fastingRes] = await Promise.all([
        dispatch(
          fetchBloodSugar({ userId: user.userId, type: "postMeal", days: 6 })
        ).unwrap(),
        dispatch(
          fetchBloodSugar({ userId: user.userId, type: "fasting", days: 6 })
        ).unwrap(),
      ]);

      const allData = [];
      const postMealData =
        postMealRes?.DT?.bloodSugarData || postMealRes?.DT || postMealRes || [];
      const fastingData =
        fastingRes?.DT?.bloodSugarData || fastingRes?.DT || fastingRes || [];

      if (Array.isArray(postMealData)) {
        allData.push(...postMealData);
      }
      if (Array.isArray(fastingData)) {
        allData.push(...fastingData);
      }

      setBloodSugar(allData);

      // Fetch nearest appointment
      const appointments = await ApiBooking.getUpcomingAppointments();
      if (appointments?.length > 0) {
        const sortedAppointments = appointments.sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
          if (dateA.getTime() === dateB.getTime()) {
            return a.time.localeCompare(b.time);
          }
          return dateA - dateB;
        });
        setNearestAppointment(sortedAppointments[0]);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Lỗi", "Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.userId, dispatch]);

  const handleAiAgent = async () => {
    if (messageInput.trim() === "") {
      Alert.alert("Lỗi", "Vui lòng nhập chỉ số đường huyết");
      return;
    }

    const inputValue = parseFloat(messageInput.trim());
    if (isNaN(inputValue)) {
      Alert.alert("Lỗi", "Chỉ số đường huyết không hợp lệ");
      return;
    }

    const inputType = measurementType;
    let result = "";

    if (inputType === "before") {
      if (inputValue < 3.9) result = "<3,9";
      else if (inputValue >= 3.9 && inputValue <= 5.6) result = "3,9 – 5,6";
      else if (inputValue > 5.6 && inputValue <= 6.9) result = "5,7 – 6,9";
      else result = ">=7";
    } else {
      if (inputValue < 3.9) result = "<3,9";
      else if (inputValue >= 3.9 && inputValue <= 7.7) result = "3,9 – 7,7";
      else if (inputValue > 7.8 && inputValue <= 11) result = "7,8 - 11";
      else result = ">11";
    }

    setLoading(true);
    try {
      await dispatch(
        saveBloodSugar({
          userId: user?.userId,
          value: inputValue,
          type: inputType === "before" ? "fasting" : "postMeal",
        })
      ).unwrap();

      const res = await get_advice.post("/mess-fb-new", {
        message: {
          input: Number(inputValue),
          measurementType: inputType,
          type: result,
        },
      });

      setAiPlan(res.data);
      setMessageInput("");
      Alert.alert("Thành công", "Đã lưu chỉ số đường huyết thành công!");

      // Refresh blood sugar data
      await fetchData();
    } catch (error) {
      console.error("API error:", error);
      Alert.alert("Lỗi", "Có lỗi xảy ra khi lưu dữ liệu. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.mainContainer}
      contentContainerStyle={styles.contentContainer}
    >
      <Following
        user={user}
        nearestAppointment={nearestAppointment}
        warning={warning}
      />
      <Chart bloodSugar={bloodSugar} setWarning={setWarning} />
      <View style={styles.bottomSection}>
        <View style={styles.inputCard}>
          <Text style={styles.inputTitle}>Nhập chỉ số mới</Text>
          <View style={styles.inputRow}>
            <View style={styles.pickerContainer}>
              <TouchableOpacity
                style={styles.picker}
                onPress={() =>
                  setMeasurementType(
                    measurementType === "before" ? "after" : "before"
                  )
                }
                accessibilityLabel="Chọn loại đo đường huyết"
                accessibilityRole="button"
              >
                <Text style={styles.pickerText}>
                  {measurementType === "before" ? "Trước ăn" : "Sau ăn"}
                </Text>
                <ChevronDown size={20} color="#666" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[
                styles.textInput,
                {
                  borderColor:
                    measurementType === "before" ? "#007bff" : "#ffc107",
                },
              ]}
              placeholder="Nhập chỉ số đường huyết"
              value={messageInput}
              onChangeText={setMessageInput}
              keyboardType="numeric"
              accessibilityLabel="Nhập chỉ số đường huyết (mmol/L)"
            />

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.disabledButton]}
              onPress={handleAiAgent}
              disabled={loading}
              accessibilityLabel="Lưu chỉ số đường huyết"
              accessibilityRole="button"
            >
              <Text style={styles.saveButtonText}>
                {loading ? "Đang lưu..." : "Lưu"}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoContainer}>
            <Info size={14} color="#6c757d" />
            <Text style={styles.infoText}>
              Nhập chỉ số đường huyết theo đơn vị mmol/L
            </Text>
          </View>
          {aiPlan && (
            <Plan aiPlan={aiPlan} user={user} bloodSugar={bloodSugar} />
          )}
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Thông tin thêm</Text>
          <View style={styles.infoSections}>
            <View style={styles.normalSection}>
              <Text style={styles.normalTitle}>Chỉ số bình thường</Text>
              <Text style={styles.normalText}>
                Đường huyết lúc đói: 3.9 - 5.5 mmol/L
              </Text>
              <Text style={styles.normalText}>
                Đường huyết sau ăn 2h: &lt; 7.8 mmol/L
              </Text>
            </View>
            <View style={styles.warningSection}>
              <Text style={styles.warningTitle}>Chỉ số tiền tiểu đường</Text>
              <Text style={styles.warningText}>
                Đường huyết lúc đói: 5.6 - 6.9 mmol/L
              </Text>
              <Text style={styles.warningText}>
                Đường huyết sau ăn 2h: 7.8 - 11.0 mmol/L
              </Text>
            </View>
            <View style={styles.dangerSection}>
              <Text style={styles.dangerTitle}>Chỉ số tiểu đường</Text>
              <Text style={styles.dangerText}>
                Đường huyết lúc đói: ≥ 7.0 mmol/L
              </Text>
              <Text style={styles.dangerText}>
                Đường huyết sau ăn 2h: ≥ 11.1 mmol/L
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  contentContainer: {
    paddingBottom: 20,
  },
  container: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: "#007bff",
  },
  headerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#eef2f7",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6c757d",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  readingInfo: {
    alignItems: "flex-end",
  },
  readingLabel: {
    fontSize: 12,
    color: "#6c757d",
  },
  readingValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  cardsRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "stretch",
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 130,
    borderWidth: 1,
    borderColor: "#eef2f7",
  },
  appointmentCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 130,
    borderWidth: 1,
    borderColor: "#eef2f7",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  cardIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#e3f2fd",
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212529",
  },
  infoList: {
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 10,
    color: "#6c757d",
  },
  infoValue: {
    fontSize: 10,
    color: "#212529",
    fontWeight: "500",
  },
  appointmentContent: {
    alignItems: "flex-start",
  },
  appointmentDate: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#212529",
    marginBottom: 4,
  },
  appointmentTime: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 8,
  },
  appointmentInfo: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 4,
    textAlign: "center",
  },
  boldText: {
    fontWeight: "bold",
    fontSize: 12,
  },
  reminderContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  reminderText: {
    fontSize: 12,
    color: "#dc3545",
  },
  noAppointment: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 80,
    borderWidth: 1,
    borderColor: "#f1f3f5",
    borderStyle: "dashed",
    borderRadius: 8,
  },
  noAppointmentText: {
    fontSize: 14,
    color: "#6c757d",
  },
  chartCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  chartIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#ede7f6",
    justifyContent: "center",
    alignItems: "center",
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
  },
  chartContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  chartSubtitle: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 16,
    textAlign: "center",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataContainer: {
    height: 220,
    justifyContent: "center",
    alignItems: "center",
  },
  noDataText: {
    fontSize: 14,
    color: "#6c757d",
  },
  bottomSection: {
    flexDirection: "column",
    gap: 16,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  inputCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  inputTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  pickerContainer: {
    minWidth: 100,
  },
  picker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#ffffff",
  },
  pickerText: {
    fontSize: 14,
    color: "#495057",
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#ffffff",
  },
  saveButton: {
    backgroundColor: "#007bff",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  disabledButton: {
    backgroundColor: "#6c757d",
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 12,
  },
  infoText: {
    fontSize: 12,
    color: "#6c757d",
  },
  adviceCard: {
    backgroundColor: "#f8d7da",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  adviceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#721c24",
    marginBottom: 4,
  },
  adviceText: {
    fontSize: 14,
    color: "#721c24",
    marginBottom: 4,
  },
  adviceAuthor: {
    fontSize: 12,
    color: "#6c757d",
    fontStyle: "italic",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  nutritionCard: {
    backgroundColor: "#fff3cd",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  nutritionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#856404",
    marginBottom: 8,
  },
  calorieInfo: {
    fontSize: 14,
    color: "#856404",
    marginBottom: 8,
  },
  foodList: {
    marginTop: 8,
  },
  foodItem: {
    fontSize: 12,
    color: "#856404",
    marginBottom: 4,
  },
  expandButtonContainer: {
    alignItems: "flex-end",
    marginTop: 8,
  },
  expandButton: {
    backgroundColor: "#ffc107",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  expandButtonText: {
    color: "#212529",
    fontSize: 12,
    fontWeight: "600",
  },
  exploreButton: {
    backgroundColor: "#ffc107",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  exploreButtonText: {
    color: "#212529",
    fontSize: 12,
    fontWeight: "600",
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 16,
  },
  infoSections: {
    gap: 12,
  },
  normalSection: {
    backgroundColor: "#d4edda",
    borderRadius: 8,
    padding: 12,
  },
  normalTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#155724",
    marginBottom: 4,
  },
  normalText: {
    fontSize: 12,
    color: "#155724",
    marginBottom: 2,
  },
  warningSection: {
    backgroundColor: "#fff3cd",
    borderRadius: 8,
    padding: 12,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#856404",
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: "#856404",
    marginBottom: 2,
  },
  dangerSection: {
    backgroundColor: "#f8d7da",
    borderRadius: 8,
    padding: 12,
  },
  dangerTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#721c24",
    marginBottom: 4,
  },
  dangerText: {
    fontSize: 12,
    color: "#721c24",
    marginBottom: 2,
  },
});

export default HealthTabs;
