import React, { useEffect, useState, useRef } from "react";
import {
  View,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Icon from "react-native-vector-icons/Ionicons";
import { Provider, useSelector, useDispatch } from "react-redux";
import { store } from "./src/redux/store";
import { doGetAccount } from "./src/redux/authSlice";
import HealthTabs from "./src/pages/patient/HealthTabs";
import PersonalTabs from "./src/pages/patient/PersonalTabs";
import Home from "./src/pages/patient/Home";
import LoginForm from "./src/pages/auth/login";
import RegisterForm from "./src/pages/auth/register";
import BookingTabs from "./src/pages/patient/BookingTabs";
import ResetPassword from "./src/pages/auth/ResetPassword";
import OverviewTab from "./src/pages/doctor/OverviewTab";
import InformationTab from "./src/pages/doctor/InformationTab";
import AppointmentTab from "./src/pages/doctor/AppointmentTab";
import PatientTab from "./src/pages/doctor/PatientTab";
import SettingTabs from "./src/pages/doctor/SettingTabs";

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
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            const icons = {
              "Trang chủ": focused
                ? "chatbubble-ellipses"
                : "chatbubble-ellipses-outline",
              "Sức khỏe": focused ? "id-card" : "id-card-outline",
              "Đặt lịch": focused ? "sparkles" : "sparkles-outline",
              "Hồ sơ": focused ? "person" : "person-outline",
            };
            return <Icon name={icons[route.name]} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#2196F3",
          tabBarInactiveTintColor: "gray",
        })}
      >
        <Tab.Screen name="Trang chủ" component={Home} />
        <Tab.Screen name="Sức khỏe" component={HealthTabs} />
        <Tab.Screen name="Đặt lịch" component={BookingTabs} />
        <Tab.Screen name="Hồ sơ" component={PersonalTabs} />
      </Tab.Navigator>
    </View>
  );
};

const Project = () => {
  const dispatch = useDispatch();
  let isLoggedIn = useSelector((state) => state.auth.isLoggedIn);
  const user = useSelector((state) => state.auth.user);

  const fetchDataAccount = async () => {
    if (!user || !user?.access_Token) {
      await dispatch(doGetAccount());
    }
  };

  useEffect(() => {
    fetchDataAccount();
  }, [dispatch, user?.access_Token]);

  return (
    <NavigationContainer>
      <SafeAreaView style={{ flex: 1 }}>
        <Stack.Navigator>
          {/* {isLoggedIn ? ( */}
          <>
            <Stack.Screen
                name="DoctorTab"
                component={DoctorTab}
                options={{ headerShown: false }}
              />
            {/* <Stack.Screen
              name="PatientTabs"
              component={PatientTabs}
              options={{ headerShown: false }}
            /> */}
          </>
          {/* ) : ( */}
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
          {/* )} */}
        </Stack.Navigator>
      </SafeAreaView>
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <Provider store={store}>
      <Project />
    </Provider>
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
});
