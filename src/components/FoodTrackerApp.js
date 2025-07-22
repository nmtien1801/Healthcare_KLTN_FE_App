import React, { useState } from "react";
import { View, Text, TextInput, Button, FlatList, StyleSheet } from "react-native";

const FoodTrackerApp = () => {
  const [food, setFood] = useState("");
  const [myFoods, setMyFoods] = useState([]);

  const addFood = () => {
    if (food.trim() === "") return;
    setMyFoods([...myFoods, { id: Date.now().toString(), name: food }]);
    setFood("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thực đơn của bạn</Text>
      <View style={styles.inputRow}>
        <TextInput
          placeholder="Nhập món ăn"
          value={food}
          onChangeText={setFood}
          style={styles.input}
        />
        <Button title="Thêm" onPress={addFood} />
      </View>

      <FlatList
        data={myFoods}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Text style={styles.foodItem}>• {item.name}</Text>}
      />
    </View>
  );
};

export default FoodTrackerApp;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  inputRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 8, marginRight: 8 },
  foodItem: { fontSize: 16, marginVertical: 4 },
});
