import React from "react";
import {
  View,
  SafeAreaView,
  StyleSheet,
  StatusBar,
  Platform,
} from "react-native";
import { Provider } from "react-redux";
import { store } from "./src/redux/store";
import Router from "./src/routes/Router";
import { NavigationContainer } from "@react-navigation/native";

export default function App() {
  return (
    <Provider store={store}>
      <View
        style={{
          flex: 1,
          paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
        }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <NavigationContainer>
            <Router />
          </NavigationContainer>
        </SafeAreaView>
      </View>
    </Provider>
  );
}
