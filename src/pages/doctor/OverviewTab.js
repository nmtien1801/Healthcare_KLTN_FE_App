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
import { ECharts } from "react-native-echarts-wrapper";
import ApiDoctor from "../../apis/ApiDoctor";

const { width } = Dimensions.get("window");

const classifyBloodSugar = (value, type) => {
  if (value == null) return "N/A";
  if (type === "fasting") {
    if (value < 3.9) return "<3,9";
    if (value <= 5.6) return "3,9 – 5,6 (Bình thường)";
    if (value <= 6.9) return "5,7 – 6,9 (Tiền TĐ)";
    return ">=7 (Tiểu đường)";
  } else {
    if (value < 3.9) return "<3,9";
    if (value <= 7.7) return "3,9 – 7,7 (Bình thường)";
    if (value <= 11) return "7,8 – 11 (Tiền TĐ)";
    return ">11 (Tiểu đường)";
  }
};

const getDaysFromPeriod = (period) => {
  if (period === "week") return 7;
  if (period === "month") return 30;
  if (period === "year") return 365;
  return 7;
};

const periodToVietnamese = (period) => {
  if (period === "week") return "7 ngày gần nhất";
  if (period === "month") return "30 ngày gần nhất";
  if (period === "year") return "1 năm gần nhất";
  return "";
};

