import React, { useEffect, useState, useRef } from "react";
import {
  View,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
} from "react-native";

import { Provider, useSelector, useDispatch } from "react-redux";
import { store } from "./src/redux/store";
import Router from "./src/routes/Router";
import { NavigationContainer } from "@react-navigation/native";

export default function App() {
  const linking = {
    prefixes: ["http://localhost:8081"],
    config: {
      screens: {
        Login: "login",
        Register: "register",
        ResetPassword: "reset-password",
        ChangePassword: "change-password",
        DoctorTab: {
          screens: {
            "Tổng quan": "doctor/overview",
            "Bệnh nhân": "doctor/patients",
            "Lịch hẹn": "doctor/appointments",
            "Chấm công": "doctor/attendance",
            "Thông tin": "doctor/info",
            "Cài đặt": "doctor/settings",
          },
        },
        // Patient direct screens
        Home: "home",
        HealthTabs: "healthTabs",
        Nutrition: "nutrition",
        FoodTrackerApp: "foodTracker",
        SuggestedFood: "suggestedFood",
        BookingTabs: "bookingTabs",
        FormPatient: "assistant",
        PersonalTabs: "personalTabs",
        // Note: Do not map nested PatientTabs to avoid pattern conflicts
      },
    },
  };
  return (
    <Provider store={store}>
      <View style={{ flex: 1 }}>
        <NavigationContainer linking={linking}>
          <Router />
        </NavigationContainer>
      </View>
    </Provider>
  );
}

const styles = StyleSheet.create({});
