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
import { BarChart, LineChart } from "react-native-chart-kit";
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
  const [showRevenueDropdown, setShowRevenueDropdown] = useState(false);
  const [showHealthDropdown, setShowHealthDropdown] = useState(false);
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
        console.log("Week data:", newRevenueData.week);
        console.log("Month data:", newRevenueData.month);
        console.log("Year data:", newRevenueData.year);
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

  // Custom Dropdown Component
  const CustomDropdown = ({
    options,
    selectedValue,
    onSelect,
    isVisible,
    onToggle,
    placeholder = "Chọn khoảng thời gian"
  }) => {
    const getDisplayText = (value) => {
      const option = options.find(opt => opt.value === value);
      return option ? option.label : placeholder;
    };

    return (
      <View style={styles.dropdownWrapper}>
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={onToggle}
          activeOpacity={0.7}
        >
          <Text style={styles.dropdownButtonText}>{getDisplayText(selectedValue)}</Text>
          <Text style={styles.dropdownArrow}>{isVisible ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {isVisible && (
          <View style={styles.dropdownMenu}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.dropdownItem,
                  selectedValue === option.value && styles.dropdownItemSelected
                ]}
                onPress={() => {
                  onSelect(option.value);
                  onToggle();
                }}
              >
                <Text style={[
                  styles.dropdownItemText,
                  selectedValue === option.value && styles.dropdownItemTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  // Get chart data for revenue
  const getRevenueChartData = (period) => {
    const data = revenueData[period] || { xAxisData: [], data: [] };
    console.log(`Revenue Chart Data (${period}):`, JSON.stringify(data, null, 2));
    console.log(`Data length: ${data.data?.length}, xAxisData length: ${data.xAxisData?.length}`);

    // Sử dụng fallback data nếu không có data
    const chartData = data.data && data.data.length > 0 ? data.data : [1000000, 2000000, 1500000, 3000000, 2500000, 1800000, 2200000];
    let chartLabels = data.xAxisData && data.xAxisData.length > 0 ? data.xAxisData : ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

    // Rút gọn nhãn nếu quá dài
    chartLabels = chartLabels.map(label => {
      if (typeof label === 'string' && label.length > 8) {
        return label.substring(0, 6) + '...';
      }
      return label;
    });

    console.log("Using chart data:", chartData);
    console.log("Using chart labels:", chartLabels);

    return {
      labels: chartLabels,
      data: chartData
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
      onScrollBeginDrag={() => {
        setShowRevenueDropdown(false);
        setShowHealthDropdown(false);
      }}
    >
      <Text style={styles.title}>Tổng quan</Text>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        {[
          { icon: "👤", title: "Bệnh nhân mới", value: summary.newPatients, change: summary.newPatientsChange, color: "#2563eb" },
          { icon: "📅", title: "Cuộc hẹn hôm nay", value: summary.appointmentsToday, change: `${summary.upcomingAppointments} sắp tới`, color: "#d97706" },
          { icon: "💰", title: "Doanh thu tháng", value: summary.monthlyRevenue, change: summary.monthlyRevenueChange, color: "#059669" },
        ].map((item, index) => (
          <View key={index} style={[styles.summaryCard, { borderLeftColor: item.color }]}>
            <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
              <Text style={[styles.icon, { color: item.color }]}>{item.icon}</Text>
            </View>
            <Text style={styles.summaryTitle}>{item.title}</Text>
            <Text style={styles.summaryValue}>{item.value}</Text>
            <Text style={styles.summaryChange}>{item.change}</Text>
          </View>
        ))}
      </View>


      {/* Revenue Chart */}
      <View style={styles.card}>
        <View style={styles.chartHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.sectionTitle}>📊 Doanh thu</Text>
            <Text style={styles.sectionSubtitle}>Theo khoảng thời gian</Text>
          </View>
          <CustomDropdown
            options={[
              { label: "Tuần này", value: "week" },
              { label: "Tháng này", value: "month" },
              { label: "Năm nay", value: "year" }
            ]}
            selectedValue={revenuePeriod}
            onSelect={setRevenuePeriod}
            isVisible={showRevenueDropdown}
            onToggle={() => {
              setShowRevenueDropdown(!showRevenueDropdown);
              setShowHealthDropdown(false);
            }}
            placeholder="Chọn thời gian"
          />
        </View>
        <View style={styles.chartContainer}>
          {(() => {
            const chartData = getRevenueChartData(revenuePeriod);
            return (
              <BarChart
                data={{
                  labels: chartData.labels,
                  datasets: [
                    {
                      data: chartData.data.map(value => value / 1000000), // Convert to millions
                    }
                  ]
                }}
                width={Dimensions.get("window").width - 64}
                height={240}
                yAxisLabel=""
                yAxisSuffix="M"
                chartConfig={{
                  backgroundColor: "#ffffff",
                  backgroundGradientFrom: "#ffffff",
                  backgroundGradientTo: "#ffffff",
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: "6",
                    strokeWidth: "2",
                    stroke: "#2563eb"
                  },
                  propsForLabels: {
                    fontSize: 10,
                    rotation: chartData.labels.length > 6 ? -45 : 0,
                  }
                }}
                style={styles.chart}
                fromZero
                showValuesOnTopOfBars={false}
                withInnerLines={true}
                withVerticalLabels={true}
                withHorizontalLabels={true}
                segments={4}
              />
            );
          })()}
        </View>
      </View>

      {/* Health Chart and Patient List */}
      <View style={styles.card}>
        <View style={styles.chartHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.sectionTitle}>❤️ Chỉ số sức khỏe</Text>
            <Text style={styles.sectionSubtitle}>
              {selectedPatient?.name || "Chưa chọn bệnh nhân"}
            </Text>
          </View>
          <CustomDropdown
            options={[
              { label: "Tuần này", value: "week" },
              { label: "Tháng này", value: "month" },
              { label: "Năm nay", value: "year" }
            ]}
            selectedValue={healthPeriod}
            onSelect={setHealthPeriod}
            isVisible={showHealthDropdown}
            onToggle={() => {
              setShowHealthDropdown(!showHealthDropdown);
              setShowRevenueDropdown(false); // Close other dropdown
            }}
            placeholder="Chọn thời gian"
          />
        </View>
        <View style={styles.chartContainer}>
          {healthData?.bloodPressureData?.length > 0 ? (
            <LineChart
              data={{
                labels: healthData.xAxisData || ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
                datasets: [
                  {
                    data: healthData.bloodPressureData || [160, 162, 158, 165, 160, 163, 159],
                    color: (opacity = 1) => `rgba(220, 38, 38, ${opacity})`, // Red for blood pressure
                    strokeWidth: 2
                  },
                  {
                    data: healthData.heartRateData || [92, 90, 93, 89, 91, 92, 90],
                    color: (opacity = 1) => `rgba(124, 58, 237, ${opacity})`, // Purple for heart rate
                    strokeWidth: 2
                  },
                  {
                    data: healthData.bloodSugarData || [6.8, 7.0, 6.7, 7.2, 6.9, 7.1, 6.8],
                    color: (opacity = 1) => `rgba(5, 150, 105, ${opacity})`, // Green for blood sugar
                    strokeWidth: 2
                  }
                ]
              }}
              width={Dimensions.get("window").width - 64}
              height={240} // Tăng chiều cao
              chartConfig={{
                backgroundColor: "#ffffff",
                backgroundGradientFrom: "#ffffff",
                backgroundGradientTo: "#ffffff",
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
                style: {
                  borderRadius: 16
                },
                propsForLabels: {
                  fontSize: 10,
                  rotation: (healthData.xAxisData?.length || 7) > 6 ? -45 : 0, // Xoay nhãn nếu quá nhiều
                }
              }}
              style={styles.chart}
              withInnerLines={true}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              segments={4} // Giảm số đường ngang
            />
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>Không có dữ liệu để hiển thị</Text>
              <Text style={styles.noDataSubtext}>Vui lòng chọn bệnh nhân khác</Text>
            </View>
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
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 12,
  },

  summaryCard: {
    flex: 1,
    marginHorizontal: 6,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderLeftWidth: 4, // nhấn màu theo loại card
  },

  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  icon: {
    fontSize: 20,
  },

  summaryTitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
    textAlign: "center",
  },

  summaryValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 2,
  },

  summaryChange: {
    fontSize: 13,
    color: "#1b9c28ff",
  },

  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  dropdownWrapper: {
    position: "relative",
    zIndex: 1000,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 140,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    flex: 1,
  },
  dropdownArrow: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 8,
  },
  dropdownMenu: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    marginTop: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1001,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  dropdownItemSelected: {
    backgroundColor: "#eff6ff",
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  dropdownItemTextSelected: {
    color: "#2563eb",
    fontWeight: "600",
  },
  chartContainer: {
    width: "100%",
    height: 320,
    position: "relative",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    overflow: "visible",
    paddingBottom: 20,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  noDataText: {
    color: "#6b7280",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  noDataSubtext: {
    color: "#9ca3af",
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