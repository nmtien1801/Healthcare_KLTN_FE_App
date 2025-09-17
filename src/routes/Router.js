import React, { useEffect, useState, useRef } from "react";
import {
  View,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
  ActivityIndicator,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Icon from "react-native-vector-icons/Ionicons";
import { useSelector, useDispatch } from "react-redux";
import { setUser, clearUser } from "../redux/authSlice";
import HealthTabs from "../pages/patient/HealthTabs";
import PersonalTabs from "../pages/patient/PersonalTabs";
import Home from "../pages/patient/Home";
import LoginForm from "../pages/auth/login";
import RegisterForm from "../pages/auth/register";
import BookingTabs from "../pages/patient/BookingTabs";
import NutritionTabs from "../pages/patient/NutritionTabs";
import ResetPassword from "../pages/auth/ResetPassword";
import OverviewTab from "../pages/doctor/OverviewTab";
import InformationTab from "../pages/doctor/InformationTab";
import AppointmentTab from "../pages/doctor/AppointmentTab";
import PatientTab from "../pages/doctor/PatientTab";
import SettingTabs from "../pages/doctor/SettingTabs";
import Header from "../routes/Header";
import { auth } from "../../firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Diagnosis from "../pages/patient/assistant/diagnosis";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const DoctorTab = ({ route }) => {
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            const icons = {
              "Tổng quan": focused
                ? "chatbubble-ellipses"
                : "chatbubble-ellipses-outline",
              "Bệnh nhân": focused ? "id-card" : "id-card-outline",
              "Lịch hẹn": focused ? "sparkles" : "sparkles-outline",
              "Thông tin": focused ? "person" : "person-outline",
              "Cài đặt": focused ? "person" : "person-outline",
            };
            return <Icon name={icons[route.name]} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#2196F3",
          tabBarInactiveTintColor: "gray",
        })}
      >
        <Tab.Screen name="Tổng quan" component={OverviewTab} />
        <Tab.Screen name="Bệnh nhân" component={PatientTab} />
        <Tab.Screen name="Lịch hẹn" component={AppointmentTab} />
        <Tab.Screen name="Thông tin" component={InformationTab} />
        <Tab.Screen name="Cài đặt" component={SettingTabs} />
      </Tab.Navigator>
    </View>
  );
};

const PatientTabs = ({ route }) => {
  return (
    <View style={{ flex: 1, marginTop: 65 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            const icons = {
              "Trang chủ": focused
                ? "chatbubble-ellipses"
                : "chatbubble-ellipses-outline",
              "Sức khỏe": focused ? "id-card" : "id-card-outline",
              "Dinh dưỡng": focused ? "nutrition" : "nutrition-outline",
              "Đặt lịch": focused ? "sparkles" : "sparkles-outline",
              "Trợ lý AI": focused ? "chatbubble" : "chatbubble-outline",
            };
            return <Icon name={icons[route.name]} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#2196F3",
          tabBarInactiveTintColor: "gray",
        })}
      >
        <Tab.Screen name="Trang chủ" component={Home} />
        <Tab.Screen name="Sức khỏe" component={HealthTabs} />
        <Tab.Screen name="Dinh dưỡng" component={NutritionTabs} />
        <Tab.Screen name="Đặt lịch" component={BookingTabs} />
        <Tab.Screen name="Trợ lý AI" component={Diagnosis} />
      </Tab.Navigator>
    </View>
  );
};

export default function Router() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [isLoading, setIsLoading] = useState(true);

  // authContext -> duy trì trạng thái đăng nhập của người dùng
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Lấy thông tin user từ AsyncStorage
          const userInfoString = await AsyncStorage.getItem("userInfo");
          const userInfo = userInfoString ? JSON.parse(userInfoString) : null;

          if (userInfo) {
            // Dispatch user info to Redux
            dispatch(
              setUser({
                userId: userInfo.userId,
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                username: userInfo.username,
                photoURL: firebaseUser.photoURL,
                role: userInfo.role,
                address: userInfo.address,
                phone: userInfo.phone,
                dob: userInfo.dob,
                gender: userInfo.gender,
                emailVerified: firebaseUser.emailVerified,
              })
            );
          } else {
            // Nếu không có userInfo trong storage, có thể user đăng nhập lần đầu
            console.log("No user info in storage, user might need to complete registration");
            dispatch(
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                username: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                emailVerified: firebaseUser.emailVerified,
                role: 'patient', // default role
              })
            );
          }

          // Cập nhật access token
          const token = await firebaseUser.getIdToken();
          await AsyncStorage.setItem("access_Token", token);
          
        } catch (error) {
          console.error("Error handling auth state:", error);
        }
      } else {
        // User đã đăng xuất
        console.log("User logged out, clearing state");
        dispatch(clearUser());
        await AsyncStorage.clear();
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [dispatch]);

  console.log("user ", user);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {user && <Header />}

      <Stack.Navigator>
        {user ? (
          user.role === 'doctor' ? (
            <Stack.Screen
              name="DoctorTab"
              component={DoctorTab}
              options={{ headerShown: false }}
            />
          ) : (
            <>
              <Stack.Screen
                name="PatientTabs"
                component={PatientTabs}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="PersonalTabs"
                component={PersonalTabs}
                options={{ headerShown: false }}
              />
            </>
          )
        ) : (
          <>
            <Stack.Screen
              name="Login"
              component={LoginForm}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterForm}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ResetPassword"
              component={ResetPassword}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "90%",
    maxHeight: "80%",
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "90%",
    maxHeight: "80%",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});