export default function OverviewTab() {
  const [revenuePeriod] = useState("week");
  const [healthPeriod, setHealthPeriod] = useState("week");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patients, setPatients] = useState([]);
  const [showAllPatients, setShowAllPatients] = useState(false);
  const [summary, setSummary] = useState({
    newPatients: 0,
    newPatientsChange: "",
    appointmentsToday: 0,
    upcomingAppointments: 0,
    monthlyRevenue: "0 đ",
    monthlyRevenueChange: "",
  });
  const [revenueData, setRevenueData] = useState({
    xAxisData: [],
    seriesData: [],
    totalRevenue: 0,
  });
  const [healthData, setHealthData] = useState({});
  const [bloodSugarRaw, setBloodSugarRaw] = useState([]);

  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [summaryRes, patientsRes, revenueRes] = await Promise.all([
          ApiDoctor.getSummary(),
          ApiDoctor.getPatientsAttention(),
          ApiDoctor.getRevenueWallet(revenuePeriod),
        ]);

        setSummary(summaryRes || summary);
        const patientsData = Array.isArray(patientsRes) ? patientsRes : [];
        setPatients(patientsData);
        if (patientsData.length > 0 && !selectedPatient) {
          setSelectedPatient(patientsData[0]);
        }
        setRevenueData(
          revenueRes || { xAxisData: [], seriesData: [], totalRevenue: 0 }
        );
      } catch (err) {
        console.error("Lỗi fetch tổng quan:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [revenuePeriod]);

  useEffect(() => {
    if (!selectedPatient?._id) return;
    const fetchHealth = async () => {
      try {
        const res = await ApiDoctor.getPatientHealth(
          selectedPatient._id,
          healthPeriod
        );
        setHealthData(res || {});
      } catch (err) {
        console.error("Lỗi fetch health:", err);
        setHealthData({});
      }
    };
    fetchHealth();
  }, [selectedPatient, healthPeriod]);

  useEffect(() => {
    if (!selectedPatient?.userId) {
      setBloodSugarRaw([]);
      return;
    }
    const fetchBloodSugar = async () => {
      try {
        const days = getDaysFromPeriod(healthPeriod);
        const [fastingRes, postMealRes] = await Promise.all([
          ApiDoctor.fetchPatientBloodSugar(
            selectedPatient.userId,
            "fasting",
            days
          ),
          ApiDoctor.fetchPatientBloodSugar(
            selectedPatient.userId,
            "postMeal",
            days
          ),
        ]);
        const fasting = fastingRes?.DT?.bloodSugarData || [];
        const postMeal = postMealRes?.DT?.bloodSugarData || [];
        const processedFasting = Array.isArray(fasting)
          ? fasting.map((item) => ({ ...item, type: "fasting" }))
          : [];
        const processedPostMeal = Array.isArray(postMeal)
          ? postMeal.map((item) => ({ ...item, type: "postMeal" }))
          : [];
        setBloodSugarRaw([...processedFasting, ...processedPostMeal]);
      } catch (err) {
        console.error("Lỗi fetch blood sugar:", err);
        setBloodSugarRaw([]);
      }
    };
    fetchBloodSugar();
  }, [selectedPatient, healthPeriod]);
  const processBloodSugarForChart = (data) => {
    const daily = {};
    data.forEach(({ value, type, time }) => {
      if (!time || typeof value !== "number") return;
      const dateKey = new Date(time).toISOString().split("T")[0];
      if (!daily[dateKey]) daily[dateKey] = { fasting: [], postMeal: [] };
      if (type === "fasting") daily[dateKey].fasting.push(value);
      else if (type === "postMeal") daily[dateKey].postMeal.push(value);
    });

    const sortedKeys = Object.keys(daily).sort();
    const dates = sortedKeys.map((k) => {
      const d = new Date(k);
      return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;
    });

    const avg = (arr) =>
      arr.length
        ? +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)
        : null;

    return {
      dates,
      fastingData: sortedKeys.map((k) => avg(daily[k].fasting)),
      postMealData: sortedKeys.map((k) => avg(daily[k].postMeal)),
    };
  };

  const {
    dates = [],
    fastingData = [],
    postMealData = [],
  } = processBloodSugarForChart(bloodSugarRaw);
  const periodVietnamese = periodToVietnamese(healthPeriod);

  const yVals = [...fastingData, ...postMealData].filter((v) => v !== null);
  const yMin = yVals.length
    ? Math.max(0, Math.floor((Math.min(...yVals) - 0.6) * 10) / 10)
    : 3.0;
  const yMax = yVals.length
    ? Math.max(13, Math.ceil((Math.max(...yVals) + 0.6) * 10) / 10)
    : 13;

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={{ marginTop: 12, color: "#6b7280" }}>
          Đang tải dữ liệu...
        </Text>
      </View>
    );
  }
  const healthChartOption = {
    tooltip: { trigger: "axis" },
    legend: {
      top: 30,
      data: ["Huyết áp", "Nhịp tim", "Đường huyết"],
      icon: "circle",
    },
    xAxis: {
      type: "category",
      data: healthData?.xAxisData || [],
      axisLabel: {
        interval: healthPeriod === "week" ? 0 : 7,
        rotate: 30,
        color: "#6b7280",
        fontSize: 10,
      },
    },
    yAxis: { type: "value", splitLine: { lineStyle: { type: "dashed" } } },
    series: [
      {
        name: "Huyết áp",
        type: "line",
        smooth: true,
        data: healthData?.bloodPressureData || [],
        itemStyle: { color: "#ef4444" },
      },
      {
        name: "Nhịp tim",
        type: "line",
        smooth: true,
        data: healthData?.heartRateData || [],
        itemStyle: { color: "#3b82f6" },
      },
      {
        name: "Đường huyết",
        type: "line",
        smooth: true,
        data: healthData?.bloodSugarData || [],
        itemStyle: { color: "#10b981" },
      },
    ],
    grid: { left: 10, right: 50, top: 80, bottom: 60, containLabel: true },
  };
  const bloodSugarChartOption = {
    title: {
      text: `Đường huyết (${periodVietnamese}, mmol/L)`,
      left: "center",
      textStyle: { fontSize: 13, fontWeight: "500" },
    },
    tooltip: {
      trigger: "axis",
      formatter: (params) => {
        let result = params[0].axisValue + "<br/>";
        params.forEach((p) => {
          if (p.value !== null) {
            const type = p.seriesName === "Lúc đói" ? "fasting" : "postMeal";
            const level = classifyBloodSugar(p.value, type);
            const isWarning =
              level.includes("Tiểu đường") || level.includes("Tiền TĐ");
            const levelColor = isWarning ? "#ef4444" : "#10b981";
            result += `${p.marker} ${p.seriesName}: <b>${p.value} mmol/L</b> → <span style="color:${levelColor}; font-weight: 600">${level}</span><br/>`;
          }
        });
        return result;
      },
    },
    legend: {
      top: 30,
      data: ["Lúc đói", "Sau ăn"],
      icon: "circle",
      textStyle: { color: "#6b7280" },
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: dates,
      axisLine: { lineStyle: { color: "#e5e7eb" } },
      axisLabel: {
        interval: healthPeriod === "week" ? 0 : 7,
        rotate: 30,
        color: "#6b7280",
        fontSize: 10,
      },
    },
    yAxis: {
      type: "value",
      min: yMin,
      max: yMax,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: "#e5e7eb", type: "dashed" } },
      axisLabel: {
        color: "#6b7280",
        fontSize: 12,
        formatter: "{value} mmol/L",
      },
    },
    series: [
      {
        name: "Lúc đói",
        data: fastingData,
        type: "line",
        smooth: true,
        showSymbol: true,
        symbolSize: 4,
        lineStyle: { color: "#3b82f6", width: 2 },
        itemStyle: { color: "#3b82f6" },
        connectNulls: true,
        markLine: {
          data: [
            {
              yAxis: 5.6,
              name: "Bình thường (Đói)",
              lineStyle: { color: "#10b981", type: "dashed" },
              label: { formatter: "BT(Đói)" },
            },
            {
              yAxis: 7.0,
              name: "Tiểu đường (Đói)",
              lineStyle: { color: "#ef4444", type: "dashed" },
              label: { formatter: "TĐ(Đói)" },
            },
          ],
          silent: true,
        },
        areaStyle: {
          opacity: 0.08,
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(59, 130, 246, 0.2)" },
              { offset: 1, color: "rgba(59, 130, 246, 0)" },
            ],
          },
        },
      },
      {
        name: "Sau ăn",
        data: postMealData,
        type: "line",
        smooth: true,
        showSymbol: true,
        symbolSize: 4,
        lineStyle: { color: "#f59e0b", width: 2 },
        itemStyle: { color: "#f59e0b" },
        connectNulls: true,

        markLine: {
          data: [
            {
              yAxis: 7.8,
              name: "Bình thường (Sau ăn)",
              lineStyle: { color: "#10b981", type: "dashed" },
              label: { formatter: "BT(Sau ăn)" },
            },
            {
              yAxis: 11.0,
              name: "Tiểu đường (Sau ăn)",
              lineStyle: { color: "#ef4444", type: "dashed" },
              label: { formatter: "TĐ(Sau ăn)" },
            },
          ],
          silent: true,
        },
        areaStyle: {
          opacity: 0.08,
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(245, 158, 11, 0.2)" },
              { offset: 1, color: "rgba(245, 158, 11, 0)" },
            ],
          },
        },
      },
    ],

    grid: { left: 10, right: 50, top: 80, bottom: 60, containLabel: true },
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageTitle}>Tổng quan</Text>
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.summaryRowContainer}
      >
        {[
          {
            title: "Bệnh nhân mới",
            value: summary.newPatients,
            change: summary.newPatientsChange,
            color: "#3b82f6",
            icon: "👤",
          },
          {
            title: "Cuộc hẹn hôm nay",
            value: summary.appointmentsToday,
            change: `${summary.upcomingAppointments} sắp tới`,
            color: "#f59e0b",
            icon: "📅",
          },
          {
            title: "Doanh thu tháng",
            value: summary.monthlyRevenue,
            change: summary.monthlyRevenueChange,
            color: "#10b981",
            icon: "💰",
          },
        ].map((item, i) => (
          <View key={i} style={styles.summaryCardWidth}>
            <View style={styles.summaryCard}>
              <View
                style={[
                  styles.summaryIcon,
                  { backgroundColor: item.color + "20" },
                ]}
              >
                <Text style={{ fontSize: 24 }}>{item.icon}</Text>
              </View>
              <View>
                <Text style={styles.summaryTitle}>{item.title}</Text>
                <Text style={styles.summaryValue}>{item.value}</Text>
                <Text
                  style={[
                    styles.summaryChange,
                    { color: item.color === "#10b981" ? "#059669" : "#4b5563" },
                  ]}
                >
                  {item.change}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.tableCard}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableTitle}>Bệnh nhân cần chú ý</Text>
          <TouchableOpacity
            onPress={() => setShowAllPatients(!showAllPatients)}
          >
            <Text style={styles.toggleText}>
              {showAllPatients ? "Thu gọn" : "Xem tất cả"}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.table}>
          <View style={styles.tableRowHeader}>
            <Text style={[styles.th, { flex: 0.9 }]}>Bệnh nhân</Text>
            <Text style={styles.th}>Chỉ số sức khỏe</Text>
            <Text style={[styles.th, { textAlign: "center", flex: 0.8 }]}>
              Trạng thái
            </Text>
          </View>
          {(showAllPatients ? patients : patients.slice(0, 5)).map((p) => (
            <TouchableOpacity
              key={p._id}
              onPress={() => setSelectedPatient(p)}
              style={[
                styles.tableRow,
                selectedPatient?._id === p._id && styles.tableRowSelected,
              ]}
            >
              <Text style={[styles.tdName, { flex: 0.9 }]}>{p.name}</Text>
              <Text style={styles.tdMetrics}>
                <Text>NT: </Text>
                <Text style={{ fontWeight: "600" }}>{p.heartRate || "-"}</Text>
                <Text> | HA: </Text>
                <Text style={{ fontWeight: "600" }}>
                  {p.bloodPressure || "-"}
                </Text>
              </Text>
              <View style={[{ alignItems: "center", flex: 0.8 }]}>
                <View
                  style={[
                    styles.badge,
                    p.warning ? styles.badgeDanger : styles.badgeSuccess,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      p.warning ? { color: "#dc2626" } : { color: "#059669" },
                    ]}
                  >
                    {p.warning || "Bình thường"}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.periodSelectorRow}>
        <Text style={styles.selectorTitle}>Khoảng thời gian:</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {["week", "month", "year"].map((p) => (
            <TouchableOpacity
              key={p}
              onPress={() => setHealthPeriod(p)}
              style={[
                styles.periodBtn,
                healthPeriod === p && styles.periodBtnActive,
              ]}
            >
              <Text
                style={[
                  styles.periodBtnText,
                  healthPeriod === p && styles.periodBtnTextActive,
                ]}
              >
                {p === "week" ? "Tuần" : p === "month" ? "Tháng" : "Năm"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Biểu đồ Chỉ số Sức khỏe (Health Chart) */}
      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>
            Chỉ số sức khỏe - {selectedPatient?.name || "Chưa chọn"}
          </Text>
        </View>
        {healthData?.xAxisData?.length > 0 ? (
          <View style={{ height: 320, width: "100%" }}>
            <ECharts
              key={"health-" + selectedPatient?._id + healthPeriod}
              option={healthChartOption}
              style={{ height: "100%", width: "100%" }}
            />
          </View>
        ) : (
          <View
            style={{
              height: 320,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#6b7280" }}>
              Chưa có dữ liệu chỉ số sức khỏe để hiển thị trong{" "}
              {periodVietnamese}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.chartCard}>
        <Text style={[styles.chartTitle, { marginBottom: 12 }]}>
          Biểu đồ Đường huyết
        </Text>
        {dates.length > 0 ? (
          <View style={{ height: 320, width: "100%" }}>
            <ECharts
              key={"bloodSugar-" + selectedPatient?._id + healthPeriod}
              option={bloodSugarChartOption}
              style={{ height: "100%", width: "100%" }}
            />
          </View>
        ) : (
          <View
            style={{
              height: 320,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#6b7280" }}>
              Chưa có dữ liệu đường huyết để hiển thị trong {periodVietnamese}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  pageTitle: { fontSize: 24, fontWeight: "700", margin: 16, color: "#111827" },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    height: Dimensions.get("window").height - 100,
  },

  summaryRowContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  summaryCardWidth: {
    width: width * 0.45,
    minWidth: 150,
  },
  summaryCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    height: "100%",
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryTitle: { fontSize: 12, color: "#6b7280" },
  summaryValue: { fontSize: 18, fontWeight: "700", color: "#111827" },
  summaryChange: {
    fontSize: 11,
    color: "#059669",
    marginTop: 4,
    fontWeight: "500",
  },

  periodSelectorRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectorTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },

  chartCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  chartTitle: { fontSize: 16, fontWeight: "600", color: "#111827", flex: 1 },
  periodBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  periodBtnActive: { backgroundColor: "#2563eb" },
  periodBtnText: { fontSize: 12, color: "#374151", fontWeight: "500" },
  periodBtnTextActive: { color: "#fff" },

  tableCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 32,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  tableHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  tableTitle: { fontSize: 16, fontWeight: "600" },
  toggleText: { color: "#2563eb", fontWeight: "600", fontSize: 13 },
  table: {},
  tableRowHeader: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  th: { flex: 1, fontSize: 12, fontWeight: "700", color: "#6b7280" },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 4,
    alignItems: "center",
  },
  tableRowSelected: { backgroundColor: "#e8f0fe" },
  tdName: { flex: 0.9, fontWeight: "600", color: "#111827", fontSize: 13 },
  tdMetrics: { flex: 1.2, fontSize: 12, color: "#4b5563" },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeSuccess: { backgroundColor: "#dcfce7" },
  badgeDanger: { backgroundColor: "#fee2e2" },
  badgeText: { fontSize: 12, fontWeight: "600" },
});
