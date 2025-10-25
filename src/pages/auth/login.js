// login
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { useDispatch } from "react-redux";
import { Login, setUser } from "../../redux/authSlice";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signInWithEmailAndPassword, signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../../../firebase";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";

WebBrowser.maybeCompleteAuthSession();

export default function LoginForm() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Cấu hình Google Sign-In với expo-auth-session
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: "1099403948301-YOUR_WEB_CLIENT_ID.apps.googleusercontent.com", // Lấy từ Firebase Console
    expoClientId: "1099403948301-YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com", // Lấy từ Firebase Console (Web Client ID)
    iosClientId: "1099403948301-YOUR_IOS_CLIENT_ID.apps.googleusercontent.com", // Lấy từ Google Cloud Console hoặc Firebase (nếu cần)
    androidClientId: "1099403948301-YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com", // Lấy từ Google Cloud Console hoặc Firebase (nếu cần)
  });

  // Xử lý Google Sign-In response
  React.useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      const credential = GoogleAuthProvider.credential(authentication.idToken);
      handleGoogleLogin(credential);
    }
  }, [response]);

  const handleChange = (name, value) => {
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleEmailAndPasswordLogin = async () => {
    const result = await signInWithEmailAndPassword(
      auth,
      formData.email,
      formData.password
    );
    const user = result.user;

    try {
      if (user) {
        const idToken = await user.getIdToken();
        const res = await dispatch(Login({ user }));
        if (res.payload.EC === 0) {
          // Lưu ID token để gọi BE (tránh dùng accessToken của Firebase)
          await AsyncStorage.setItem("access_Token", idToken);
          await AsyncStorage.setItem("userInfo", JSON.stringify(res.payload.DT));
          dispatch(
            setUser({
              userId: res.payload.DT.userId,
              uid: user.uid,
              email: user.email,
              username: res.payload.DT.username,
              photoURL: user.photoURL,
              role: res.payload.DT.role,
              address: res.payload.DT.address,
              phone: res.payload.DT.phone,
              dob: res.payload.DT.dob,
              gender: res.payload.DT.gender,
            })
          );
          if (res.payload.DT.role === "doctor") {
            navigation.navigate("DoctorTab", { screen: "Tổng quan" });
          } else if (res.payload.DT.role === "patient") {
            navigation.navigate("PatientTabs", { screen: "Trang chủ" });
          }
        } else {
          Alert.alert("Lỗi", "Lỗi từ server: " + res.payload.message);
        }
      }
    } catch (error) {
      console.error(`Đăng nhập thất bại: ${error.code} - ${error.message}`);
      switch (error.code) {
        case "auth/invalid-credential":
          Alert.alert("Lỗi", "Email hoặc mật khẩu không đúng.");
          break;
        case "auth/user-not-found":
          Alert.alert("Lỗi", "Không tìm thấy tài khoản. Vui lòng đăng ký.");
          break;
        case "auth/wrong-password":
          Alert.alert("Lỗi", "Sai mật khẩu.");
          break;
        case "auth/network-request-failed":
          Alert.alert("Lỗi", "Lỗi mạng. Vui lòng kiểm tra kết nối internet.");
          break;
        default:
          Alert.alert("Lỗi", `Lỗi không xác định: ${error.message}`);
      }
    }
  };

  const handleGoogleLogin = async (credential) => {
    try {
      const result = await signInWithCredential(auth, credential);
      const user = result.user;
      if (user) {
        const idToken = await user.getIdToken();
        const res = await dispatch(Login({ idToken }));

        if (res.payload.EC === 0) {
          await AsyncStorage.setItem("access_Token", idToken);
          await AsyncStorage.setItem("userInfo", JSON.stringify(res.payload.DT));
          dispatch(
            setUser({
              userId: res.payload.DT.userId,
              uid: user.uid,
              email: user.email,
              username: res.payload.DT.username,
              photoURL: user.photoURL,
              role: res.payload.DT.role,
              address: res.payload.DT.address,
              phone: res.payload.DT.phone,
              dob: res.payload.DT.dob,
              gender: res.payload.DT.gender,
            })
          );
          Alert.alert("Thành công", "Đăng nhập Google thành công!");
          if (res.payload.DT.role === "doctor") {
            navigation.navigate("DoctorTab", { screen: "Tổng quan" });
          } else if (res.payload.DT.role === "patient") {
            navigation.navigate("PatientTabs", { screen: "Trang chủ" });
          }
        } else {
          Alert.alert("Lỗi", "Lỗi từ server: " + res.payload.message);
        }
      }
    } catch (error) {
      console.error("Google Login error:", error);
      Alert.alert("Lỗi", `Lỗi đăng nhập Google: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>DeaTech</Text>
        <Text style={styles.subtitle}>Đăng nhập với mật khẩu</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={formData.email}
            onChangeText={(text) => handleChange("email", text)}
            autoCapitalize="none"
          />
        </View>

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

        <TouchableOpacity
          style={styles.button}
          onPress={handleEmailAndPasswordLogin}
        >
          <Text style={{ color: "white" }}>Đăng nhập</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buttonGG}
          onPress={() => promptAsync()}
          disabled={!request}
        >
          <Image
            source={{
              uri: "https://developers.google.com/identity/images/g-logo.png",
            }}
            style={styles.logo}
          />
          <Text style={styles.buttonText}>Đăng nhập với Google</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("ResetPassword")}>
          <Text style={styles.linkText}>Quên mật khẩu?</Text>
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
    marginBottom: 15,
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



