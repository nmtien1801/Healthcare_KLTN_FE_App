import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  FlatList,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import FlowPayment from "./FlowPayment";
import { getBalance } from "../../redux/paymentSlice";
import { useSelector, useDispatch } from "react-redux";
const { width } = Dimensions.get("window");
import { getBalance, deposit } from "../../redux/paymentSlice";
import ApiDoctor from "../../apis/ApiDoctor";

// Mock transaction history data
const transactionHistory = [
  {
    id: 1,
    description: "Thanh toán hóa đơn Internet",
    date: "12/05/2025",
    amount: "- 180.000 đ",
    type: "expense",
  },
  {
    id: 2,
    description: "Nạp tiền từ Vietcombank",
    date: "10/05/2025",
    amount: "+ 500.000 đ",
    type: "income",
  },
  {
    id: 3,
    description: "Rút tiền về MBBank",
    date: "09/05/2025",
    amount: "- 1,000.000 đ",
    type: "expense",
  },
  {
    id: 4,
    description: "Mua sắm tại Shopee",
    date: "08/05/2025",
    amount: "- 250.000 đ",
    type: "expense",
  },
  {
    id: 5,
    description: "Hoàn tiền ưu đãi",
    date: "07/05/2025",
    amount: "+ 50.000 đ",
    type: "income",
  },
  {
    id: 6,
    description: "Chuyển tiền cho bạn A",
    date: "06/05/2025",
    amount: "- 120.000 đ",
    type: "expense",
  },
  {
    id: 7,
    description: "Nạp tiền từ Techcombank",
    date: "05/05/2025",
    amount: "+ 750.000 đ",
    type: "income",
  },
  {
    id: 8,
    description: "Thanh toán Google Ads",
    date: "04/05/2025",
    amount: "- 400.000 đ",
    type: "expense",
  },
];

