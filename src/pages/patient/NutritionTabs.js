import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useSelector, useDispatch } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import FoodTrackerApp from "./nutrition/FoodTrackerApp";
import SuggestedFood from "./nutrition/SuggestedFood";

const TopTab = createMaterialTopTabNavigator();

export default function NutritionTabs({ }) {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  return (
    <View style={{ flex: 1 }}>
      <TopTab.Navigator
        screenOptions={{
          tabBarActiveTintColor: "#2196F3",
          tabBarInactiveTintColor: "gray",
          tabBarIndicatorStyle: { backgroundColor: "#2196F3" },
        }}
      >
        <TopTab.Screen
          name="Thực đơn của bạn"
          component={FoodTrackerApp}
          options={{
            tabBarLabel: ({ focused, color }) => (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={{ color, fontWeight: focused ? "bold" : "normal" }}
                >
                  Thực đơn của bạn
                </Text>
              </View>
            ),
          }}
        />
        <TopTab.Screen
          name="Khám phá thực đơn"
          component={SuggestedFood}
          options={{
            tabBarLabel: ({ focused, color }) => (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={{ color, fontWeight: focused ? "bold" : "normal" }}
                >
                  Khám phá thực đơn
                </Text>
              </View>
            ),
          }}
        />
      </TopTab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({});
