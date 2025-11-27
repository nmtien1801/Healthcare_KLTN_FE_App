import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { BarChart } from "react-native-chart-kit";
import ApiDoctor from "../../apis/ApiDoctor";

const { width } = Dimensions.get("window");

const formatVND = (value) => {
  if (value === null || value === undefined || value === 0) return "0 đ";
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/\./g, '').replace(',', '.')) : value;
  if (isNaN(numericValue)) return "0 đ";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
  }).format(numericValue);
};

const formatYLabel = (value) => {
  const numericValue = parseFloat(value);
  if (isNaN(numericValue)) return '';
  if (numericValue === 0) return "0";
  if (numericValue >= 1000000) return (numericValue / 1000000).toFixed(0) + " Tr";
  if (numericValue >= 1000) return (numericValue / 1000).toFixed(0) + " K";
  return numericValue.toString();
};
const PeriodSelector = ({ selectedPeriod, onSelectPeriod }) => (
  <View style={styles.periodSelectorContainer}>
    {["week", "month", "year"].map((p) => (
      <TouchableOpacity
        key={p}
        onPress={() => onSelectPeriod(p)}
        style={[
          styles.periodButton,
          selectedPeriod === p ? styles.periodButtonActive : styles.periodButtonInactive,
        ]}
      >
        <Text
          style={[
            styles.periodButtonText,
            selectedPeriod === p ? styles.periodButtonTextActive : styles.periodButtonTextInactive,
          ]}
        >
          {p === "week" ? "Tuần" : p === "month" ? "Tháng" : "Năm"}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

export default function RevenueTab() {
  const [revenuePeriod, setRevenuePeriod] = useState("week");
  const [revenueData, setRevenueData] = useState({
    xAxisData: [],
    seriesData: [],
    totalRevenue: 0,
    currency: "VND",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        setLoading(true);
        const res = await ApiDoctor.getRevenueWallet(revenuePeriod);
        setRevenueData(res || { xAxisData: [], seriesData: [], totalRevenue: 0 });
      } catch (err) {
        console.error("Lỗi fetch revenue:", err);
        setRevenueData({ xAxisData: [], seriesData: [], totalRevenue: 0 });
      } finally {
        setLoading(false);
      }
    };
    fetchRevenue();
  }, [revenuePeriod]);
  const labels = revenueData.xAxisData;
  let dataPoints = revenueData.seriesData;
  if (labels.length > 0 && dataPoints.length !== labels.length) {
    dataPoints = new Array(labels.length).fill(0);
  }
  if (labels.length === 0 && dataPoints.length === 0) {
    dataPoints = [0];
  }


  const chartData = {
    labels: labels,
    datasets: [
      {
        data: dataPoints,
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: "#ffffff",
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    formatYLabel: formatYLabel,
    barPercentage: 0.8,
    propsForLabels: {
      fontSize: 10,
      fontWeight: '500',
    },
    propsForBackgroundLines: {
      strokeDasharray: '0',
      stroke: '#f3f4f6'
    }
  };

  const chartWidth = width - 16 * 2 - 20 * 2;
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Đang tải dữ liệu doanh thu...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Thống kê doanh thu</Text>
      <PeriodSelector selectedPeriod={revenuePeriod} onSelectPeriod={setRevenuePeriod} />

      <View style={styles.card}>
        <View style={styles.cardBody}>
          <View style={styles.header}>
            <Text style={styles.cardTitle}>
              Tổng Doanh thu {revenuePeriod === "week" ? "trong tuần" : revenuePeriod === "month" ? "trong tháng" : "trong năm"}
            </Text>
            <Text style={styles.totalRevenue}>{formatVND(revenueData.totalRevenue)}</Text>
          </View>
          {revenueData.xAxisData.length > 0 ? (
            <View style={styles.chartContainer}>
              <BarChart
                data={chartData}
                width={chartWidth}
                height={300}
                chartConfig={chartConfig}
                verticalLabelRotation={revenuePeriod === "week" ? 0 : 45}
                showValuesOnTopOfBars={true}
                fromZero={true}
                style={styles.barChartStyle}
                getBarLabel={(value) => formatYLabel(value)}
              />
            </View>
          ) : (
            <View style={styles.noDataContainer}>
              <Text style={styles.noDataText}>Không có dữ liệu doanh thu để hiển thị.</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  pageTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "#111827",
    paddingHorizontal: 16,
    paddingTop: 90,
    paddingBottom: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    height: Dimensions.get('window').height - 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },

  card: {
    marginHorizontal: 16,
    marginBottom: 32,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
    overflow: "hidden",
  },
  cardBody: {
    padding: 20,
  },

  // Header trong Card
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 15,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
    marginBottom: 4,
  },
  totalRevenue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#10b981",
  },
  periodSelectorContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 6,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  periodButton: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  periodButtonActive: {
    backgroundColor: "#3b82f6",
  },
  periodButtonInactive: {
    backgroundColor: "transparent",
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: "600",
    paddingTop: 2,
  },
  periodButtonTextActive: {
    color: "#ffffff",
  },
  periodButtonTextInactive: {
    color: "#4b5563",
  },
  chartContainer: {
    marginTop: 10,
  },
  barChartStyle: {
    borderRadius: 8,
    paddingRight: 15,
    paddingTop: 10,
  },

  // No Data
  noDataContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#9ca3af',
  }
});