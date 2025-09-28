import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const { width } = Dimensions.get('window');

// Mock transaction history data
const transactionHistory = [
  { id: 1, description: "Thanh toán hóa đơn Internet", date: "12/05/2025", amount: "- 180.000 đ", type: "expense" },
  { id: 2, description: "Nạp tiền từ Vietcombank", date: "10/05/2025", amount: "+ 500.000 đ", type: "income" },
  { id: 3, description: "Rút tiền về MBBank", date: "09/05/2025", amount: "- 1,000.000 đ", type: "expense" },
  { id: 4, description: "Mua sắm tại Shopee", date: "08/05/2025", amount: "- 250.000 đ", type: "expense" },
  { id: 5, description: "Hoàn tiền ưu đãi", date: "07/05/2025", amount: "+ 50.000 đ", type: "income" },
  { id: 6, description: "Chuyển tiền cho bạn A", date: "06/05/2025", amount: "- 120.000 đ", type: "expense" },
  { id: 7, description: "Nạp tiền từ Techcombank", date: "05/05/2025", amount: "+ 750.000 đ", type: "income" },
  { id: 8, description: "Thanh toán Google Ads", date: "04/05/2025", amount: "- 400.000 đ", type: "expense" },
];

const banks = [
  { id: "mbbank", name: "MBBank", fullName: "Ngân hàng TMCP Quân Đội", color: "#dc3545" },
  { id: "vietcombank", name: "Vietcombank", fullName: "Ngân hàng TMCP Ngoại thương Việt Nam", color: "#198754" },
  { id: "techcombank", name: "Techcombank", fullName: "Ngân hàng TMCP Kỹ thương Việt Nam", color: "#dc3545" },
  { id: "bidv", name: "BIDV", fullName: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam", color: "#0d6efd" },
  { id: "vietinbank", name: "VietinBank", fullName: "Ngân hàng TMCP Công thương Việt Nam", color: "#0dcaf0" },
  { id: "acb", name: "ACB", fullName: "Ngân hàng TMCP Á Châu", color: "#0d6efd" },
];

const qrImages = {
  bank: "https://github.com/nmtien1801/Healthcare_KLTN_FE/blob/develop/public/qrMb.png?raw=true",
  qr: "https://github.com/nmtien1801/Healthcare_KLTN_FE/blob/develop/public/qrMomo.png?raw=true",
};

const paymentMethods = [
  { id: "bank", name: "Quét mã QR ngân hàng", icon: "smartphone", recommended: true },
  { id: "qr", name: "Quét mã QR momo", icon: "smartphone" },
];

const steps = [
  { id: 1, title: "Phương thức", description: "Chọn cách thanh toán" },
  { id: 2, title: "Thông tin", description: "Nhập thông tin" },
  { id: 3, title: "Xác nhận", description: "Xem lại" },
];

export default function WalletPaymentFlow() {
  // State for wallet functionality
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [balance, setBalance] = useState('1,250,000');
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);
  
  // Payment flow states
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentData, setPaymentData] = useState({
    amount: "50000",
    recipient: "NGUYEN MINH TIEN",
    bank: "mbbank",
    accountNumber: "0967273063",
    message: "Chuyển tiền vào ví",
    paymentMethod: "bank",
  });

  const nextStep = () => {
    if (currentStep === 1 && !paymentData.paymentMethod) return;
    if (currentStep === 2 && (!paymentData.amount || !paymentData.recipient || !paymentData.accountNumber)) return;
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const formatCurrency = (amount) => {
    const num = parseInt(amount);
    if (isNaN(num)) return "0đ";
    return new Intl.NumberFormat("vi-VN").format(num) + "đ";
  };

  const handleConfirm = async () => {
    Alert.alert(
      "Xác nhận giao dịch",
      `Bạn đã chuyển ${formatCurrency(paymentData.amount)} vào tài khoản ${paymentData.accountNumber} (${paymentData.recipient}) chưa?`,
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xác nhận", 
          onPress: () => {
            // Update balance
            const currentBalance = parseInt(balance.replace(/,/g, ''));
            const newBalance = currentBalance + parseInt(paymentData.amount);
            setBalance(newBalance.toLocaleString('vi-VN'));
            
            Alert.alert("Thành công", "Giao dịch đã được xác nhận!");
            setShowPaymentFlow(false);
            setCurrentStep(1);
          }
        }
      ]
    );
  };

  const toggleBalanceVisibility = () => {
    setBalanceVisible(!balanceVisible);
  };

  const handleDepositPress = () => {
    setShowPaymentFlow(true);
  };

  const handleWithdrawPress = () => {
    Alert.alert("Thông báo", "Tính năng rút tiền sẽ sớm có!");
  };

  const renderTransactionItem = ({ item }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <View style={[
          styles.transactionIcon,
          { backgroundColor: item.type === 'income' ? '#d4edda' : '#f8d7da' }
        ]}>
          <Icon 
            name={item.type === 'income' ? 'trending-up' : 'trending-down'} 
            size={16} 
            color={item.type === 'income' ? '#28a745' : '#dc3545'} 
          />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDescription} numberOfLines={1}>
            {item.description}
          </Text>
          <Text style={styles.transactionDate}>{item.date}</Text>
        </View>
      </View>
      <Text style={[
        styles.transactionAmount,
        { color: item.type === 'income' ? '#28a745' : '#dc3545' }
      ]}>
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
            {balanceVisible ? `${balance} đ` : '*******'}
          </Text>
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={toggleBalanceVisibility}
          >
            <Icon 
              name={balanceVisible ? 'eye-off' : 'eye'} 
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
          <TouchableOpacity style={styles.quickActionDeposit} onPress={handleDepositPress}>
            <Icon name="download" size={28} color="#28a745" />
            <Text style={styles.quickActionTextDeposit}>NẠP TIỀN</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionWithdraw} onPress={handleWithdrawPress}>
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

  const renderProgressSteps = () => (
    <View style={styles.progressContainer}>
      {steps.map((step, index) => (
        <View key={step.id} style={styles.stepContainer}>
          <View style={styles.stepItem}>
            <View style={[
              styles.stepCircle,
              currentStep === step.id && styles.stepCircleActive,
              currentStep > step.id && styles.stepCircleCompleted
            ]}>
              {currentStep > step.id ? (
                <Icon name="check" size={16} color="#fff" />
              ) : (
                <Text style={[
                  styles.stepNumber,
                  currentStep === step.id && styles.stepNumberActive
                ]}>
                  {step.id}
                </Text>
              )}
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDescription}>{step.description}</Text>
            </View>
          </View>
          {index < steps.length - 1 && <View style={styles.stepConnector} />}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <View style={styles.iconContainer}>
          <Icon name="credit-card" size={20} color="#007bff" />
        </View>
        <View>
          <Text style={styles.stepHeaderTitle}>Bước 1: Phương thức thanh toán</Text>
          <Text style={styles.stepHeaderSubtitle}>Chọn nguồn tiền để thực hiện giao dịch</Text>
        </View>
      </View>

      {paymentMethods.map((method) => (
        <TouchableOpacity
          key={method.id}
          style={[
            styles.paymentMethodItem,
            paymentData.paymentMethod === method.id && styles.paymentMethodItemActive
          ]}
          onPress={() => setPaymentData({ ...paymentData, paymentMethod: method.id })}
        >
          <View style={styles.radioButton}>
            {paymentData.paymentMethod === method.id && (
              <View style={styles.radioButtonSelected} />
            )}
          </View>
          <Icon name={method.icon} size={24} color="#007bff" style={styles.methodIcon} />
          <View style={styles.methodInfo}>
            <Text style={styles.methodName}>{method.name}</Text>
            {method.recommended && (
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedText}>Khuyến nghị</Text>
              </View>
            )}
          </View>
          {paymentData.paymentMethod === method.id && (
            <Icon name="check" size={16} color="#007bff" />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <View style={styles.iconContainer}>
          <Icon name="edit-3" size={20} color="#007bff" />
        </View>
        <View>
          <Text style={styles.stepHeaderTitle}>Bước 2: Thông tin chuyển tiền</Text>
          <Text style={styles.stepHeaderSubtitle}>Nhập thông tin người nhận và số tiền</Text>
        </View>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Tên người nhận</Text>
          <TextInput
            style={[styles.textInput, styles.disabledInput]}
            value={paymentData.recipient}
            editable={false}
            placeholder="NGUYEN MINH TIEN"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Số tài khoản</Text>
          <TextInput
            style={[styles.textInput, styles.disabledInput]}
            value={paymentData.accountNumber}
            editable={false}
            placeholder="123456789"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Số tiền nạp ví</Text>
          <View style={styles.amountInputContainer}>
            <TextInput
              style={[styles.textInput, styles.amountInput]}
              value={paymentData.amount}
              onChangeText={(text) => setPaymentData({ ...paymentData, amount: text })}
              placeholder="Nhập số tiền"
              keyboardType="numeric"
            />
            <Text style={styles.currencySymbol}>đ</Text>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Lời nhắn</Text>
          <TextInput
            style={[styles.textInput, styles.textArea]}
            value={paymentData.message}
            onChangeText={(text) => setPaymentData({ ...paymentData, message: text })}
            placeholder="Nhập lời nhắn (tùy chọn)"
            multiline
            numberOfLines={3}
          />
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <View style={styles.iconContainer}>
          <Icon name="shield" size={20} color="#007bff" />
        </View>
        <View>
          <Text style={styles.stepHeaderTitle}>Bước 3: Xác nhận giao dịch</Text>
          <Text style={styles.stepHeaderSubtitle}>Kiểm tra thông tin trước khi xác nhận</Text>
        </View>
      </View>

      <View style={styles.confirmationContainer}>
        <Text style={styles.confirmationTitle}>Chi tiết người nhận</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Người nhận:</Text>
          <Text style={styles.detailValue}>{paymentData.recipient}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Ngân hàng:</Text>
          <Text style={styles.detailValue}>{banks.find(b => b.id === paymentData.bank)?.name}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Số tài khoản:</Text>
          <Text style={styles.detailValue}>{paymentData.accountNumber}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Phương thức TT:</Text>
          <Text style={styles.detailValue}>
            {paymentMethods.find(m => m.id === paymentData.paymentMethod)?.name}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Số tiền:</Text>
          <Text style={[styles.detailValue, styles.amountValue]}>{formatCurrency(paymentData.amount)}</Text>
        </View>

        {paymentData.message && (
          <View style={[styles.detailRow, styles.messageRow]}>
            <Text style={styles.detailLabel}>Lời nhắn:</Text>
            <Text style={styles.detailValue}>{paymentData.message}</Text>
          </View>
        )}
      </View>

      <View style={styles.securityBadge}>
        <Icon name="shield" size={16} color="#28a745" />
        <Text style={styles.securityText}>Giao dịch được bảo mật</Text>
      </View>
    </View>
  );

  const renderSummaryCard = () => {
    if (currentStep === 1) return null;

    return (
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Icon name="dollar-sign" size={20} color="#007bff" />
          <Text style={styles.summaryTitle}>Tóm tắt giao dịch</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Số tiền chuyển:</Text>
          <Text style={styles.summaryValue}>{formatCurrency(paymentData.amount)}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Phí giao dịch:</Text>
          <Text style={[styles.summaryValue, styles.freeText]}>Miễn phí</Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tổng cộng:</Text>
          <Text style={styles.totalValue}>{formatCurrency(paymentData.amount)}</Text>
        </View>

        <View style={styles.qrContainer}>
          <View style={styles.qrHeader}>
            <Icon name="smartphone" size={16} color="#007bff" />
            <Text style={styles.qrTitle}>Mã QR thanh toán</Text>
          </View>
          <View style={styles.qrImageContainer}>
            <Image
              source={{ uri: qrImages[paymentData.paymentMethod] }}
              style={styles.qrImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.qrDescription}>
            Quét mã để thanh toán {formatCurrency(paymentData.amount)}
          </Text>
        </View>
      </View>
    );
  };

  if (showPaymentFlow) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.paymentHeader}>
          <TouchableOpacity onPress={() => setShowPaymentFlow(false)}>
            <Icon name="arrow-left" size={24} color="#007bff" />
          </TouchableOpacity>
          <Text style={styles.paymentHeaderTitle}>Nạp tiền vào ví</Text>
          <View style={{ width: 24 }} />
        </View>
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>CHUYỂN TIỀN VÀO VÍ NỘI BỘ</Text>
            <Text style={styles.headerSubtitle}>
              Giao dịch nhanh 24/7, an toàn tuyệt đối với công nghệ bảo mật tiên tiến.
            </Text>
          </View>

          {renderProgressSteps()}

          <View style={styles.content}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            
            {renderSummaryCard()}
          </View>
        </ScrollView>

        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[styles.navButton, styles.backButton, currentStep === 1 && styles.disabledButton]}
            onPress={prevStep}
            disabled={currentStep === 1}
          >
            <Icon name="arrow-left" size={16} color={currentStep === 1 ? "#ccc" : "#6c757d"} />
            <Text style={[styles.navButtonText, styles.backButtonText, currentStep === 1 && styles.disabledButtonText]}>
              Quay lại
            </Text>
          </TouchableOpacity>

          {currentStep < 3 ? (
            <TouchableOpacity style={[styles.navButton, styles.nextButton]} onPress={nextStep}>
              <Text style={[styles.navButtonText, styles.nextButtonText]}>Tiếp tục</Text>
              <Icon name="arrow-right" size={16} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.navButton, styles.confirmButton]} onPress={handleConfirm}>
              <Icon name="send" size={16} color="#fff" />
              <Text style={[styles.navButtonText, styles.confirmButtonText]}>Xác nhận chuyển tiền</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderWalletOverview()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  // Wallet Overview Styles
  balanceCard: {
    backgroundColor: '#007bff',
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  balanceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  eyeButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
  },
  quickActionsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 16,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionDeposit: {
    flex: 1,
    backgroundColor: '#d4edda',
    borderWidth: 1,
    borderColor: '#28a745',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#28a745',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionWithdraw: {
    flex: 1,
    backgroundColor: '#f8d7da',
    borderWidth: 1,
    borderColor: '#dc3545',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#dc3545',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionTextDeposit: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#28a745',
    marginTop: 8,
  },
  quickActionTextWithdraw: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#dc3545',
    marginTop: 8,
  },
  transactionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
    marginLeft: 8,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212529',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#6c757d',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  viewAllButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '500',
    marginRight: 4,
  },
  // Payment Flow Header
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  paymentHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  // Original Payment Flow Styles
  scrollView: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#fff',
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#dee2e6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepCircleActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  stepCircleCompleted: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6c757d',
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepTextContainer: {
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#495057',
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 10,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 2,
  },
  stepConnector: {
    position: 'absolute',
    top: 16,
    left: '50%',
    right: -width/6,
    height: 2,
    backgroundColor: '#dee2e6',
    zIndex: -1,
  },
  content: {
    padding: 16,
  },
  stepContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepHeaderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  stepHeaderSubtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  paymentMethodItemActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007bff',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#dee2e6',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007bff',
  },
  methodIcon: {
    marginRight: 12,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212529',
  },
  recommendedBadge: {
    backgroundColor: '#6c757d',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  recommendedText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
  },
  formContainer: {
    gap: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  disabledInput: {
    backgroundColor: '#f8f9fa',
    color: '#6c757d',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountInput: {
    flex: 1,
    marginRight: 8,
  },
  currencySymbol: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  confirmationContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  confirmationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6c757d',
    flex: 1,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#212529',
    flex: 1,
    textAlign: 'right',
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007bff',
  },
  messageRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d4edda',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  securityText: {
    fontSize: 12,
    color: '#28a745',
    fontWeight: '500',
    marginLeft: 8,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginLeft: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212529',
  },
  freeText: {
    color: '#28a745',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
  },
  qrContainer: {
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  qrTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212529',
    marginLeft: 8,
  },
  qrImageContainer: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  qrImage: {
    width: 100,
    height: 100,
  },
  qrDescription: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    marginTop: 8,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#6c757d',
  },
  nextButton: {
    backgroundColor: '#007bff',
  },
  confirmButton: {
    backgroundColor: '#007bff',
    flex: 1,
    justifyContent: 'center',
    marginLeft: 12,
  },
  disabledButton: {
    borderColor: '#ccc',
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 8,
  },
  backButtonText: {
    color: '#6c757d',
  },
  nextButtonText: {
    color: '#fff',
  },
  confirmButtonText: {
    color: '#fff',
  },
  disabledButtonText: {
    color: '#ccc',
  },
});