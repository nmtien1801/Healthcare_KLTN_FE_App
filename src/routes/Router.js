import React, { useEffect, useState, useRef } from "react";
import {
  View,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
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
import AttendanceTab from "../pages/doctor/AttendanceTab";
import Header from "../routes/Header";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Diagnosis from "../pages/patient/assistant/diagnosis";
import { auth } from "../../firebase";
import E_wallet from "../pages/payment/E_wallet";
import RevenueTab from "../pages/doctor/Revenue";
import {
  MessageCircle,
  CreditCard,
  Sparkles,
  CheckCircle2,
  User,
  Home as HomeIcon,
  Activity,
  UtensilsCrossed,
  Calendar,
  MessageSquare,
} from "lucide-react-native";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const DoctorTab = ({ route, handleStartCall }) => {
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            const iconProps = { size, color, strokeWidth: focused ? 2.5 : 2 };

            switch (route.name) {
              case "Tổng quan":
                return <MessageCircle {...iconProps} />;
              case "Bệnh nhân":
                return <User {...iconProps} />;
              case "Lịch hẹn":
                return <Sparkles {...iconProps} />;
              case "Lịch làm việc":
                return <CheckCircle2 {...iconProps} />;
              case "Doanh thu":
                return <CreditCard {...iconProps} />;
              case "Cài đặt":
                return <User {...iconProps} />;
              default:
                return null;
            }
          },
          tabBarActiveTintColor: "#2196F3",
          tabBarInactiveTintColor: "gray",
        })}
      >
        <Tab.Screen name="Tổng quan" component={OverviewTab} />
        <Tab.Screen name="Bệnh nhân">
          {(props) => (
            <PatientTab {...props} handleStartCall={handleStartCall} />
          )}
        </Tab.Screen>
        <Tab.Screen name="Lịch hẹn" component={AppointmentTab} />
        <Tab.Screen name="Lịch làm việc" component={AttendanceTab} />
        <Tab.Screen name="Doanh thu" component={RevenueTab} />
      </Tab.Navigator>
    </View>
  );
};

const PatientTabs = ({ route, handleStartCall }) => {
  return (
    <View style={{ flex: 1, marginTop: 65 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            const iconProps = { size, color, strokeWidth: focused ? 2.5 : 2 };

            switch (route.name) {
              case "Trang chủ":
                return <HomeIcon {...iconProps} />;
              case "Sức khỏe":
                return <Activity {...iconProps} />;
              case "Dinh dưỡng":
                return <UtensilsCrossed {...iconProps} />;
              case "Đặt lịch":
                return <Calendar {...iconProps} />;
              case "Trợ lý AI":
                return <MessageSquare {...iconProps} />;
              default:
                return null;
            }
          },
          tabBarActiveTintColor: "#2196F3",
          tabBarInactiveTintColor: "gray",
        })}
      >
        <Tab.Screen name="Trang chủ" component={Home} />
        <Tab.Screen name="Sức khỏe" component={HealthTabs} />
        <Tab.Screen name="Dinh dưỡng" component={NutritionTabs} />
        <Tab.Screen name="Đặt lịch">
          {(props) => (
            <BookingTabs {...props} handleStartCall={handleStartCall} />
          )}
        </Tab.Screen>
        <Tab.Screen name="Trợ lý AI" component={Diagnosis} />
      </Tab.Navigator>
    </View>
  );
};

export default function Router({ route, handleStartCall }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [isLoading, setIsLoading] = useState(true);

  // Authentication state management
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Update access token
          const token = await firebaseUser.getIdToken();
          await AsyncStorage.setItem("access_Token", token);
          // Get user info from AsyncStorage
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
            // If no userInfo in storage, user might need to complete registration
            console.log("No user info in storage");
          }
        } else {
          // User logged out
          console.log("User logged out, clearing state");
          dispatch(clearUser());
          await AsyncStorage.clear();
        }
      } catch (error) {
        console.error("Error handling auth state:", error);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {user && <Header />}

      <Stack.Navigator>
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

        <Stack.Screen name="DoctorTab" options={{ headerShown: false }}>
          {(props) =>
            user?.role === "doctor" ? (
              <DoctorTab {...props} handleStartCall={handleStartCall} />
            ) : null
          }
        </Stack.Screen>

        <Stack.Screen name="PatientTabs" options={{ headerShown: false }}>
          {(props) =>
            user?.role === "patient" ? (
              <PatientTabs {...props} handleStartCall={handleStartCall} />
            ) : null
          }
        </Stack.Screen>

        <Stack.Screen
          name="PersonalTabs"
          component={PersonalTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="InformationTab"
          component={InformationTab}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Diagnosis"
          component={Diagnosis}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="payment"
          component={E_wallet}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    width: "90%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalContent: {
    padding: 24,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
    color: "#333",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  primaryButton: {
    backgroundColor: "#007bff",
  },
  dangerButton: {
    backgroundColor: "#dc3545",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
});
