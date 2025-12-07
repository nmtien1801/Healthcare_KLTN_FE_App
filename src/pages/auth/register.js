import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import {
  Eye,
  EyeOff,
  RefreshCw,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useDispatch, useSelector } from "react-redux";
import { register, verifyEmail } from "../../redux/authSlice";
import { useNavigation } from "@react-navigation/native";
import { auth, provider } from "../../../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

export default function LoginForm() {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [code, setCode] = useState({});
  const [startTime, setStartTime] = useState(null);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phoneNumber: "",
    address: "",
    password: "",
    confirmPassword: "",
    captcha: "",
    gender: "",
    dob: null, // Khởi tạo với Date object
    avatar: "",
    code: "",
  });

  // Format ngày thành chuỗi YYYY-MM-DD
  const getDateString = (date) => {
    if (!(date instanceof Date) || isNaN(date)) {
      return "";
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Xử lý thay đổi ngày sinh
  const handleDateChange = (event, date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (event?.type === "set" && date) {
      console.log("Setting new birth date:", date.toLocaleDateString("vi-VN"));
      handleChange("dob", date);
    }

    if (
      Platform.OS === "ios" &&
      (event?.type === "set" || event?.type === "dismissed")
    ) {
      setShowDatePicker(false);
    }
  };

  // Xử lý thay đổi ngày trên web
  const handleWebDateChange = (event) => {
    const dateString = event.target.value;
    console.log("Web date input changed:", dateString);
    if (dateString) {
      const newDate = new Date(dateString);
      if (!isNaN(newDate)) {
        handleChange("dob", newDate);
      }
    }
  };

  // Toggle date picker
  const toggleDatePicker = () => {
    if (Platform.OS === "android" || Platform.OS === "ios") {
      setShowDatePicker(!showDatePicker);
    }
  };

  const handleChange = (name, value) => {
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  useEffect(() => {
    if (!startTime) return;

    const tick = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, 60 - elapsed);
      setCountdown(remaining);

      if (remaining === 0) {
        setStartTime(null);
      }
    };

    tick(); // gọi ngay 1 lần
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const handleSubmit = async () => {
    setErrorMessage("");

    // kiểm tra username
    if (!formData.username) {
      setErrorMessage("username không được để trống");
      return;
    }

    // kiểm tra email
    if (!formData.email) {
      setErrorMessage("Email không được để trống");
      return;
    }

    // kiểm tra tài khoản 10 ký tự bất kì
    if (!formData.phoneNumber || formData.phoneNumber.length !== 10) {
      setErrorMessage("Số tài khoản phải bao gồm đúng 10 ký tự!");
      return;
    }

    // kiểm tra password
    if (!formData.password || formData.password.length < 6) {
      setErrorMessage("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    // Kiểm tra mật khẩu và mật khẩu nhập lại có khớp không
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Mật khẩu và mật khẩu nhập lại không khớp!");
      return;
    }

    // kiểm tra captcha
    if (!formData.captcha) {
      setErrorMessage("captcha không được để trống");
      return;
    }

    // kiểm tra ngày sinh
    if (!formData.dob || isNaN(formData.dob)) {
      setErrorMessage("Vui lòng chọn ngày sinh hợp lệ");
      return;
    }

    // kiểm tra code verify email
    let currentTime = Date.now();
    if (currentTime - code.timestamp > 60000) {
      setErrorMessage("❌ Mã đã hết hạn sau 60s");
      return;
    } else if (+formData.captcha !== +code.code) {
      setErrorMessage("❌ Mã không đúng");
      return;
    } else {
      // Gửi thông tin đăng ký đi firebase
      try {
        const result = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        if (!result || !result.user) {
          setErrorMessage(
            "Đăng ký thất bại: Không nhận được thông tin người dùng từ Firebase."
          );
          return;
        }

        // Gửi thông tin đăng ký đi mongo
        const formDataToSend = {
          ...formData,
          uid: result.user.uid,
        };

        const res = await dispatch(register(formDataToSend));

        // Một số middleware trả về response trong res.payload
        const payload = res && res.payload ? res.payload : res;

        if (payload && payload.EC === 0) {
          // Thành công: chuyển về trang đăng nhập
          navigation.navigate("Login");
        } else {
          // Hiển thị lỗi trả về từ BE
          const message = (payload && payload.EM) || "Đăng ký thất bại";
          setErrorMessage(message);
        }
      } catch (err) {
        // Bắt lỗi từ Firebase hoặc bất kỳ lỗi async nào
        console.error("Register error:", err);
        // Map một số mã lỗi Firebase phổ biến sang thông điệp người dùng
        let message = "Đã xảy ra lỗi khi đăng ký";
        if (err && err.code) {
          if (err.code === "auth/email-already-in-use") {
            message = "Email đã được sử dụng";
          } else if (err.code === "auth/invalid-email") {
            message = "Email không hợp lệ";
          } else if (err.code === "auth/weak-password") {
            message = "Mật khẩu quá yếu";
          } else {
            message = err.message || message;
          }
        } else if (err && err.message) {
          message = err.message;
        }
        setErrorMessage(message);
      }
    }
  };

  const handleVerifyEmail = async () => {
    // Gửi mã xác minh qua email
    let res = await dispatch(verifyEmail(formData.email));
    if (res.payload.EC === 0) {
      setCode(res.payload.DT);
    }

    // Bắt đầu đếm ngược
    setCountdown(60);
    setStartTime(Date.now());
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>DiaTech</Text>
        <Text style={styles.subtitle}>Đăng ký với mật khẩu</Text>

        {/* Username Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Tên người dùng"
            value={formData.username}
            onChangeText={(text) => handleChange("username", text)}
          />
        </View>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={formData.email}
            keyboardType="email-address"
            onChangeText={(text) => handleChange("email", text)}
          />
        </View>

        {/* Phone Number Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Số điện thoại"
            value={formData.phoneNumber}
            onChangeText={(text) => handleChange("phoneNumber", text)}
          />
        </View>

        {/* Address Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Địa chỉ"
            value={formData.address}
            onChangeText={(text) => handleChange("address", text)}
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Mật khẩu"
            secureTextEntry={!showPassword}
            value={formData.password}
            onChangeText={(text) => handleChange("password", text)}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.iconButton}
          >
            {showPassword ? (
              <EyeOff size={20} color="#555" />
            ) : (
              <Eye size={20} color="#555" />
            )}
          </TouchableOpacity>
        </View>

        {/* Confirm Password Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nhập lại mật khẩu"
            secureTextEntry={!showConfirmPassword}
            value={formData.confirmPassword}
            onChangeText={(text) => handleChange("confirmPassword", text)}
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={styles.iconButton}
          >
            {showConfirmPassword ? (
              <EyeOff size={20} color="#555" />
            ) : (
              <Eye size={20} color="#555" />
            )}
          </TouchableOpacity>
        </View>

        {/* Captcha Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Mã kiểm tra"
            value={formData.captcha}
            onChangeText={(text) => handleChange("captcha", text)}
          />
          <TouchableOpacity
            onPress={handleVerifyEmail}
            disabled={countdown > 0}
            style={[styles.iconButton, countdown > 0 && styles.disabledButton]}
          >
            {countdown > 0 ? (
              <Text style={styles.text60}>{countdown}s</Text>
            ) : (
              <RefreshCw color="#333" size={20} />
            )}
          </TouchableOpacity>
        </View>

        {/* Gender Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Giới tính (Nam/Nữ/Khác)"
            value={formData.gender}
            onChangeText={(text) => handleChange("gender", text)}
          />
        </View>

        {/* Date of Birth Input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.dateInputContainer}
            onPress={Platform.OS === "web" ? undefined : toggleDatePicker}
          >
            <Calendar size={20} color="#555" style={{ marginRight: 8 }} />

            {Platform.OS === "web" ? (
              <input
                type="date"
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  fontSize: 16,
                  backgroundColor: "transparent",
                  height: 30,
                }}
                value={formData.dob ? getDateString(formData.dob) : ""}
                onChange={handleWebDateChange}
                max={getDateString(new Date())} // Không cho chọn ngày tương lai
              />
            ) : (
              <Text style={styles.dateText}>
                {formData.dob && !isNaN(formData.dob)
                  ? formData.dob.toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  : "Chọn ngày sinh"}
              </Text>
            )}

            {Platform.OS !== "web" &&
              (showDatePicker ? (
                <ChevronUp size={16} color="#666" />
              ) : (
                <ChevronDown size={16} color="#666" />
              ))}
          </TouchableOpacity>
        </View>

        {/* DateTimePicker cho mobile */}
        {Platform.OS !== "web" && showDatePicker && (
          <DateTimePicker
            testID="dobDateTimePicker"
            value={
              formData.dob && !isNaN(formData.dob) ? formData.dob : new Date()
            }
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={handleDateChange}
            maximumDate={new Date()} // Không cho chọn ngày tương lai
            minimumDate={new Date(1900, 0, 1)} // Giới hạn từ năm 1900
            locale="vi-VN"
            style={{ backgroundColor: "#ffffff" }}
          />
        )}

        {errorMessage !== "" && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          mode="contained"
          style={styles.button}
          onPress={handleSubmit}
        >
          <Text style={{ color: "white" }}>Đăng ký</Text>
        </TouchableOpacity>

        {/* Links */}
        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.link}>Đăng nhập</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f4f4",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "white",
    padding: 24,
    borderRadius: 10,
    elevation: 5,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2962ff",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 15,
    width: "100%",
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  dateInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 50,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: "#000",
  },
  iconButton: {
    padding: 10,
  },
  button: {
    width: "100%",
    paddingVertical: 15,
    marginVertical: 10,
    backgroundColor: "#2962ff",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  link: {
    color: "#2962ff",
    marginTop: 8,
    fontSize: 14,
  },
  text60: {
    color: "#333",
    fontSize: 16,
  },
  errorContainer: {
    marginBottom: 12,
    alignItems: "center",
  },
  errorText: {
    color: "red",
    fontSize: 14,
    textAlign: "center",
  },
  disabledButton: {
    opacity: 0.5,
  },
});
