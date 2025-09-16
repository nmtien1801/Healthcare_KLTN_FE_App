import AsyncStorage from "@react-native-async-storage/async-storage";

const EXPIRE_FOOD = 86400000; // 1 ngày = ms

// Lưu vào AsyncStorage với thời gian hết hạn
export const setWithExpiry = async (key, value) => {
  const now = new Date();

  const item = {
    value,
    expiry: now.getTime() + EXPIRE_FOOD,
  };

  try {
    await AsyncStorage.setItem(key, JSON.stringify(item));
  } catch (err) {
    console.error("AsyncStorage setWithExpiry error:", err);
  }
};

// Lấy ra từ AsyncStorage, nếu hết hạn thì xoá và trả null
export const getWithExpiry = async (key) => {
  try {
    const itemStr = await AsyncStorage.getItem(key);
    if (!itemStr) return null;

    const item = JSON.parse(itemStr);
    const now = new Date();

    if (now.getTime() > item.expiry) {
      await AsyncStorage.removeItem(key);
      return null;
    }

    return item.value; // trả về value gốc luôn
  } catch (err) {
    console.error("AsyncStorage getWithExpiry error:", err);
    return null;
  }
};
