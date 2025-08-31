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
  return (
    <Provider store={store}>
      <View style={{ flex: 1 }}>
        <NavigationContainer>
          <Router />
        </NavigationContainer>
      </View>
    </Provider>
  );
}

const styles = StyleSheet.create({});
