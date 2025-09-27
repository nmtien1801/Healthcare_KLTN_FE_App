import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { ECharts } from "react-native-echarts-wrapper";
import ApiDoctor from "../../apis/ApiDoctor";

// Dữ liệu mẫu fallback
const fallbackRevenueData = {
  week: {
    xAxisData: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
    data: [5.2, 8.9, 7.0, 9.3, 12.5, 4.8, 2.1].map((v) => v * 1000000),
  },
  month: {
    xAxisData: ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6"],
    data: [50, 60, 55, 70, 65, 80].map((v) => v * 1000000),
  },
  year: {
    xAxisData: ["2024-09", "2024-10", "2024-11", "2024-12", "2025-01", "2025-02", "2025-03", "2025-04", "2025-05", "2025-06", "2025-07", "2025-08", "2025-09"],
    data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1500000],
  },
};

const fallbackHealthData = {
  xAxisData: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
  bloodPressureData: [160, 162, 158, 165, 160, 163, 159],
  heartRateData: [92, 90, 93, 89, 91, 92, 90],
  bloodSugarData: [6.8, 7.0, 6.7, 7.2, 6.9, 7.1, 6.8],
};

export default function OverviewTab() {
  const [revenuePeriod, setRevenuePeriod] = useState("week");
  const [healthPeriod, setHealthPeriod] = useState("week");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patients, setPatients] = useState([]);
  const [summary, setSummary] = useState({
    newPatients: 0,
    newPatientsChange: "",
    appointmentsToday: 0,
    upcomingAppointments: 0,
    monthlyRevenue: "0 đ",
    monthlyRevenueChange: "",
  });
  const [revenueData, setRevenueData] = useState({ week: {}, month: {}, year: {} });
  const [healthData, setHealthData] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const patientsPerPage = 3;
  const chartRef = useRef(null); // Thêm ref để kiểm tra render

  // Fetch summary
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await ApiDoctor.getSummary();
        if (
          res &&
          typeof res === "object" &&
          "newPatients" in res &&
          "appointmentsToday" in res &&
          "upcomingAppointments" in res &&
          "monthlyRevenue" in res
        ) {
          setSummary(res);
        } else {
          console.error("Response summary không hợp lệ:", res);
        }
      } catch (err) {
        console.error("Lỗi fetch summary:", err);
      }
    };
    fetchSummary();
  }, []);

  // Fetch patients
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await ApiDoctor.getPatientsAttention();
        const patientsData = Array.isArray(res) ? res : [];
        setPatients(patientsData);
        setSelectedPatient(patientsData.length > 0 ? patientsData[0] : null);
      } catch (err) {
        console.error("Lỗi fetch patients:", err);
        setPatients([]);
      }
    };
    fetchPatients();
  }, []);

  // Fetch revenue
  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const [weekRes, monthRes, yearRes] = await Promise.all([
          ApiDoctor.getRevenue("week"),
          ApiDoctor.getRevenue("month"),
          ApiDoctor.getRevenue("year"),
        ]);

        const newRevenueData = {
          week: weekRes && Array.isArray(weekRes.xAxisData) && Array.isArray(weekRes.data)
            ? weekRes
            : fallbackRevenueData.week,
          month: monthRes && Array.isArray(monthRes.xAxisData) && Array.isArray(monthRes.data)
            ? monthRes
            : fallbackRevenueData.month,
          year: yearRes && Array.isArray(yearRes.xAxisData) && Array.isArray(yearRes.data)
            ? yearRes
            : fallbackRevenueData.year,
        };

        console.log("Revenue Data:", JSON.stringify(newRevenueData, null, 2));
        setRevenueData(newRevenueData);
      } catch (err) {
        console.error("Lỗi fetch revenue:", err);
        setRevenueData(fallbackRevenueData); // Sử dụng fallback nếu lỗi
      } finally {
        setLoading(false);
      }
    };
    fetchRevenue();
  }, []);

  // Fetch health data
  useEffect(() => {
    if (selectedPatient) {
      const fetchHealth = async () => {
        try {
          const res = await ApiDoctor.getPatientHealth(selectedPatient._id || selectedPatient.id, healthPeriod);
          console.log("Health Data:", res);
          setHealthData(res || fallbackHealthData);
        } catch (err) {
          console.error("Lỗi fetch health:", err);
          setHealthData(fallbackHealthData);
        }
      };
      fetchHealth();
    }
  }, [selectedPatient, healthPeriod]);

  // Logic phân trang
  const totalPages = Math.ceil(patients.length / patientsPerPage);
  const startIndex = (currentPage - 1) * patientsPerPage;
  const endIndex = startIndex + patientsPerPage;
  const displayedPatients = patients.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Chart options for revenue
  const getRevenueChartOptions = (period) => {
    const data = revenueData[period] || { xAxisData: [], data: [] };
    console.log(`Revenue Chart Data (${period}):`, JSON.stringify(data, null, 2));

    return {
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
      },
      grid: {
        left: "5%",
        right: "5%",
        bottom: "20%", // Tăng bottom để đủ chỗ cho nhãn trục X
        top: "10%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        data: data.xAxisData || [],
        axisLabel: {
          rotate: 45, // Xoay nhãn để tránh chồng lấn
          fontSize: 10,
          color: "#1f2937",
        },
        axisTick: { alignWithLabel: true },
      },
      yAxis: {
        type: "value",
        min: 0, // Đặt min để đảm bảo hiển thị cột nhỏ
        max: Math.max(...data.data, 2000000), // Đặt max dựa trên dữ liệu hoặc giá trị tối thiểu
        axisLabel: {
          formatter: (value) => `${(value / 1000000).toFixed(1)}M`,
          color: "#1f2937",
        },
      },
      series: [
        {
          name: "Doanh thu",
          type: "bar",
          barWidth: "60%",
          data: data.data || [],
          itemStyle: {
            color: "#2563eb",
          },
        },
      ],
    };
  };

  // Chart options for health
  const getHealthChartOptions = () => {
    console.log("Health Chart Option:", healthData); // Debug
    return {
      tooltip: { trigger: "axis" },
      legend: {
        data: ["Huyết áp", "Nhịp tim", "Đường huyết"],
        top: "5%",
        textStyle: { fontSize: 12, color: "#1f2937" },
      },
      grid: { left: "5%", right: "5%", bottom: "15%", top: "20%", containLabel: true },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: healthData.xAxisData || [],
        axisLabel: { rotate: 45, fontSize: 10 },
      },
      yAxis: {
        type: "value",
        axisLabel: { fontSize: 10 },
      },
      series: [
        {
          name: "Huyết áp",
          type: "line",
          data: healthData.bloodPressureData || [],
          itemStyle: { color: "#dc2626" },
        },
        {
          name: "Nhịp tim",
          type: "line",
          data: healthData.heartRateData || [],
          itemStyle: { color: "#7c3aed" },
        },
        {
          name: "Đường huyết",
          type: "line",
          data: healthData.bloodSugarData || [],
          itemStyle: { color: "#059669" },
        },
      ],
    };
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Tổng quan</Text>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        {[
          { icon: "👤", title: "Bệnh nhân mới", value: summary.newPatients, change: summary.newPatientsChange, color: "#2563eb" },
          { icon: "📅", title: "Cuộc hẹn hôm nay", value: summary.appointmentsToday, change: `${summary.upcomingAppointments} cuộc hẹn sắp tới`, color: "#d97706" },
          { icon: "💰", title: "Doanh thu tháng", value: summary.monthlyRevenue, change: summary.monthlyRevenueChange, color: "#059669" },
        ].map((item, index) => (
          <View key={index} style={styles.summaryCard}>
            <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
              <Text style={[styles.icon, { color: item.color }]}>{item.icon}</Text>
            </View>
            <View>
              <Text style={styles.summaryTitle}>{item.title}</Text>
              <Text style={styles.summaryValue}>{item.value}</Text>
              <Text style={styles.summaryChange}>{item.change}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Revenue Chart */}
      <View style={styles.card}>
        <View style={styles.chartHeader}>
          <Text style={styles.sectionTitle}>Doanh thu theo ngày</Text>
          <View style={styles.dropdownContainer}>
            <Picker
              selectedValue={revenuePeriod}
              onValueChange={(value) => setRevenuePeriod(value)}
              style={styles.picker}
            >
              <Picker.Item label="Tuần này" value="week" />
              <Picker.Item label="Tháng này" value="month" />
              <Picker.Item label="Năm nay" value="year" />
            </Picker>
          </View>
        </View>
        <View style={styles.chartContainer}>
          {revenueData[revenuePeriod]?.data?.length > 0 ? (
            <ECharts
              option={getRevenueChartOptions(revenuePeriod)}
              style={styles.chart}
              backgroundColor="#ffffff" // Đặt màu nền để đảm bảo hiển thị
              onLoad={(echart) => console.log("Revenue EChart loaded:", echart)}
            />
          ) : (
            <Text style={styles.noDataText}>Không có dữ liệu để hiển thị</Text>
          )}
        </View>
      </View>

      {/* Health Chart and Patient List */}
      <View style={styles.card}>
        <View style={styles.chartHeader}>
          <Text style={styles.sectionTitle}>Chỉ số sức khỏe: {selectedPatient?.name || "Chưa chọn"}</Text>
          <View style={styles.dropdownContainer}>
            <Picker
              selectedValue={healthPeriod}
              onValueChange={(value) => setHealthPeriod(value)}
              style={styles.picker}
            >
              <Picker.Item label="Tuần này" value="week" />
              <Picker.Item label="Tháng này" value="month" />
              <Picker.Item label="Năm nay" value="year" />
            </Picker>
          </View>
        </View>
        <View style={styles.chartContainer}>
          <ECharts
            option={getHealthChartOptions()}
            style={styles.chart}
            onLoad={(echart) => console.log("EChart loaded:", echart)} // Debug khi load
          />
          {!healthData?.bloodPressureData?.length && (
            <Text style={styles.noDataText}>Không có dữ liệu để hiển thị</Text>
          )}
        </View>
      </View>

      {/* Patient List */}
      <View style={styles.card}>
        <View style={styles.chartHeader}>
          <View>
            <Text style={styles.sectionTitle}>⚠️ Bệnh nhân cần chú ý</Text>
            <Text style={styles.sectionSubtitle}>Tổng {patients.length} bệnh nhân</Text>
          </View>
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.patientListContainer}>
          {displayedPatients.map((patient) => (
            <TouchableOpacity
              key={patient._id || patient.id}
              style={[styles.patientRow, patient.name === selectedPatient?.name ? styles.selectedPatient : null]}
              onPress={() => setSelectedPatient(patient)}
            >
              <View style={styles.patientImageContainer}>
                <Image source={{ uri: patient.image }} style={styles.patientImage} />
                {patient.name === selectedPatient?.name && <View style={styles.selectedIndicator} />}
              </View>
              <View style={styles.patientInfo}>
                <Text style={styles.patientName}>{patient.name}</Text>
                <Text style={styles.patientAge}>{patient.age} tuổi</Text>
                <View style={styles.healthMetrics}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Huyết áp:</Text>
                    <Text
                      style={[
                        styles.metricValue,
                        patient.bloodPressure.includes("160") ||
                          patient.bloodPressure.includes("150") ||
                          patient.bloodPressure.includes("145") ||
                          patient.bloodPressure.includes("140")
                          ? styles.dangerText
                          : patient.bloodPressure.includes("120")
                            ? styles.goodText
                            : styles.warningText,
                      ]}
                    >
                      {patient.bloodPressure}
                    </Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Nhịp tim:</Text>
                    <Text style={styles.metricValue}>{patient.heartRate} bpm</Text>
                  </View>
                </View>
                <View style={[styles.statusContainer, { backgroundColor: `${patient.statusColor}15` }]}>
                  <View style={[styles.statusDot, { backgroundColor: patient.statusColor }]} />
                  <Text style={[styles.statusText, { color: patient.statusColor }]}>{patient.warning || patient.status}</Text>
                </View>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={[styles.actionButton, styles.callButton]} onPress={() => Linking.openURL(`tel:${patient.phone}`)}>
                  <Text style={styles.actionIcon}>📞</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionButton, styles.messageButton]} onPress={() => Linking.openURL(`sms:${patient.phone}`)}>
                  <Text style={styles.actionIcon}>💬</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Pagination */}
        {totalPages > 1 && (
          <View style={styles.paginationContainer}>
            <TouchableOpacity
              style={[styles.paginationButton, currentPage === 1 && styles.disabledButton]}
              onPress={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <Text style={[styles.paginationText, currentPage === 1 && styles.disabledText]}>‹</Text>
            </TouchableOpacity>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <TouchableOpacity
                key={page}
                style={[styles.paginationButton, page === currentPage && styles.activePaginationButton]}
                onPress={() => handlePageChange(page)}
              >
                <Text style={[styles.paginationText, page === currentPage && styles.activePaginationText]}>{page}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.paginationButton, currentPage === totalPages && styles.disabledButton]}
              onPress={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <Text style={[styles.paginationText, currentPage === totalPages && styles.disabledText]}>›</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// Styles (thêm style cho noDataText)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 16,
  },
  card: {
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
  summaryContainer: {
    marginBottom: 16,
    marginTop: 12,
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    padding: 10,
    borderRadius: 10,
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  summaryTitle: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  summaryChange: {
    fontSize: 12,
    color: "#059669",
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },
  dropdownContainer: {
    width: 120,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "#ffffff",
  },
  picker: {
    height: 40,
    fontSize: 14,
  },
  chartContainer: {
    width: "100%",
    height: 280,
    position: "relative", // Để hiển thị noDataText
  },
  chart: {
    width: Dimensions.get("window").width - 32,
    height: 260,
  },
  noDataText: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -50 }, { translateY: -10 }],
    color: "#6b7280",
    fontSize: 14,
    textAlign: "center",
  },
  patientRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#f9fafb",
  },
  selectedPatient: {
    backgroundColor: "#eff6ff",
  },
  patientImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  patientAge: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  healthMetrics: {
    marginBottom: 8,
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
    marginRight: 8,
    minWidth: 70,
  },
  metricValue: {
    fontSize: 13,
    color: "#1f2937",
    fontWeight: "600",
  },
  goodText: {
    color: "#059669",
    fontWeight: "600",
  },
  dangerText: {
    color: "#dc2626",
    fontWeight: "600",
  },
  warningText: {
    color: "#d97706",
    fontWeight: "600",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  actionButtons: {
    flexDirection: "row",
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  actionIcon: {
    fontSize: 20,
    color: "#2563eb",
  },
  viewAllButton: {
    padding: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: "#2563eb",
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: "#4b5563",
  },
  patientListContainer: {
    marginTop: 8,
  },
  patientImageContainer: {
    position: "relative",
    marginRight: 12,
  },
  selectedIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#059669",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  paginationButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  activePaginationButton: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  disabledButton: {
    backgroundColor: "#f9fafb",
    borderColor: "#e5e7eb",
  },
  paginationText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  activePaginationText: {
    color: "#ffffff",
  },
  disabledText: {
    color: "#9ca3af",
  },
});