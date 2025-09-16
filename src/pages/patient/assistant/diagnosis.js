import React, { useState, useEffect } from "react";
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import { useDispatch, useSelector } from "react-redux";
import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";
import { useNavigation } from "@react-navigation/native";
import ChatBox from "./ChatBox";
import FormPatient from "./FormPatient"

const TopTab = createMaterialTopTabNavigator();

const Diagnosis = () => {

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
                    name="Chuẩn đoán"
                    component={FormPatient}
                    options={{
                        tabBarLabel: ({ focused, color }) => (
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <Text
                                    style={{ color, fontWeight: focused ? "bold" : "normal" }}
                                >
                                    Chuẩn đoán
                                </Text>
                            </View>
                        ),
                    }}
                />
                <TopTab.Screen
                    name="Trợ lý AI"
                    component={ChatBox}
                    options={{
                        tabBarLabel: ({ focused, color }) => (
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <Text
                                    style={{ color, fontWeight: focused ? "bold" : "normal" }}
                                >
                                    Trợ lý AI
                                </Text>
                            </View>
                        ),
                    }}
                />
            </TopTab.Navigator>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        color: '#2196F3',
        marginBottom: 12,
        fontWeight: 'bold',
    },
    text: {
        fontSize: 16,
        color: '#333',
        marginBottom: 24,
        textAlign: 'center',
    },
});

export default Diagnosis;
