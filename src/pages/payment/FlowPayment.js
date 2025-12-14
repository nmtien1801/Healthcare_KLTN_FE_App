import React, { useState } from 'react';
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
} from 'react-native';
import { Platform } from "react-native";
import {
  ArrowLeft,
  CreditCard,
  Edit3,
  Shield,
  DollarSign,
  Smartphone,
  Check,
  ArrowRight,
  Send,
} from 'lucide-react-native';
import { useDispatch, useSelector } from 'react-redux';
import { deposit, createPaymentUrl } from "../../redux/paymentSlice"

const { width } = Dimensions.get('window');

const banks = [
  { id: "mbbank", name: "MBBank", fullName: "Ngân hàng TMCP Quân Đội", color: "#dc3545" },
  { id: "vietcombank", name: "Vietcombank", fullName: "Ngân hàng TMCP Ngoại thương Việt Nam", color: "#198754" },
  { id: "techcombank", name: "Techcombank", fullName: "Ngân hàng TMCP Kỹ thương Việt Nam", color: "#dc3545" },
  { id: "bidv", name: "BIDV", fullName: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam", color: "#0d6efd" },
  { id: "vietinbank", name: "VietinBank", fullName: "Ngân hàng TMCP Công thương Việt Nam", color: "#0dcaf0" },
  { id: "acb", name: "ACB", fullName: "Ngân hàng TMCP Á Châu", color: "#0d6efd" },
];

const qrImages = {
  bank: require("../../../assets/qrMb.png"),
  // qr: "https://github.com/nmtien1801/Healthcare_KLTN_FE/blob/develop/public/qrMomo.png?raw=true",
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

export default function PaymentFlow({ onGoBack }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
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
    if (Platform.OS === "web") {
      if (window.confirm(`Bạn đã chuyển ${formatCurrency(paymentData.amount)} vào tài khoản ${paymentData.accountNumber} (${paymentData.recipient}) chưa?`)) {
        await dispatch(deposit({ userId: user.userId, amount: paymentData.amount }))
        window.alert("Thành công: Giao dịch đã được xác nhận!");
        if (onGoBack) onGoBack();
      }
    } else {
      Alert.alert(
        "Xác nhận giao dịch",
        `Bạn đã chuyển ${formatCurrency(paymentData.amount)} vào tài khoản ${paymentData.accountNumber} (${paymentData.recipient}) chưa?`,
        [
          { text: "Hủy", style: "cancel" },
          {
            text: "Xác nhận",
            onPress: () => {
              (async () => {
                let res = await dispatch(deposit({ userId: user.userId, amount: +paymentData.amount }));
                if (res.payload.EC === 0) {
                  Alert.alert("Thành công", "Giao dịch đã được xác nhận!", [{ text: "OK", onPress: onGoBack }]);
                }
              })();
            }
          }
        ]
      );
    }
  };

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
                <Check size={16} color="#fff" strokeWidth={3} />
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
          <CreditCard size={20} color="#007bff" />
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
          <Smartphone size={24} color="#007bff" style={styles.methodIcon} />
          <View style={styles.methodInfo}>
            <Text style={styles.methodName}>{method.name}</Text>
            {method.recommended && (
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedText}>Khuyến nghị</Text>
              </View>
            )}
          </View>
          {paymentData.paymentMethod === method.id && (
            <Check size={16} color="#007bff" />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <View style={styles.iconContainer}>
          <Edit3 size={20} color="#007bff" />
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
          <Shield size={20} color="#007bff" />
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
        <Shield size={16} color="#28a745" />
        <Text style={styles.securityText}>Giao dịch được bảo mật</Text>
      </View>
    </View>
  );

  const renderSummaryCard = () => {
    if (currentStep === 1) return null;

    return (
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <DollarSign size={20} color="#007bff" />
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
            <Smartphone size={16} color="#007bff" />
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.backButtonHeader}
              onPress={onGoBack}
            >
              <ArrowLeft size={24} color="#007bff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>CHUYỂN TIỀN VÀO VÍ NỘI BỘ</Text>
            <View style={styles.headerSpacer} />
          </View>
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
          <ArrowLeft size={16} color={currentStep === 1 ? "#ccc" : "#6c757d"} />
          <Text style={[styles.navButtonText, styles.backButtonText, currentStep === 1 && styles.disabledButtonText]}>
            Quay lại
          </Text>
        </TouchableOpacity>

        {currentStep < 3 ? (
          <TouchableOpacity style={[styles.navButton, styles.nextButton]} onPress={nextStep}>
            <Text style={[styles.navButtonText, styles.nextButtonText]}>Tiếp tục</Text>
            <ArrowRight size={16} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.navButton, styles.confirmButton]} onPress={handleConfirm}>
            <Send size={16} color="#fff" />
            <Text style={[styles.navButtonText, styles.confirmButtonText]}>Xác nhận chuyển tiền</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    marginTop: 36,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButtonHeader: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
    textAlign: 'center',
    flex: 1,
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
    right: -width / 6,
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