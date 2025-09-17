import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  ActivityIndicator,
} from "react-native";
import { ECharts } from "react-native-echarts-wrapper";
import ApiDoctor from "../../apis/ApiDoctor";

// Mock data (giữ nguyên từ mã gốc)
const mockData = {
  revenue: {
    week: {
      xAxisData: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
      data: [5.2, 8.9, 7.0, 9.3, 12.5, 4.8, 2.1].map((v) => v * 1000000),
    },
    month: {
      xAxisData: Array.from({ length: 30 }, (_, i) => `${i + 1}/07`),
      data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 10 + 3) * 1000000),
    },
    year: {
      xAxisData: ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"],
      data: Array.from({ length: 12 }, () => Math.floor(Math.random() * 50 + 20) * 1000000),
    },
  },
  health: {
    patients: [
      {
        name: "Trần Văn Bình",
        age: 68,
        bloodPressure: "160/95",
        heartRate: 92,
        warning: "Huyết áp cao",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        phone: "0123456789",
        week: {
          xAxisData: ["19/06", "20/06", "21/06", "22/06", "23/06", "24/06", "25/06"],
          bloodPressureData: [160, 162, 158, 165, 160, 163, 159],
          heartRateData: [92, 90, 93, 89, 91, 92, 90],
          bloodSugarData: [6.8, 7.0, 6.7, 7.2, 6.9, 7.1, 6.8],
        },
        month: {
          xAxisData: Array.from({ length: 30 }, (_, i) => `${i + 1}/07`),
          bloodPressureData: Array.from({ length: 30 }, () => Math.floor(Math.random() * 10 + 155)),
          heartRateData: Array.from({ length: 30 }, () => Math.floor(Math.random() * 8 + 85)),
          bloodSugarData: Array.from({ length: 30 }, () => Number.parseFloat((Math.random() * 1.0 + 6.5).toFixed(1))),
        },
        year: {
          xAxisData: ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"],
          bloodPressureData: Array.from({ length: 12 }, () => Math.floor(Math.random() * 15 + 150)),
          heartRateData: Array.from({ length: 12 }, () => Math.floor(Math.random() * 10 + 85)),
          bloodSugarData: Array.from({ length: 12 }, () => Number.parseFloat((Math.random() * 1.5 + 6.0).toFixed(1))),
        },
      },
      {
        name: "Nguyễn Thị Hoa",
        age: 55,
        bloodPressure: "135/85",
        heartRate: 78,
        warning: "Đường huyết thấp",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
        phone: "0987654321",
        week: {
          xAxisData: ["19/06", "20/06", "21/06", "22/06", "23/06", "24/06", "25/06"],
          bloodPressureData: [135, 138, 134, 136, 140, 137, 135],
          heartRateData: [78, 80, 77, 79, 81, 78, 80],
          bloodSugarData: [5.5, 5.7, 5.6, 5.8, 5.9, 5.6, 5.7],
        },
        month: {
          xAxisData: Array.from({ length: 30 }, (_, i) => `${i + 1}/07`),
          bloodPressureData: Array.from({ length: 30 }, () => Math.floor(Math.random() * 10 + 130)),
          heartRateData: Array.from({ length: 30 }, () => Math.floor(Math.random() * 8 + 75)),
          bloodSugarData: Array.from({ length: 30 }, () => Number.parseFloat((Math.random() * 1.0 + 5.0).toFixed(1))),
        },
        year: {
          xAxisData: ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"],
          bloodPressureData: Array.from({ length: 12 }, () => Math.floor(Math.random() * 15 + 125)),
          heartRateData: Array.from({ length: 12 }, () => Math.floor(Math.random() * 10 + 70)),
          bloodSugarData: Array.from({ length: 12 }, () => Number.parseFloat((Math.random() * 1.5 + 5.0).toFixed(1))),
        },
      },
      {
        name: "Lê Minh Tuấn",
        age: 72,
        bloodPressure: "145/90",
        heartRate: 85,
        warning: "Huyết áp cao",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        phone: "0912345678",
        week: {
          xAxisData: ["19/06", "20/06", "21/06", "22/06", "23/06", "24/06", "25/06"],
          bloodPressureData: [145, 148, 143, 147, 150, 146, 144],
          heartRateData: [85, 87, 84, 86, 88, 85, 87],
          bloodSugarData: [6.2, 6.4, 6.3, 6.5, 6.6, 6.3, 6.4],
        },
        month: {
          xAxisData: Array.from({ length: 30 }, (_, i) => `${i + 1}/07`),
          bloodPressureData: Array.from({ length: 30 }, () => Math.floor(Math.random() * 10 + 140)),
          heartRateData: Array.from({ length: 30 }, () => Math.floor(Math.random() * 8 + 80)),
          bloodSugarData: Array.from({ length: 30 }, () => Number.parseFloat((Math.random() * 1.0 + 6.0).toFixed(1))),
        },
        year: {
          xAxisData: ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"],
          bloodPressureData: Array.from({ length: 12 }, () => Math.floor(Math.random() * 15 + 135)),
          heartRateData: Array.from({ length: 12 }, () => Math.floor(Math.random() * 10 + 80)),
          bloodSugarData: Array.from({ length: 12 }, () => Number.parseFloat((Math.random() * 1.5 + 5.5).toFixed(1))),
        },
      },
    ],
  },
  summary: {
    newPatients: 12,
    newPatientsChange: "+15% so với tuần trước",
    appointmentsToday: 8,
    upcomingAppointments: 2,
    monthlyRevenue: "48.500.000 đ",
    monthlyRevenueChange: "+8% so với tháng trước",
  },
};

