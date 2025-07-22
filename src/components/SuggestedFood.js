import React from "react";
import { View, Text, FlatList, Image, StyleSheet } from "react-native";

const suggestedFoods = [
  {
    id: "1",
    name: "Salad cá hồi",
    image: "https://placehold.co/100x100.png?text=Salad",
  },
  {
    id: "2",
    name: "Ức gà nướng",
    image: "https://placehold.co/100x100.png?text=Gà",
  },
  {
    id: "3",
    name: "Sinh tố bơ",
    image: "https://placehold.co/100x100.png?text=Bơ",
  },
];

const SuggestedFood = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gợi ý thực đơn cho bạn</Text>
      <FlatList
        data={suggestedFoods}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.foodItem}>
            <Image source={{ uri: item.image }} style={styles.foodImage} />
            <Text style={styles.foodName}>{item.name}</Text>
          </View>
        )}
      />
    </View>
  );
};

export default SuggestedFood;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  foodItem: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  foodImage: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
  foodName: { fontSize: 16 },
});
