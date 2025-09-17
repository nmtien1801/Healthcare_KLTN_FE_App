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

// Mock data với nhiều bệnh nhân hơn
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
        id: 1,
        name: "Trần Văn Bình",
        age: 68,
        bloodPressure: "160/95",
        heartRate: 92,
        warning: "Huyết áp cao",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        phone: "0123456789",
        status: "Cần theo dõi",
        statusColor: "#ef4444",
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
        id: 2,
        name: "Nguyễn Thị Hoa",
        age: 55,
        bloodPressure: "135/85",
        heartRate: 78,
        warning: "Đường huyết thấp",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
        phone: "0987654321",
        status: "Đang điều trị",
        statusColor: "#f59e0b",
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
        id: 3,
        name: "Lê Minh Tuấn",
        age: 72,
        bloodPressure: "145/90",
        heartRate: 85,
        warning: "Huyết áp cao",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        phone: "0912345678",
        status: "Cần theo dõi",
        statusColor: "#ef4444",
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
      {
        id: 4,
        name: "Phạm Thị Hương",
        age: 52,
        bloodPressure: "120/80",
        heartRate: 75,
        warning: "Ổn định",
        image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face",
        phone: "0934567890",
        status: "Ổn định",
        statusColor: "#10b981",
        week: {
          xAxisData: ["19/06", "20/06", "21/06", "22/06", "23/06", "24/06", "25/06"],
          bloodPressureData: [120, 122, 118, 125, 120, 123, 119],
          heartRateData: [75, 77, 74, 76, 78, 75, 77],
          bloodSugarData: [5.2, 5.4, 5.3, 5.5, 5.6, 5.3, 5.4],
        },
        month: {
          xAxisData: Array.from({ length: 30 }, (_, i) => `${i + 1}/07`),
          bloodPressureData: Array.from({ length: 30 }, () => Math.floor(Math.random() * 10 + 115)),
          heartRateData: Array.from({ length: 30 }, () => Math.floor(Math.random() * 8 + 70)),
          bloodSugarData: Array.from({ length: 30 }, () => Number.parseFloat((Math.random() * 1.0 + 4.8).toFixed(1))),
        },
        year: {
          xAxisData: ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"],
          bloodPressureData: Array.from({ length: 12 }, () => Math.floor(Math.random() * 15 + 110)),
          heartRateData: Array.from({ length: 12 }, () => Math.floor(Math.random() * 10 + 70)),
          bloodSugarData: Array.from({ length: 12 }, () => Number.parseFloat((Math.random() * 1.5 + 4.5).toFixed(1))),
        },
      },
      {
        id: 5,
        name: "Võ Đức Minh",
        age: 45,
        bloodPressure: "140/90",
        heartRate: 88,
        warning: "Huyết áp cao",
        image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
        phone: "0945678901",
        status: "Đang điều trị",
        statusColor: "#f59e0b",
        week: {
          xAxisData: ["19/06", "20/06", "21/06", "22/06", "23/06", "24/06", "25/06"],
          bloodPressureData: [140, 142, 138, 145, 140, 143, 139],
          heartRateData: [88, 90, 87, 89, 91, 88, 90],
          bloodSugarData: [6.0, 6.2, 6.1, 6.3, 6.4, 6.1, 6.2],
        },
        month: {
          xAxisData: Array.from({ length: 30 }, (_, i) => `${i + 1}/07`),
          bloodPressureData: Array.from({ length: 30 }, () => Math.floor(Math.random() * 10 + 135)),
          heartRateData: Array.from({ length: 30 }, () => Math.floor(Math.random() * 8 + 83)),
          bloodSugarData: Array.from({ length: 30 }, () => Number.parseFloat((Math.random() * 1.0 + 5.8).toFixed(1))),
        },
        year: {
          xAxisData: ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"],
          bloodPressureData: Array.from({ length: 12 }, () => Math.floor(Math.random() * 15 + 130)),
          heartRateData: Array.from({ length: 12 }, () => Math.floor(Math.random() * 10 + 80)),
          bloodSugarData: Array.from({ length: 12 }, () => Number.parseFloat((Math.random() * 1.5 + 5.5).toFixed(1))),
        },
      },
      {
        id: 6,
        name: "Hoàng Thị Mai",
        age: 60,
        bloodPressure: "130/85",
        heartRate: 82,
        warning: "Đường huyết cao",
        image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
        phone: "0956789012",
        status: "Cần theo dõi",
        statusColor: "#ef4444",
        week: {
          xAxisData: ["19/06", "20/06", "21/06", "22/06", "23/06", "24/06", "25/06"],
          bloodPressureData: [130, 132, 128, 135, 130, 133, 129],
          heartRateData: [82, 84, 81, 83, 85, 82, 84],
          bloodSugarData: [7.2, 7.4, 7.3, 7.5, 7.6, 7.3, 7.4],
        },
        month: {
          xAxisData: Array.from({ length: 30 }, (_, i) => `${i + 1}/07`),
          bloodPressureData: Array.from({ length: 30 }, () => Math.floor(Math.random() * 10 + 125)),
          heartRateData: Array.from({ length: 30 }, () => Math.floor(Math.random() * 8 + 78)),
          bloodSugarData: Array.from({ length: 30 }, () => Number.parseFloat((Math.random() * 1.0 + 7.0).toFixed(1))),
        },
        year: {
          xAxisData: ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"],
          bloodPressureData: Array.from({ length: 12 }, () => Math.floor(Math.random() * 15 + 120)),
          heartRateData: Array.from({ length: 12 }, () => Math.floor(Math.random() * 10 + 75)),
          bloodSugarData: Array.from({ length: 12 }, () => Number.parseFloat((Math.random() * 1.5 + 6.8).toFixed(1))),
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
  const [currentPage, setCurrentPage] = useState(1);
  const patientsPerPage = 3;

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

  // Logic phân trang
  const totalPages = Math.ceil(mockData.health.patients.length / patientsPerPage);
  const startIndex = (currentPage - 1) * patientsPerPage;
  const endIndex = startIndex + patientsPerPage;
  const displayedPatients = mockData.health.patients.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

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
          <View>
            <Text style={styles.sectionTitle}>⚠️ Bệnh nhân cần chú ý</Text>
            <Text style={styles.sectionSubtitle}>Tổng {mockData.health.patients.length} bệnh nhân</Text>
          </View>
          <TouchableOpacity style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.patientListContainer}>
          {displayedPatients.map((patient, index) => (
            <TouchableOpacity
              key={patient.id}
              style={[
                styles.patientRow, 
                patient.name === selectedPatient.name ? styles.selectedPatient : null
              ]}
              onPress={() => setSelectedPatient(patient)}
            >
              <View style={styles.patientImageContainer}>
                <Image source={{ uri: patient.image }} style={styles.patientImage} />
                {patient.name === selectedPatient.name && (
                  <View style={styles.selectedIndicator} />
                )}
              </View>
              <View style={styles.patientInfo}>
                <Text style={styles.patientName}>{patient.name}</Text>
                <Text style={styles.patientAge}>{patient.age} tuổi</Text>
                <View style={styles.healthMetrics}>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Huyết áp:</Text>
                    <Text style={[
                      styles.metricValue,
                      patient.bloodPressure.includes('160') || patient.bloodPressure.includes('150') || patient.bloodPressure.includes('145') || patient.bloodPressure.includes('140') 
                        ? styles.dangerText 
                        : patient.bloodPressure.includes('120') 
                        ? styles.goodText 
                        : styles.warningText
                    ]}>{patient.bloodPressure}</Text>
                  </View>
                  <View style={styles.metricItem}>
                    <Text style={styles.metricLabel}>Nhịp tim:</Text>
                    <Text style={styles.metricValue}>{patient.heartRate} bpm</Text>
                  </View>
                </View>
                <View style={[styles.statusContainer, { backgroundColor: `${patient.statusColor}15` }]}>
                  <View style={[styles.statusDot, { backgroundColor: patient.statusColor }]} />
                  <Text style={[styles.statusText, { color: patient.statusColor }]}>{patient.status}</Text>
                </View>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.callButton]}
                  onPress={() => Linking.openURL(`tel:${patient.phone}`)}
                >
                  <Text style={styles.actionIcon}>📞</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.messageButton]}
                  onPress={() => Linking.openURL(`sms:${patient.phone}`)}
                >
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
                style={[
                  styles.paginationButton,
                  page === currentPage && styles.activePaginationButton
                ]}
                onPress={() => handlePageChange(page)}
              >
                <Text style={[
                  styles.paginationText,
                  page === currentPage && styles.activePaginationText
                ]}>{page}</Text>
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
  patientListContainer: {
    marginTop: 8,
  },
  patientImageContainer: {
    position: "relative",
    marginRight: 16,
  },
  selectedIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#10b981",
    borderWidth: 2,
    borderColor: "#ffffff",
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
    color: "#64748b",
    fontWeight: "500",
    marginRight: 8,
    minWidth: 70,
  },
  metricValue: {
    fontSize: 13,
    color: "#0f172a",
    fontWeight: "600",
  },
  goodText: {
    color: "#10b981",
    fontWeight: "700",
    fontSize: 13,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
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
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
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
    backgroundColor: "#6366f1",
    borderColor: "#6366f1",
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