export default function WalletPaymentFlow({ navigation }) {
  // State for wallet functionality
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);
  const user = useSelector((state) => state.auth.user);
  const balance = useSelector((state) => state.payment.balance);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchBalance = async () => {
      await dispatch(getBalance(user.userId));
    };

    fetchBalance();
  }, [dispatch, balance]);

  const toggleBalanceVisibility = () => {
    setBalanceVisible(!balanceVisible);
  };

  const handleDepositPress = () => {
    if (user.role === "doctor") {
      Alert.alert("Thông báo", "Bạn không có quyền nạp tiền!");
    } else {
      setShowPaymentFlow(true);
    }
  };

  const handleWithdrawPress = () => {
    Alert.alert("Thông báo", "Tính năng rút tiền sẽ sớm có!");
  };

  const renderTransactionItem = ({ item }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <View
          style={[
            styles.transactionIcon,
            { backgroundColor: item.type === "income" ? "#d4edda" : "#f8d7da" },
          ]}
        >
          <Icon
            name={item.type === "income" ? "trending-up" : "trending-down"}
            size={16}
            color={item.type === "income" ? "#28a745" : "#dc3545"}
          />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDescription} numberOfLines={1}>
            {item.description}
          </Text>
          <Text style={styles.transactionDate}>{item.date}</Text>
        </View>
      </View>
      <Text
        style={[
          styles.transactionAmount,
          { color: item.type === "income" ? "#28a745" : "#dc3545" },
        ]}
      >
        {item.amount}
      </Text>
    </View>
  );

  const renderWalletOverview = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Icon name="credit-card" size={20} color="#fff" />
          <Text style={styles.balanceTitle}>Số dư khả dụng</Text>
        </View>
        <View style={styles.balanceContent}>
          <Text style={styles.balanceAmount}>
            {balanceVisible ? `${balance} đ` : "*******"}
          </Text>
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={toggleBalanceVisibility}
          >
            <Icon
              name={balanceVisible ? "eye-off" : "eye"}
              size={20}
              color="#fff"
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsCard}>
        <Text style={styles.quickActionsTitle}>Dịch vụ chính</Text>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickActionDeposit}
            onPress={handleDepositPress}
          >
            <Icon name="download" size={28} color="#28a745" />
            <Text style={styles.quickActionTextDeposit}>NẠP TIỀN</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickActionWithdraw}
            onPress={handleWithdrawPress}
          >
            <Icon name="file-text" size={28} color="#dc3545" />
            <Text style={styles.quickActionTextWithdraw}>RÚT TIỀN</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Transaction History */}
      <View style={styles.transactionCard}>
        <View style={styles.transactionHeader}>
          <Icon name="clock" size={20} color="#6c757d" />
          <Text style={styles.transactionTitle}>Giao dịch gần đây</Text>
        </View>
        <FlatList
          data={transactionHistory}
          renderItem={renderTransactionItem}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        />
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>Xem tất cả giao dịch</Text>
          <Icon name="chevron-right" size={16} color="#007bff" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  if (showPaymentFlow) {
    return <FlowPayment onGoBack={() => setShowPaymentFlow(false)} />;
  }

  // ví bác sĩ
  useEffect(() => {
    let timeouts = [];

    const fetchAppointments = async () => {
      try {
        const resToday = await ApiDoctor.getAppointmentsToday();
        // ✅ Chỉ lấy các lịch hẹn có status = "confirmed"
        const confirmedAppointments = resToday.filter(
          (appointment) => appointment.status === "confirmed"
        );

        const now = new Date();
        for (const appointment of confirmedAppointments) {
          const baseDate = new Date(appointment.date);
          const [hours, minutes] = appointment.time.split(":").map(Number);

          // Tạo thời điểm lịch hẹn đầy đủ (theo giờ địa phương)
          const appointmentTime = new Date(
            baseDate.getFullYear(),
            baseDate.getMonth(),
            baseDate.getDate(),
            hours,
            minutes,
            0
          );

          // +30 phút
          const alertTime = new Date(
            appointmentTime.getTime() + 30 * 60 * 1000
          );
          const msUntilAlert = alertTime - now;

          console.log(
            `Lịch hẹn ${
              appointment._id || ""
            } (confirmed) sẽ chạy sau ${Math.round(msUntilAlert / 60000)} phút`
          );

          if (msUntilAlert > 0) {
            // Hẹn dispatch đúng thời điểm
            const timeout = setTimeout(async () => {
              try {
                await dispatch(
                  deposit({ userId: user.userId, amount: 200000 })
                );
                await ApiDoctor.updateAppointmentStatus(appointment._id, {
                  status: "completed",
                });
              } catch (err) {
                console.error("Lỗi dispatch deposit:", err);
              }
            }, msUntilAlert);
            timeouts.push(timeout);
          } else {
            // Nếu đã qua 30 phút thì thực hiện ngay
            try {
              await dispatch(deposit({ userId: user.userId, amount: 200000 }));
              await ApiDoctor.updateAppointmentStatus(appointment._id, {
                status: "completed",
              });
            } catch (err) {
              console.error("Lỗi dispatch deposit:", err);
            }
          }
        }
      } catch (err) {
        console.error("Lỗi lấy appointments:", err);
      }
    };

    fetchAppointments();

    return () => {
      timeouts.forEach(clearTimeout);
      timeouts = [];
    };
  }, [dispatch, user.userId]);

  // ví bác sĩ
  useEffect(() => {
    let timeouts = [];

    const fetchAppointments = async () => {
      try {
        const resToday = await ApiDoctor.getAppointmentsToday();
        // ✅ Chỉ lấy các lịch hẹn có status = "confirmed"
        const confirmedAppointments = resToday.filter(
          (appointment) => appointment.status === "confirmed"
        );

        const now = new Date();
        for (const appointment of confirmedAppointments) {
          const baseDate = new Date(appointment.date);
          const [hours, minutes] = appointment.time.split(":").map(Number);

          // Tạo thời điểm lịch hẹn đầy đủ (theo giờ địa phương)
          const appointmentTime = new Date(
            baseDate.getFullYear(),
            baseDate.getMonth(),
            baseDate.getDate(),
            hours,
            minutes,
            0
          );

          // +30 phút
          const alertTime = new Date(
            appointmentTime.getTime() + 30 * 60 * 1000
          );
          const msUntilAlert = alertTime - now;

          console.log(
            `Lịch hẹn ${
              appointment._id || ""
            } (confirmed) sẽ chạy sau ${Math.round(msUntilAlert / 60000)} phút`
          );

          if (msUntilAlert > 0) {
            // Hẹn dispatch đúng thời điểm
            const timeout = setTimeout(async () => {
              try {
                await dispatch(
                  deposit({ userId: user.userId, amount: 200000 })
                );
                await ApiDoctor.updateAppointmentStatus(appointment._id, {
                  status: "completed",
                });
              } catch (err) {
                console.error("Lỗi dispatch deposit:", err);
              }
            }, msUntilAlert);
            timeouts.push(timeout);
          } else {
            // Nếu đã qua 30 phút thì thực hiện ngay
            try {
              await dispatch(deposit({ userId: user.userId, amount: 200000 }));
              await ApiDoctor.updateAppointmentStatus(appointment._id, {
                status: "completed",
              });
            } catch (err) {
              console.error("Lỗi dispatch deposit:", err);
            }
          }
        }
      } catch (err) {
        console.error("Lỗi lấy appointments:", err);
      }
    };

    fetchAppointments();

    return () => {
      timeouts.forEach(clearTimeout);
      timeouts = [];
    };
  }, [dispatch, user.userId]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-left" size={24} color="#007bff" />
      </TouchableOpacity>
      {renderWalletOverview()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  backButton: {
    marginTop: 60,
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
  },
  // Wallet Overview Styles
  balanceCard: {
    backgroundColor: "#007bff",
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  balanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  balanceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginLeft: 8,
  },
  balanceContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  eyeButton: {
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
  },
  quickActionsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 16,
  },
  quickActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  quickActionDeposit: {
    flex: 1,
    backgroundColor: "#d4edda",
    borderWidth: 1,
    borderColor: "#28a745",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    shadowColor: "#28a745",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionWithdraw: {
    flex: 1,
    backgroundColor: "#f8d7da",
    borderWidth: 1,
    borderColor: "#dc3545",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    shadowColor: "#dc3545",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionTextDeposit: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#28a745",
    marginTop: 8,
  },
  quickActionTextWithdraw: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#dc3545",
    marginTop: 8,
  },
  transactionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  transactionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
    marginLeft: 8,
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f8f9fa",
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: "500",
    color: "#212529",
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: "#6c757d",
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: "bold",
  },
  viewAllButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: "#007bff",
    fontWeight: "500",
    marginRight: 4,
  },
  // Payment Flow Header
  paymentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  paymentHeaderTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212529",
  },
  // Original Payment Flow Styles
  scrollView: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007bff",
    textAlign: "center",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6c757d",
    textAlign: "center",
    lineHeight: 20,
  },
  progressContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "#fff",
  },
  stepContainer: {
    flex: 1,
    alignItems: "center",
  },
  stepItem: {
    alignItems: "center",
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#dee2e6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  stepCircleActive: {
    backgroundColor: "#007bff",
    borderColor: "#007bff",
  },
  stepCircleCompleted: {
    backgroundColor: "#28a745",
    borderColor: "#28a745",
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#6c757d",
  },
  stepNumberActive: {
    color: "#fff",
  },
  stepTextContainer: {
    alignItems: "center",
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#495057",
    textAlign: "center",
  },
  stepDescription: {
    fontSize: 10,
    color: "#6c757d",
    textAlign: "center",
    marginTop: 2,
  },
  stepConnector: {
    position: "absolute",
    top: 16,
    left: "50%",
    right: -width / 6,
    height: 2,
    backgroundColor: "#dee2e6",
    zIndex: -1,
  },
  content: {
    padding: 16,
  },
  stepContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#e3f2fd",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stepHeaderTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 4,
  },
  stepHeaderSubtitle: {
    fontSize: 14,
    color: "#6c757d",
  },
  paymentMethodItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  paymentMethodItemActive: {
    backgroundColor: "#e3f2fd",
    borderColor: "#007bff",
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#dee2e6",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#007bff",
  },
  methodIcon: {
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#212529",
  },
  recommendedBadge: {
    backgroundColor: "#6c757d",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: "flex-start",
  },
  recommendedText: {
    fontSize: 10,
    color: "#fff",
    fontWeight: "500",
  },
  formContainer: {
    gap: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#495057",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  disabledInput: {
    backgroundColor: "#f8f9fa",
    color: "#6c757d",
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  amountInput: {
    flex: 1,
    marginRight: 8,
  },
  currencySymbol: {
    fontSize: 14,
    color: "#6c757d",
    fontWeight: "500",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  confirmationContainer: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  confirmationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: "#6c757d",
    flex: 1,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: "500",
    color: "#212529",
    flex: 1,
    textAlign: "right",
  },
  amountValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007bff",
  },
  messageRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d4edda",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  securityText: {
    fontSize: 12,
    color: "#28a745",
    fontWeight: "500",
    marginLeft: 8,
  },
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginLeft: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6c757d",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#212529",
  },
  freeText: {
    color: "#28a745",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#e9ecef",
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212529",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007bff",
  },
  qrContainer: {
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  qrHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  qrTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#212529",
    marginLeft: 8,
  },
  qrImageContainer: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  qrImage: {
    width: 100,
    height: 100,
  },
  qrDescription: {
    fontSize: 12,
    color: "#6c757d",
    textAlign: "center",
    marginTop: 8,
  },
});