// Component chính OverviewTab
export default function OverviewTab() {
  const [revenuePeriod, setRevenuePeriod] = useState("week");
  const [healthPeriod, setHealthPeriod] = useState("week");
  const [selectedPatient, setSelectedPatient] = useState(mockData.health.patients[0]);
  const [appointmentToday, setAppointmentToday] = useState(0);
  const [appointmentNext, setAppointmentNext] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const [todayRes, nextRes] = await Promise.all([
          ApiDoctor.getAppointmentsToday(),
          ApiDoctor.getAppointments(),
        ]);
        setAppointmentToday(todayRes.length);
        setAppointmentNext(nextRes.length);
      } catch (err) {
        console.error("Lỗi khi lấy dữ liệu cuộc hẹn:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  // Chart options for revenue
  const getRevenueChartOptions = (period) => ({
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: { left: "5%", right: "5%", bottom: "10%", containLabel: true },
    xAxis: { type: "category", data: mockData.revenue[period]?.xAxisData || [], axisTick: { alignWithLabel: true } },
    yAxis: { type: "value" },
    series: [
      {
        name: "Doanh thu",
        type: "bar",
        barWidth: "60%",
        data: mockData.revenue[period]?.data || [],
        itemStyle: { color: "#3b82f6" },
      },
    ],
  });

  // Chart options for health
  const getHealthChartOptions = (period, patient) => ({
    tooltip: { trigger: "axis" },
    legend: { data: ["Huyết áp", "Nhịp tim", "Đường huyết"], top: "5%" },
    grid: { left: "5%", right: "5%", bottom: "10%", top: "20%", containLabel: true },
    xAxis: { type: "category", boundaryGap: false, data: patient[period]?.xAxisData || [] },
    yAxis: { type: "value" },
    series: [
      { name: "Huyết áp", type: "line", data: patient[period]?.bloodPressureData || [], itemStyle: { color: "#ef4444" } },
      { name: "Nhịp tim", type: "line", data: patient[period]?.heartRateData || [], itemStyle: { color: "#8b5cf6" } },
      { name: "Đường huyết", type: "line", data: patient[period]?.bloodSugarData || [], itemStyle: { color: "#10b981" } },
    ],
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Tổng quan</Text>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        {[
          { icon: "👤", title: "Bệnh nhân mới", value: mockData.summary.newPatients, change: mockData.summary.newPatientsChange, color: "#007bff" },
          { icon: "📅", title: "Cuộc hẹn hôm nay", value: appointmentToday, change: `${appointmentNext} cuộc hẹn sắp tới`, color: "#ffc107" },
          { icon: "💰", title: "Doanh thu tháng", value: mockData.summary.monthlyRevenue, change: mockData.summary.monthlyRevenueChange, color: "#28a745" },
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
          <View style={styles.buttonGroup}>
            {["week", "month", "year"].map((period) => (
              <TouchableOpacity
                key={period}
                style={[styles.chartButton, revenuePeriod === period ? styles.activeButton : styles.inactiveButton]}
                onPress={() => setRevenuePeriod(period)}
              >
                <Text style={styles.buttonText}>
                  {period === "week" ? "Tuần này" : period === "month" ? "Tháng này" : "Năm nay"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <ECharts option={getRevenueChartOptions(revenuePeriod)} style={styles.chart} />
      </View>

      {/* Health Chart and Patient List */}
      <View style={styles.card}>
        <View style={styles.chartHeader}>
          <Text style={styles.sectionTitle}>Chỉ số sức khỏe: {selectedPatient.name}</Text>
          <View style={styles.buttonGroup}>
            {["week", "month", "year"].map((period) => (
              <TouchableOpacity
                key={period}
                style={[styles.chartButton, healthPeriod === period ? styles.activeButton : styles.inactiveButton]}
                onPress={() => setHealthPeriod(period)}
              >
                <Text style={styles.buttonText}>
                  {period === "week" ? "Tuần này" : period === "month" ? "Tháng này" : "Năm nay"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <ECharts option={getHealthChartOptions(healthPeriod, selectedPatient)} style={styles.chart} />
      </View>

      {/* Patient List */}
      <View style={styles.card}>
        <View style={styles.chartHeader}>
          <Text style={styles.sectionTitle}>Bệnh nhân cần chú ý</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>
        {mockData.health.patients.map((patient, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.patientRow, patient.name === selectedPatient.name ? styles.selectedPatient : null]}
            onPress={() => setSelectedPatient(patient)}
          >
            <Image source={{ uri: patient.image }} style={styles.patientImage} />
            <View style={styles.patientInfo}>
              <Text style={styles.patientName}>{patient.name}</Text>
              <Text style={styles.patientAge}>{patient.age} tuổi</Text>
              <Text style={styles.patientDetail}>Huyết áp: <Text style={styles.dangerText}>{patient.bloodPressure}</Text></Text>
              <Text style={styles.patientDetail}>Nhịp tim: {patient.heartRate} bpm</Text>
              <Text style={[styles.patientDetail, styles.warningText]}>{patient.warning}</Text>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => Linking.openURL(`tel:${patient.phone}`)}
              >
                <Text style={styles.actionIcon}>📞</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => Linking.openURL(`sms:${patient.phone}`)}
              >
                <Text style={styles.actionIcon}>💬</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#212529",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryContainer: {
    marginBottom: 16,
    marginTop: 16,
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    padding: 12,
    borderRadius: 12,
    marginRight: 16,
  },
  icon: {
    fontSize: 24,
  },
  summaryTitle: {
    fontSize: 14,
    color: "#6c757d",
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212529",
  },
  summaryChange: {
    fontSize: 12,
    color: "#28a745",
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#212529",
  },
  buttonGroup: {
    flexDirection: "row",
  },
  chartButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  activeButton: {
    backgroundColor: "#007bff",
  },
  inactiveButton: {
    backgroundColor: "#e9ecef",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  chart: {
    height: 250,
    width: "100%",
  },
  patientRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedPatient: {
    backgroundColor: "#f0f4ff",
  },
  patientImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
  },
  patientAge: {
    fontSize: 14,
    color: "#6c757d",
    marginBottom: 4,
  },
  patientDetail: {
    fontSize: 14,
    color: "#495057",
    marginBottom: 2,
  },
  dangerText: {
    color: "#ef4444",
    fontWeight: "600",
  },
  warningText: {
    color: "#dc3545",
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
    color: "#007bff",
  },
  viewAllText: {
    fontSize: 14,
    color: "#007bff",
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: "#495057",
  },
});