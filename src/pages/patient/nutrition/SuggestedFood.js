import React, { useEffect, useRef, useState } from "react";
import { View, Text, FlatList, Image, StyleSheet } from "react-native";
import { useSelector, useDispatch } from "react-redux";
import { suggestFoodsByAi, updateMenuFood, getMenuFood } from '../../../redux/foodAiSlice'
import { setWithExpiry, getWithExpiry } from '../../../components/customizeStorage'

const SuggestedFood = () => {
  const dispatch = useDispatch();
  let user = useSelector((state) => state.auth.user);
  const [confirmedIndex, setConfirmedIndex] = useState(null);
  const [kcalGroups, setKcalGroups] = useState([]);

  // kiểm tra calo hiện tại
  useEffect(() => {
    const fetchMenuFood = async () => {
      let data = await dispatch(getMenuFood())
      let menuFood = data.payload.DT

      setKcalGroups(
        menuFood.map(m => ({
          range: `${m.caloMin} – ${m.caloMax} kcal`,
          category: m.title,
          target: m.description,
          img: m.image,
          id: m._id,
        }))
      );

      // 👉 nếu user._id có trong mảng userIds thì set confirmedIndex
      menuFood.forEach((m, idx) => {
        if (m.userId?.includes(user.userID)) {
          setConfirmedIndex(idx);
        }
      });
    }

    fetchMenuFood();
  }, [user.userID]);

  const handleConfirm = async (item, index) => {
    setConfirmedIndex(index)    // chuyển trạng thái xác nhận

    let res = await dispatch(updateMenuFood({ menuFoodId: item.id, userId: user.userID }))
    if (res.payload.EC === 0) {
      let data = res.payload.DT.menuFood

      let response = await dispatch(suggestFoodsByAi({
        min: data.caloMin,
        max: data.caloMax,
        mean: 6,
        currentCalo: data.caloCurrent,
        menuFoodId: data._id
      }))

      if (response.payload) {
        setWithExpiry("food", JSON.stringify(response.payload.result));
      }
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chào mừng đến với HealthTabs!</Text>
      <Text style={styles.text}>Đây là màn hình React Native cơ bản.</Text>
    </View>
  );
};

export default SuggestedFood;

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#fff',
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
