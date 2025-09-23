import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { api, get_advice } from '../../apis/assistant';
import { useSelector, useDispatch } from 'react-redux';
import { suggestFoodsByAi, GetCaloFood } from '../../redux/foodAiSlice';
import { fetchBloodSugar, saveBloodSugar } from '../../redux/patientSlice';
import { useNavigation } from '@react-navigation/native';
import { setWithExpiry, getWithExpiry } from '../../components/customizeStorage';
import ApiBooking from '../../apis/ApiBooking';
import { ECharts } from "react-native-echarts-wrapper";

const { width: screenWidth } = Dimensions.get('window');

const Following = ({ user, nearestAppointment }) => {
  const bloodSugar = useSelector((state) => state.patient.bloodSugar);
  const latestReading = bloodSugar?.DT?.bloodSugarData?.[0]?.value || 0;

  const readingStatus = {
    status: latestReading < 6 ? 'normal' : latestReading < 7 ? 'prediabetes' : 'danger',
    color: latestReading < 6 ? '#28a745' : latestReading < 7 ? '#ffc107' : '#dc3545',
    bgColor: latestReading < 6 ? '#d4edda' : latestReading < 7 ? '#fff3cd' : '#f8d7da',
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Theo dõi sức khỏe</Text>
            <Text style={styles.headerSubtitle}>Quản lý chỉ số đường huyết của bạn</Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.readingInfo}>
              <Text style={styles.readingLabel}>Lần đo gần nhất</Text>
              <Text style={[styles.readingValue, { color: readingStatus.color }]}>
                {latestReading ? `${latestReading} mmol/L` : 'N/A'}
              </Text>
            </View>
            <View style={[styles.iconContainer, { backgroundColor: readingStatus.bgColor }]}>
              <Icon name="favorite" size={20} color={readingStatus.color} />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.cardsRow}>
        {/* User Info */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Icon name="person" size={18} color="#007bff" />
            </View>
            <Text style={styles.cardTitle}>Thông tin cá nhân</Text>
          </View>
          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Họ tên:</Text>
              <Text style={styles.infoValue}>{user?.username || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tuổi:</Text>
              <Text style={styles.infoValue}>
                {(() => {
                  if (!user?.dob) return 'N/A';
                  const dob = new Date(user.dob);
                  const today = new Date();
                  let age = today.getFullYear() - dob.getFullYear();
                  const m = today.getMonth() - dob.getMonth();
                  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
                    age--;
                  }
                  return age;
                })()}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Giới tính:</Text>
              <Text style={styles.infoValue}>{user?.gender || 'N/A'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tình trạng:</Text>
              <Text style={[styles.infoValue, { color: '#dc3545' }]}>Tiểu đường type 2</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Bác sĩ:</Text>
              <Text style={styles.infoValue}>
                {nearestAppointment?.doctorId?.userId?.username || 'Chưa có'}
              </Text>
            </View>
          </View>
        </View>

        {/* Appointment */}
        <View style={styles.appointmentCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Icon name="calendar-today" size={18} color="#34c759" />
            </View>
            <Text style={styles.cardTitle}>Lịch hẹn tiếp theo</Text>
          </View>
          {nearestAppointment ? (
            <View style={styles.appointmentContent}>
              <Text style={styles.appointmentDate}>
                {new Date(nearestAppointment.date).toLocaleDateString('vi-VN')}
              </Text>
              <Text style={styles.appointmentTime}>{nearestAppointment.time}</Text>
              <Text style={styles.appointmentInfo}>
                <Text style={styles.boldText}>Bác sĩ:</Text>{' '}
                {nearestAppointment.doctorId?.userId?.username || 'N/A'}
              </Text>
              <Text style={styles.appointmentInfo}>
                <Text style={styles.boldText}>Địa điểm:</Text>{' '}
                {nearestAppointment.type === 'onsite' ? 'Tại phòng khám' : 'Trực tuyến'}
              </Text>
              {nearestAppointment.reason && (
                <Text style={styles.appointmentInfo}>
                  <Text style={styles.boldText}>Lý do:</Text> {nearestAppointment.reason}
                </Text>
              )}
              <View style={styles.reminderContainer}>
                <Icon name="schedule" size={14} color="#dc3545" />
                <Text style={styles.reminderText}>Nhớ chuẩn bị trước 30 phút</Text>
              </View>
            </View>
          ) : (
            <View style={styles.noAppointment}>
              <Text style={styles.noAppointmentText}>Chưa có lịch hẹn sắp tới</Text>
            </View>
          )}
        </View>

        {/* Status */}
        <View style={styles.statusCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <Icon name="activity" size={18} color="#8b5cf6" />
            </View>
            <Text style={styles.cardTitle}>Tình trạng hiện tại</Text>
          </View>
          <View style={[styles.statusContainer, { backgroundColor: readingStatus.bgColor }]}>
            <View style={styles.statusHeader}>
              <Icon
                name={readingStatus.status === 'normal' ? 'check-circle' : 'warning'}
                size={18}
                color={readingStatus.color}
              />
              <Text style={[styles.statusTitle, { color: readingStatus.color }]}>
                {readingStatus.status === 'normal'
                  ? 'Bình thường'
                  : readingStatus.status === 'prediabetes'
                  ? 'Tiền tiểu đường'
                  : 'Cần chú ý'}
              </Text>
            </View>
            <Text style={styles.statusDescription}>
              {readingStatus.status === 'normal'
                ? 'Chỉ số đường huyết trong mức bình thường'
                : readingStatus.status === 'prediabetes'
                ? 'Chỉ số cao hơn bình thường, cần theo dõi'
                : 'Chỉ số cao, cần tham khảo ý kiến bác sĩ'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const bloodSugarDaily = ({ bloodSugar }) => {
  const dailyData = {};

  bloodSugar?.forEach((item) => {
    const date = new Date(item.time);
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

    if (!dailyData[dateKey]) {
      dailyData[dateKey] = { fasting: [], postMeal: [] };
    }

    if (item.type === 'fasting') {
      dailyData[dateKey].fasting.push(item.value);
    } else if (item.type === 'postMeal') {
      dailyData[dateKey].postMeal.push(item.value);
    }
  });

  const sortedDates = Object.keys(dailyData).sort();
  const dates = sortedDates.map((date) => {
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
      .toString()
      .padStart(2, '0')}`;
  });

  const fastingData = sortedDates.map((date) => {
    const values = dailyData[date].fasting;
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
  });

  const postMealData = sortedDates.map((date) => {
    const values = dailyData[date].postMeal;
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;
  });

  return { dates, fastingData, postMealData };
};

const getYesterdayAvg = ({ dailyBloodSugar }) => {
  const len = dailyBloodSugar.dates.length;
  if (len < 1) return null;

  const fasting = dailyBloodSugar.fastingData[len - 1];
  const postMeal = dailyBloodSugar.postMealData[len - 1];

  const avg =
    [fasting, postMeal]
      .filter((v) => v !== null)
      .reduce((a, b) => a + b, 0) /
    ([fasting, postMeal].filter((v) => v !== null).length || 1);

  return { fasting, postMeal, avg };
};

const Chart = ({ bloodSugar }) => {
  let dailyBloodSugar = { dates: [], fastingData: [], postMealData: [] };

  if (bloodSugar?.length > 0) {
    try {
      dailyBloodSugar = bloodSugarDaily({ bloodSugar });
    } catch (error) {
      console.error('Error processing bloodSugar data:', error);
    }
  }

  const last7Labels = dailyBloodSugar.dates.slice(-7);
  const last7Fasting = dailyBloodSugar.fastingData.slice(-7).map((v) => (v == null ? null : Number(v.toFixed(1))));
  const last7Post = dailyBloodSugar.postMealData.slice(-7).map((v) => (v == null ? null : Number(v.toFixed(1))));

  const yValues = [...last7Fasting, ...last7Post].filter((v) => typeof v === 'number' && !isNaN(v));
  const minYRaw = yValues.length ? Math.min(...yValues) : 3.5;
  const maxYRaw = yValues.length ? Math.max(...yValues) : 11.5;
  const padding = 0.6;
  const minY = Math.max(0, Math.floor((minYRaw - padding) * 10) / 10);
  const maxY = Math.ceil((maxYRaw + padding) * 10) / 10;

  const option = {
    backgroundColor: 'transparent',
    color: ['#3b82f6', '#f59e0b'],
    tooltip: {
      trigger: 'axis',
      confine: true,
      backgroundColor: '#111827',
      borderWidth: 0,
      textStyle: { color: '#fff' },
      formatter: (params) => {
        const title = params?.[0]?.axisValueLabel || '';
        const lines = params
          .map((p) => `${p.marker} ${p.seriesName}: ${p.data == null ? 'N/A' : p.data} mmol/L`)
          .join('\n');
        return `${title}\n${lines}`;
      },
    },
    legend: {
      data: ['Lúc đói', 'Sau ăn'],
      top: 0,
      icon: 'circle',
      textStyle: { color: '#6b7280' },
    },
    grid: {
      left: 28,
      right: 12,
      top: 36,
      bottom: 28,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: last7Labels,
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6b7280', fontSize: 10 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      min: minY,
      max: maxY,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#e5e7eb', type: 'dashed' } },
      axisLabel: { color: '#6b7280', fontSize: 10, formatter: '{value} mmol/L' },
    },
    series: [
      {
        name: 'Lúc đói',
        type: 'line',
        smooth: true,
        showSymbol: true,
        symbolSize: 6,
        lineStyle: { width: 2 },
        areaStyle: { opacity: 0.08 },
        data: last7Fasting,
        connectNulls: true,
      },
      {
        name: 'Sau ăn',
        type: 'line',
        smooth: true,
        showSymbol: true,
        symbolSize: 6,
        lineStyle: { width: 2 },
        areaStyle: { opacity: 0.08 },
        data: last7Post,
        connectNulls: true,
      },
    ],
    // Add reference lines using graphic
    graphic: [
      {
        type: 'line',
        left: 0,
        right: 0,
        top: `${((7 - minY) / (maxY - minY)) * 100}%`,
        shape: {
          y1: 0,
          y2: 0,
          x1: 0,
          x2: '100%',
        },
        style: {
          stroke: '#dc3545', // Red for high threshold
          lineWidth: 1,
          lineDash: [4, 4],
        },
        silent: true,
      },
      {
        type: 'text',
        left: '90%',
        top: `${((7 - minY) / (maxY - minY)) * 100}%`,
        style: {
          text: 'Ngưỡng cao',
          fontSize: 10,
          fill: '#dc3545',
          textAlign: 'right',
        },
        silent: true,
      },
      {
        type: 'line',
        left: 0,
        right: 0,
        top: `${((6 - minY) / (maxY - minY)) * 100}%`,
        shape: {
          y1: 0,
          y2: 0,
          x1: 0,
          x2: '100%',
        },
        style: {
          stroke: '#28a745', // Green for normal level
          lineWidth: 1,
          lineDash: [4, 4],
        },
        silent: true,
      },
      {
        type: 'text',
        left: '90%',
        top: `${((6 - minY) / (maxY - minY)) * 100}%`,
        style: {
          text: 'Mức bình thường',
          fontSize: 10,
          fill: '#28a745',
          textAlign: 'right',
        },
        silent: true,
      },
    ],
  };

  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHeader}>
        <View style={styles.chartIconContainer}>
          <Icon name="show-chart" size={20} color="#6366f1" />
        </View>
        <Text style={styles.chartTitle}>Biểu đồ theo dõi</Text>
      </View>
      <View style={styles.chartContainer}>
        <Text style={styles.chartSubtitle}>Chỉ số đường huyết (mmol/L) - 7 ngày gần nhất</Text>
        {dailyBloodSugar.dates.length > 0 ? (
          <ECharts
            option={option}
            style={{ width: screenWidth - 40, height: 220, borderRadius: 16 }}
          />
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
  const [food, setFood] = useState(null);
  const [showAllFood, setShowAllFood] = useState(false);
  const [medicines, setMedicines] = useState({
    sang: [],
    trua: [],
    toi: [],
  });
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigation = useNavigation();

  useEffect(() => {
    const fetchFood = async () => {
      setLoading(true);
      try {

        // Fetch food
        const cached = await getWithExpiry('food');
        if (cached) {
          setFood(JSON.parse(cached));
          setLoading(false);
          return;
        }

        const dailyBloodSugar = bloodSugarDaily({ bloodSugar });
        const yesterday = getYesterdayAvg({ dailyBloodSugar });

        const res = await dispatch(GetCaloFood(user?.userId)).unwrap();
        const data = res?.payload?.DT?.menuFood;

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

          if (response?.payload?.result) {
            await setWithExpiry('food', JSON.stringify(response.payload.result));
            setFood(response.payload.result);
          }
        }
      } catch (error) {
        console.error('Error fetchFood data:', error);
        Alert.alert('Lỗi', 'Không thể tải kế hoạch. Vui lòng thử lại.');
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
            <Text style={styles.adviceText}>{aiPlan?.advice || 'Chưa có lời khuyên'}</Text>
            <Text style={styles.adviceAuthor}>
              — {aiPlan?.assistant_name || 'AI Assistant'}
            </Text>
          </View>

          {/* KẾ HOẠCH THUỐC */}
          <View style={styles.medicineCard}>
            <Text style={styles.medicineTitle}>📋 Kế hoạch dùng thuốc</Text>
            {medicines.sang.length === 0 && medicines.trua.length === 0 && medicines.toi.length === 0 ? (
              <Text style={styles.noMedicineText}>
                Chưa có đơn thuốc. Vui lòng khởi tạo để có thể áp dụng theo dõi.
              </Text>
            ) : (
              <View style={styles.medicineList}>
                <Text style={styles.medicineItem}>
                  <Text style={styles.boldText}>Sáng:</Text>{' '}
                  {medicines.sang.length > 0 ? medicines.sang.join(', ') : 'Không dùng'}
                </Text>
                <Text style={styles.medicineItem}>
                  <Text style={styles.boldText}>Trưa:</Text>{' '}
                  {medicines.trua.length > 0 ? medicines.trua.join(', ') : 'Không dùng'}
                </Text>
                <Text style={styles.medicineItem}>
                  <Text style={styles.boldText}>Tối:</Text>{' '}
                  {medicines.toi.length > 0 ? medicines.toi.join(', ') : 'Không dùng'}
                </Text>
              </View>
            )}
            <View style={styles.buttonContainer}>
              {medicines.sang.length === 0 && medicines.trua.length === 0 && medicines.toi.length === 0 ? (
                <TouchableOpacity
                  style={styles.diagnosisButton}
                  onPress={() => navigation.navigate('Trợ lý AI')}
                  accessibilityLabel="Chẩn đoán"
                  accessibilityRole="button"
                >
                  <Text style={styles.diagnosisButtonText}>Chẩn đoán</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.appliedButton}
                  disabled
                  accessibilityLabel="Đã áp dụng đơn thuốc"
                  accessibilityRole="button"
                >
                  <Text style={styles.appliedButtonText}>Đã áp dụng</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* KẾ HOẠCH DINH DƯỠNG */}
          <View style={styles.nutritionCard}>
            <Text style={styles.nutritionTitle}>🥗 Kế hoạch dinh dưỡng</Text>
            {food?.chosen?.length > 0 ? (
              <View>
                <Text style={styles.calorieInfo}>
                  <Text style={styles.boldText}>Calo/ngày:</Text> {food.sum} calo
                </Text>
                <View style={styles.foodList}>
                  {food.chosen.slice(0, showAllFood ? undefined : 5).map((item, idx) => (
                    <Text key={idx} style={styles.foodItem}>
                      <Text style={styles.boldText}>{item.name}:</Text> ({item.calo} calo) - {item.weight}g
                    </Text>
                  ))}
                </View>
                {food.chosen.length > 5 && (
                  <View style={styles.expandButtonContainer}>
                    <TouchableOpacity
                      style={styles.expandButton}
                      onPress={() => setShowAllFood(!showAllFood)}
                      accessibilityLabel={showAllFood ? 'Thu gọn danh sách thực phẩm' : 'Xem thêm thực phẩm'}
                      accessibilityRole="button"
                    >
                      <Text style={styles.expandButtonText}>
                        {showAllFood ? 'Thu gọn' : `Xem thêm (${food.chosen.length - 5} món)`}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              <TouchableOpacity
                style={styles.exploreButton}
                onPress={() => navigation.navigate('Dinh dưỡng')}
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
  const [messageInput, setMessageInput] = useState('');
  const [aiPlan, setAiPlan] = useState({});
  const [measurementType, setMeasurementType] = useState('before');
  const [bloodSugar, setBloodSugar] = useState([]);
  const [nearestAppointment, setNearestAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const user = useSelector((state) => state.auth.user);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.userId) {
        console.log('No userId, skipping data fetch');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch blood sugar data
        const [postMealRes, fastingRes] = await Promise.all([
          dispatch(fetchBloodSugar({ userId: user.userId, type: 'postMeal', days: 7 })).unwrap(),
          dispatch(fetchBloodSugar({ userId: user.userId, type: 'fasting', days: 7 })).unwrap(),
        ]);

        const allData = [];
        const postMealData = postMealRes?.DT?.bloodSugarData || postMealRes?.DT || postMealRes || [];
        const fastingData = fastingRes?.DT?.bloodSugarData || fastingRes?.DT || fastingRes || [];

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
        console.error('Error fetching data:', error);
        Alert.alert('Lỗi', 'Không thể tải dữ liệu. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.userId, dispatch]);

  const handleAiAgent = async () => {
    if (messageInput.trim() === '') {
      Alert.alert('Lỗi', 'Vui lòng nhập chỉ số đường huyết');
      return;
    }

    const inputValue = parseFloat(messageInput.trim());
    if (isNaN(inputValue)) {
      Alert.alert('Lỗi', 'Chỉ số đường huyết không hợp lệ');
      return;
    }

    const inputType = measurementType;
    let result = '';

    if (inputType === 'before') {
      if (inputValue < 3.9) result = '<3,9';
      else if (inputValue >= 3.9 && inputValue <= 5.6) result = '3,9 – 5,6';
      else if (inputValue > 5.6 && inputValue <= 6.9) result = '5,7 – 6,9';
      else result = '>=7';
    } else {
      if (inputValue < 3.9) result = '<3,9';
      else if (inputValue >= 3.9 && inputValue <= 7.7) result = '3,9 – 7,7';
      else if (inputValue > 7.8 && inputValue <= 11) result = '7,8 - 11';
      else result = '>11';
    }

    setLoading(true);
    try {
      await dispatch(
        saveBloodSugar({
          userId: user?.userId,
          value: inputValue,
          type: inputType === 'before' ? 'fasting' : 'postMeal',
          time: new Date().toISOString(),
        })
      ).unwrap();

      const res = await get_advice.post('/mess-fb-new', {
        message: {
          input: inputValue,
          measurementType: inputType,
          type: result,
        },
      });

      setAiPlan(res.data);
      setMessageInput('');
      Alert.alert('Thành công', 'Đã lưu chỉ số đường huyết thành công!');

      // Refresh blood sugar data
      const [postMealRes, fastingRes] = await Promise.all([
        dispatch(fetchBloodSugar({ userId: user.userId, type: 'postMeal', days: 7 })).unwrap(),
        dispatch(fetchBloodSugar({ userId: user.userId, type: 'fasting', days: 7 })).unwrap(),
      ]);

      const allData = [];
      const postMealData = postMealRes?.DT?.bloodSugarData || postMealRes?.DT || postMealRes || [];
      const fastingData = fastingRes?.DT?.bloodSugarData || fastingRes?.DT || fastingRes || [];

      if (Array.isArray(postMealData)) allData.push(...postMealData);
      if (Array.isArray(fastingData)) allData.push(...fastingData);

      setBloodSugar(allData);
    } catch (error) {
      console.error('API error:', error);
      Alert.alert('Lỗi', 'Có lỗi xảy ra khi lưu dữ liệu. Vui lòng thử lại!');
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
    <ScrollView style={styles.mainContainer} contentContainerStyle={styles.contentContainer}>
      <Following user={user} nearestAppointment={nearestAppointment} />
      <Chart bloodSugar={bloodSugar} />
      <View style={styles.bottomSection}>
        <View style={styles.inputCard}>
          <Text style={styles.inputTitle}>Nhập chỉ số mới</Text>
          <View style={styles.inputRow}>
            <View style={styles.pickerContainer}>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => setMeasurementType(measurementType === 'before' ? 'after' : 'before')}
                accessibilityLabel="Chọn loại đo đường huyết"
                accessibilityRole="button"
              >
                <Text style={styles.pickerText}>
                  {measurementType === 'before' ? 'Trước ăn' : 'Sau ăn'}
                </Text>
                <Icon name="keyboard-arrow-down" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.textInput, { borderColor: measurementType === 'before' ? '#007bff' : '#ffc107' }]}
              placeholder="Nhập chỉ số đường huyết"
              value={messageInput}
              onChangeText={setMessageInput}
              keyboardType="numeric"
              onSubmitEditing={handleAiAgent}
              accessibilityLabel="Nhập chỉ số đường huyết (mmol/L)"
            />

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.disabledButton]}
              onPress={handleAiAgent}
              disabled={loading}
              accessibilityLabel="Lưu chỉ số đường huyết"
              accessibilityRole="button"
            >
              <Text style={styles.saveButtonText}>{loading ? 'Đang lưu...' : 'Lưu'}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoContainer}>
            <Icon name="info" size={14} color="#6c757d" />
            <Text style={styles.infoText}>Nhập chỉ số đường huyết theo đơn vị mmol/L</Text>
          </View>
          {aiPlan && <Plan aiPlan={aiPlan} user={user} bloodSugar={bloodSugar} />}
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Thông tin thêm</Text>
          <View style={styles.infoSections}>
            <View style={styles.normalSection}>
              <Text style={styles.normalTitle}>Chỉ số bình thường</Text>
              <Text style={styles.normalText}>Đường huyết lúc đói: 3.9 - 5.5 mmol/L</Text>
              <Text style={styles.normalText}>Đường huyết sau ăn 2h: &lt; 7.8 mmol/L</Text>
            </View>
            <View style={styles.warningSection}>
              <Text style={styles.warningTitle}>Chỉ số tiền tiểu đường</Text>
              <Text style={styles.warningText}>Đường huyết lúc đói: 5.6 - 6.9 mmol/L</Text>
              <Text style={styles.warningText}>Đường huyết sau ăn 2h: 7.8 - 11.0 mmol/L</Text>
            </View>
            <View style={styles.dangerSection}>
              <Text style={styles.dangerTitle}>Chỉ số tiểu đường</Text>
              <Text style={styles.dangerText}>Đường huyết lúc đói: ≥ 7.0 mmol/L</Text>
              <Text style={styles.dangerText}>Đường huyết sau ăn 2h: ≥ 11.1 mmol/L</Text>
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
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    paddingBottom: 20,
  },
  container: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: '#007bff',
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  readingInfo: {
    alignItems: 'flex-end',
  },
  readingLabel: {
    fontSize: 12,
    color: '#6c757d',
  },
  readingValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appointmentCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  infoList: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  infoValue: {
    fontSize: 14,
    color: '#212529',
    fontWeight: '500',
  },
  appointmentContent: {
    alignItems: 'center',
  },
  appointmentDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  appointmentTime: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  appointmentInfo: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
    textAlign: 'center',
  },
  boldText: {
    fontWeight: 'bold',
  },
  reminderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  reminderText: {
    fontSize: 12,
    color: '#dc3545',
  },
  noAppointment: {
    alignItems: 'center',
  },
  noAppointmentText: {
    fontSize: 14,
    color: '#6c757d',
  },
  statusContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statusDescription: {
    fontSize: 12,
    color: '#6c757d',
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  chartIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#ede7f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  chartContainer: {
    alignItems: 'center',
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#6c757d',
  },
  bottomSection: {
    flexDirection: 'column',
    gap: 16,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  inputCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  inputTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  pickerContainer: {
    minWidth: 100,
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
  },
  pickerText: {
    fontSize: 14,
    color: '#495057',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#ffffff',
  },
  saveButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  disabledButton: {
    backgroundColor: '#6c757d',
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#6c757d',
  },
  adviceCard: {
    backgroundColor: '#f8d7da',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  adviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#721c24',
    marginBottom: 4,
  },
  adviceText: {
    fontSize: 14,
    color: '#721c24',
    marginBottom: 4,
  },
  adviceAuthor: {
    fontSize: 12,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  medicineCard: {
    backgroundColor: '#d4edda',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  medicineTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#155724',
    marginBottom: 8,
  },
  noMedicineText: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 8,
  },
  medicineList: {
    marginBottom: 12,
    paddingLeft: 16,
  },
  medicineItem: {
    fontSize: 14,
    color: '#155724',
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  diagnosisButton: {
    backgroundColor: '#28a745',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  diagnosisButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  appliedButton: {
    backgroundColor: '#28a745',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    opacity: 0.6,
  },
  appliedButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  nutritionCard: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  nutritionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  calorieInfo: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 8,
  },
  foodList: {
    marginTop: 8,
  },
  foodItem: {
    fontSize: 12,
    color: '#856404',
    marginBottom: 4,
  },
  expandButtonContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  expandButton: {
    backgroundColor: '#ffc107',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  expandButtonText: {
    color: '#212529',
    fontSize: 12,
    fontWeight: '600',
  },
  exploreButton: {
    backgroundColor: '#ffc107',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  exploreButtonText: {
    color: '#212529',
    fontSize: 12,
    fontWeight: '600',
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  infoSections: {
    gap: 12,
  },
  normalSection: {
    backgroundColor: '#d4edda',
    borderRadius: 8,
    padding: 12,
  },
  normalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#155724',
    marginBottom: 4,
  },
  normalText: {
    fontSize: 12,
    color: '#155724',
    marginBottom: 2,
  },
  warningSection: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 12,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#856404',
    marginBottom: 2,
  },
  dangerSection: {
    backgroundColor: '#f8d7da',
    borderRadius: 8,
    padding: 12,
  },
  dangerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#721c24',
    marginBottom: 4,
  },
  dangerText: {
    fontSize: 12,
    color: '#721c24',
    marginBottom: 2,
  },
});

export default HealthTabs;