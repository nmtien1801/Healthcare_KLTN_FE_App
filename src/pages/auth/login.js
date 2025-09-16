import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
} from "react-native";
import { Eye, EyeOff, RefreshCw } from "lucide-react-native";
import { useDispatch, useSelector } from "react-redux";
import { Login, setUser } from "../../redux/authSlice";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { auth, provider } from "../../../firebase";

export default function LoginForm() {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    captcha: "",
  });

  const handleChange = (name, value) => {
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleEmailAndPasswordLogin = async (e) => {
    e.preventDefault();
    try {
      let result = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      let user = result.user;
      if (user) {
        let res = await dispatch(Login({ user }));
        if (res.payload.EC === 0) {
          // Lưu thông tin user vào AsyncStorage trước
          await AsyncStorage.setItem("access_Token", user.accessToken);
          await AsyncStorage.setItem("userInfo", JSON.stringify(res.payload.DT));
          
          // Cập nhật Redux state trực tiếp để Router.js nhận được ngay
          dispatch(
            setUser({
              userID: res.payload.DT.userId,
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              role: res.payload.DT.role,
              address: res.payload.DT.address,
              phone: res.payload.DT.phone,
              dob: res.payload.DT.dob,
              gender: res.payload.DT.gender,
            })
          );
        }
      }
    } catch (error) {
      console.error(`Đăng nhập thất bại: ${error.code} - ${error.message}`);
      // Xử lý lỗi cụ thể
      switch (error.code) {
        case "auth/invalid-credential":
          alert(
            'Email hoặc mật khẩu không đúng, hoặc tài khoản này đã bị xoá mật khẩu. Nếu trước đây bạn đăng nhập Google, hãy dùng nút "Đăng nhập Google" hoặc đặt lại mật khẩu.'
          );
          break;
        case "auth/user-not-found":
          alert("Không tìm thấy tài khoản. Vui lòng đăng ký.");
          break;
        case "auth/wrong-password":
          alert("Sai mật khẩu.");
          break;
        default:
          alert(`Lỗi không xác định: ${error.message}`);
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      let result = await signInWithPopup(auth, provider);

      let user = result.user;
      if (user) {
        let res = await dispatch(Login({ user }));

        if (res.payload.EC === 0) {
          // Lưu thông tin user vào AsyncStorage trước
          await AsyncStorage.setItem("access_Token", user.accessToken);
          await AsyncStorage.setItem("userInfo", JSON.stringify(res.payload.DT));
          
          // Cập nhật Redux state trực tiếp để Router.js nhận được ngay
          dispatch(
            setUser({
              userID: res.payload.DT.userId,
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              role: res.payload.DT.role,
              address: res.payload.DT.address,
              phone: res.payload.DT.phone,
              dob: res.payload.DT.dob,
              gender: res.payload.DT.gender,
            })
          );
        }
      }
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>DeaTech</Text>
        <Text style={styles.subtitle}>Đăng nhập với mật khẩu</Text>

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={formData.email}
            onChangeText={(text) => handleChange("email", text)}
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

        {/* Captcha Input */}
        {/* <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Mã kiểm tra"
            value={formData.captcha}
            onChangeText={(text) => handleChange("captcha", text)}
          />
          <TouchableOpacity
            onPress={() => console.log("Refresh captcha")}
            style={styles.iconButton}
          >
            <RefreshCw size={20} color="#555" />
          </TouchableOpacity>
        </View> */}

        {/* Submit Button */}
        <TouchableOpacity
          mode="contained"
          style={styles.button}
          onPress={handleEmailAndPasswordLogin}
        >
          <Text style={{ color: "white" }}>Đăng nhập</Text>
        </TouchableOpacity>

        {/* Google Login Button  */}
        <TouchableOpacity style={styles.buttonGG} onPress={handleGoogleLogin}>
          <Image
            source={{
              uri: "https://developers.google.com/identity/images/g-logo.png",
            }}
            style={styles.logo}
          />
          <Text style={styles.buttonText}>Đăng nhập với Google</Text>
        </TouchableOpacity>

        {/* Links */}
        <TouchableOpacity>
          <Text
            style={styles.linkText}
            onPress={() => navigation.navigate("ResetPassword")}
          >
            Quên mật khẩu?
          </Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.linkText}>Đăng nhập qua mã QR</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
          <Text style={styles.linkText}>Đăng ký</Text>
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
  iconButton: {
    padding: 10,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2962ff",
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: "100%",
    justifyContent: "center",
    marginBottom: 15,
  },
  linkText: {
    color: "#2962ff",
    marginTop: 8,
    fontSize: 14,
  },

  buttonGG: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#DB4437",
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: "100%",
    justifyContent: "center",
  },
  logo: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  buttonText: {
    color: "#DB4437",
    fontWeight: "bold",
    fontSize: 16,
  },
});
